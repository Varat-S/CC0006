/**
 * cleanup.test.ts — regression tests for the final-cleanup fixes.
 */

import { describe, it, expect } from 'vitest';
import { cloneBaseline } from '../data/baselineScenario';
import { simulate } from './simulate';
import { classifyComfort } from './comfortModel';
import { COMFORT_LIMITS } from '../data/comfortLimits';
import { simulateHourly } from './hourlySimulation';
import { sampleSingaporeDay } from '../data/weatherLoader';
import { PARAMETER_PROVENANCE } from '../data/provenance';
import { GLAZING_PRESETS, ROOF_PRESETS } from '../data/materials';
import { ECONOMICS } from '../data/economics';

describe('Fix 1 — comfort lower + upper bounds', () => {
  it('very cold room is outside target (overcooling no longer comfortable)', () => {
    expect(classifyComfort(18)).toBe('outside_target');
  });
  it('slightly cool room is borderline', () => {
    expect(classifyComfort(22.5)).toBe('borderline'); // between borderline_min and comfortable_min
  });
  it('normal comfort range is comfortable', () => {
    expect(classifyComfort(24)).toBe('comfortable');
  });
  it('slightly warm room is borderline', () => {
    expect(classifyComfort(26)).toBe('borderline'); // between comfortable_max and borderline_max
  });
  it('very warm room is outside target', () => {
    expect(classifyComfort(30)).toBe('outside_target');
  });
  it('boundaries behave as specified', () => {
    expect(classifyComfort(COMFORT_LIMITS.comfortable_min_c)).toBe('comfortable');
    expect(classifyComfort(COMFORT_LIMITS.comfortable_max_c)).toBe('comfortable');
    expect(classifyComfort(COMFORT_LIMITS.borderline_min_c - 0.1)).toBe('outside_target');
    expect(classifyComfort(COMFORT_LIMITS.borderline_max_c + 0.1)).toBe('outside_target');
  });

  it('a very low AC setpoint is NOT reported comfortable (end-to-end)', () => {
    const s = cloneBaseline();
    s.operation.ac_setpoint_c = 18;
    s.operation.hvac_capacity_kw = 100; // ample, so it actually holds 18 C
    expect(simulate(s).comfort).toBe('outside_target');
  });
});

describe('Fix 3 — hourly total includes plug electricity', () => {
  it('total_kwh == hvac + lighting + fan + plug for every step', () => {
    const res = simulateHourly(cloneBaseline(), sampleSingaporeDay());
    for (const s of res.steps) {
      expect(s.total_kwh).toBeCloseTo(s.hvac_kwh + s.lighting_kwh + s.fan_kwh + s.plug_kwh, 9);
    }
  });
  it('daily total == sum of component daily totals (incl. plug)', () => {
    const t = simulateHourly(cloneBaseline(), sampleSingaporeDay()).totals;
    expect(t.total_kwh_day).toBeCloseTo(
      t.hvac_kwh_day + t.lighting_kwh_day + t.fan_kwh_day + t.plug_kwh_day,
      9
    );
    expect(t.plug_kwh_day).toBeGreaterThan(0); // baseline has plug load during occupied hours
  });
});

describe('Fix 5 — fan runtime decoupled from HVAC runtime', () => {
  it('single-point: fan energy = fan_power × ac_hours × occupied_fraction', () => {
    const s = cloneBaseline();
    s.interventions.fan_enabled = true;
    s.operation.ac_hours_per_day = 12;
    s.operation.occupied_fraction = 0.5;
    // 50 W fan × 12 h × 0.5 = 0.3 kWh/day
    expect(simulate(s).fan_kwh_day).toBeCloseTo((50 / 1000) * 12 * 0.5, 6);
  });

  it('fan energy scales with occupied_fraction, not with AC on/off alone', () => {
    const a = cloneBaseline();
    a.interventions.fan_enabled = true;
    a.operation.occupied_fraction = 1;
    const b = cloneBaseline();
    b.interventions.fan_enabled = true;
    b.operation.occupied_fraction = 0.5;
    expect(simulate(b).fan_kwh_day).toBeLessThan(simulate(a).fan_kwh_day);
  });

  it('hourly: fan runs during occupied hours even if that hour AC were off', () => {
    const s = cloneBaseline();
    s.interventions.fan_enabled = true;
    const res = simulateHourly(s, sampleSingaporeDay());
    const occupiedSteps = res.steps.filter((x) => x.occupancy > 0);
    // Every occupied hour runs the fan.
    expect(occupiedSteps.every((x) => x.fan_on && x.fan_kwh > 0)).toBe(true);
    // Night (unoccupied) hours do not.
    const night = res.steps.find((x) => x.occupancy === 0)!;
    expect(night.fan_on).toBe(false);
    expect(night.fan_kwh).toBe(0);
  });
});

describe('Fix 2 — sourced core parameters have non-null title/url', () => {
  const SOURCED = [
    'environment.outdoor_temp_c',
    'environment.outdoor_rh_pct',
    'environment.solar_irradiance_w_m2',
    'constants.person_sensible_w',
    'constants.air_density',
    'constants.air_cp',
    'constants.outside_surface_h_o',
    'room.roof_solar_absorptance',
    'constants.fan_comfort_offset_c',
    'operation.hvac_cop',
    'constants.comfort_limits',
    'constants.grid_co2_kg_per_kwh',
    'room.window_u_value',
    'room.window_shgc',
  ];

  it('each sourced core parameter has a non-null sourceTitle and sourceUrl', () => {
    for (const key of SOURCED) {
      const p = PARAMETER_PROVENANCE[key];
      expect(p, `missing provenance for ${key}`).toBeDefined();
      expect(p.sourceClass).not.toBe('ASSUMPTION');
      expect(p.sourceTitle.length).toBeGreaterThan(0);
      expect(p.sourceUrl, `null url for ${key}`).not.toBeNull();
      expect(p.accessedDate, `null accessedDate for ${key}`).not.toBeNull();
    }
  });

  it('material presets carry sourced provenance with URLs', () => {
    for (const g of Object.values(GLAZING_PRESETS)) {
      expect(g.provenance.sourceUrl).not.toBeNull();
      expect(g.provenance.accessedDate).not.toBeNull();
    }
    for (const r of Object.values(ROOF_PRESETS)) {
      expect(r.provenance.sourceUrl).not.toBeNull();
      expect(r.provenance.accessedDate).not.toBeNull();
    }
  });
});

describe('Fix 6 — grid emission factor comes from config, not model logic', () => {
  it('ECONOMICS exposes a numeric grid factor', () => {
    expect(typeof ECONOMICS.grid_co2_kg_per_kwh).toBe('number');
    expect(ECONOMICS.grid_co2_kg_per_kwh).toBeGreaterThan(0);
  });
});
