/**
 * phase5.test.ts — tests for hourly simulation, optimisation, economics, and the weather
 * CSV loader (Requirements 12, 15).
 */

import { describe, it, expect } from 'vitest';
import { cloneBaseline } from '../data/baselineScenario';
import { simulate } from './simulate';
import { parseWeatherCsv, sampleSingaporeDay } from '../data/weatherLoader';
import { simulateHourly, defaultSchedule } from './hourlySimulation';
import { optimise, describeInterventions } from './optimise';
import { computeEconomics, sustainabilitySummary } from './economics';

describe('weather CSV loader (Requirement 12.2)', () => {
  it('parses a valid CSV', () => {
    const csv = [
      'timestamp,temperature_c,relative_humidity_pct,solar_irradiance_w_m2,wind_speed_m_s',
      '00:00,26,88,0,1.0',
      '12:00,33,67,900,2.0',
    ].join('\n');
    const { rows, errors } = parseWeatherCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[1].temperature_c).toBe(33);
    expect(rows[1].wind_speed_m_s).toBe(2);
  });

  it('reports missing required columns', () => {
    const { errors } = parseWeatherCsv('timestamp,temperature_c\n00:00,26');
    expect(errors.some((e) => /relative_humidity_pct/.test(e))).toBe(true);
  });

  it('skips non-numeric rows but keeps valid ones', () => {
    const csv = [
      'temperature_c,relative_humidity_pct,solar_irradiance_w_m2',
      'abc,88,0',
      '30,70,500',
    ].join('\n');
    const { rows, errors } = parseWeatherCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('sample day has 24 hours', () => {
    expect(sampleSingaporeDay()).toHaveLength(24);
  });
});

describe('hourly simulation (Requirement 12.3)', () => {
  it('produces 24 steps with finite, non-negative energy', () => {
    const res = simulateHourly(cloneBaseline(), sampleSingaporeDay());
    expect(res.steps).toHaveLength(24);
    for (const s of res.steps) {
      expect(Number.isFinite(s.indoor_temp_c)).toBe(true);
      expect(s.total_kwh).toBeGreaterThanOrEqual(0);
    }
    expect(res.totals.total_kwh_day).toBeGreaterThan(0);
  });

  it('no HVAC energy or occupancy in unscheduled (night) hours', () => {
    const res = simulateHourly(cloneBaseline(), sampleSingaporeDay(), defaultSchedule());
    const night = res.steps[3]; // 03:00
    expect(night.ac_on).toBe(false);
    expect(night.hvac_kwh).toBe(0);
    expect(night.occupancy).toBe(0);
  });

  it('indoor temp tracks setpoint during scheduled hours with ample capacity', () => {
    const s = cloneBaseline();
    s.operation.hvac_capacity_kw = 100;
    const res = simulateHourly(s, sampleSingaporeDay());
    const noon = res.steps[12];
    expect(noon.ac_on).toBe(true);
    expect(noon.indoor_temp_c).toBeCloseTo(s.operation.ac_setpoint_c, 1);
  });

  it('hotter weather increases daily HVAC energy', () => {
    const base = sampleSingaporeDay();
    const hot = base.map((r) => ({ ...r, temperature_c: r.temperature_c + 5 }));
    const a = simulateHourly(cloneBaseline(), base).totals.hvac_kwh_day;
    const b = simulateHourly(cloneBaseline(), hot).totals.hvac_kwh_day;
    expect(b).toBeGreaterThan(a);
  });
});

describe('optimisation (Requirement 15.1)', () => {
  it('returns a recommended acceptable config that is <= baseline energy', () => {
    const base = cloneBaseline();
    const res = optimise(base);
    expect(res.recommended).not.toBeNull();
    expect(res.recommended!.total_kwh_day).toBeLessThanOrEqual(res.baselineTotal + 1e-9);
    expect(['comfortable', 'borderline']).toContain(res.recommended!.comfort);
    expect(res.estimatedReductionPct).toBeGreaterThanOrEqual(0);
    expect(res.evaluated).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const a = optimise(cloneBaseline()).recommended!.total_kwh_day;
    const b = optimise(cloneBaseline()).recommended!.total_kwh_day;
    expect(a).toBe(b);
  });

  it('describeInterventions lists the setpoint and active toggles', () => {
    const s = cloneBaseline();
    s.interventions.fan_enabled = true;
    s.interventions.low_e_glazing = true;
    const desc = describeInterventions(s);
    expect(desc.some((d) => /setpoint/i.test(d))).toBe(true);
    expect(desc).toContain('Ceiling fan');
    expect(desc).toContain('Low-E glazing');
  });
});

describe('economics & sustainability (Requirements 15.2, 15.3, 7.4)', () => {
  it('a saving scenario yields positive annual saving and finite payback', () => {
    const baseline = cloneBaseline();
    const scenario = cloneBaseline();
    scenario.operation.ac_setpoint_c = 25;
    scenario.interventions.daylight_lighting_control = true;
    scenario.interventions.external_shading = 'moderate';

    const br = simulate(baseline);
    const sr = simulate(scenario);
    const econ = computeEconomics(br, sr, scenario, baseline);

    expect(econ.daily_saving_kwh).toBeGreaterThan(0);
    expect(econ.annual_saving_sgd).toBeGreaterThan(0);
    expect(econ.capital_cost_sgd).toBeGreaterThan(0);
    expect(econ.simple_payback_years).not.toBeNull();
    expect(econ.simple_payback_years!).toBeGreaterThan(0);
  });

  it('no-saving scenario yields null payback', () => {
    const baseline = cloneBaseline();
    const scenario = cloneBaseline(); // identical => zero saving
    const br = simulate(baseline);
    const sr = simulate(scenario);
    const econ = computeEconomics(br, sr, scenario, baseline);
    expect(econ.daily_saving_kwh).toBeCloseTo(0, 9);
    expect(econ.simple_payback_years).toBeNull();
  });

  it('sustainability summary reports all three dimensions', () => {
    const baseline = cloneBaseline();
    const scenario = cloneBaseline();
    scenario.operation.ac_setpoint_c = 25;
    const summary = sustainabilitySummary(simulate(baseline), simulate(scenario), scenario, baseline);
    expect(summary.environmental.daily_electricity_delta_kwh).toBeLessThan(0); // less energy
    expect(summary.environmental.annual_co2_delta_kg).toBeLessThan(0);
    expect(summary.economic).toBeDefined();
    expect(summary.social.comfort).toBeDefined();
  });
});
