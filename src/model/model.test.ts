/**
 * model.test.ts — unit + sanity/monotonicity + edge-case tests (Requirement 14).
 */

import { describe, it, expect } from 'vitest';
import { cloneBaseline } from '../data/baselineScenario';
import { simulate } from './simulate';
import { compare } from './compare';
import { validateScenario, deriveGeometry } from './geometry';
import { envelopeConductionW } from './envelopeModel';
import { roofSolAirTempC, roofConductionW } from './roofModel';
import { glazingSolarGainW } from './solarModel';
import { occupancyGainW } from './internalGains';
import { ventilationLoadW } from './ventilationModel';
import { classifyComfort } from './comfortModel';
import type { Scenario } from './types';

function s(): Scenario {
  return cloneBaseline();
}

// Assert a simulation result contains no NaN/Infinity/negative electricity.
function assertFinitePositive(r: ReturnType<typeof simulate>) {
  for (const v of [r.hvac_kwh_day, r.lighting_kwh_day, r.fan_kwh_day, r.plug_kwh_day, r.total_kwh_day]) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
  expect(Number.isFinite(r.indoor_temp_c)).toBe(true);
}

describe('unit: component physics', () => {
  it('envelope: Q = U*A*ΔT', () => {
    const q = envelopeConductionW({
      wall_u_value: 1,
      opaque_wall_area_m2: 10,
      window_u_value: 2,
      window_area_m2: 5,
      outdoor_temp_c: 30,
      indoor_temp_c: 20,
    });
    // walls: 1*10*10=100, window: 2*5*10=100 => 200 W
    expect(q).toBeCloseTo(200, 6);
  });

  it('roof sol-air: lower absorptance => lower sol-air temp', () => {
    const hi = roofSolAirTempC({ outdoor_temp_c: 31, roof_absorptance: 0.75, solar_irradiance_w_m2: 500, h_o: 25 });
    const lo = roofSolAirTempC({ outdoor_temp_c: 31, roof_absorptance: 0.3, solar_irradiance_w_m2: 500, h_o: 25 });
    expect(hi).toBeGreaterThan(lo);
    // 31 + 0.75*500/25 = 31 + 15 = 46
    expect(hi).toBeCloseTo(46, 6);
  });

  it('roof conduction uses sol-air, not raw outdoor temp', () => {
    const q = roofConductionW({
      roof_u_value: 1,
      roof_area_m2: 100,
      roof_absorptance: 0.75,
      solar_irradiance_w_m2: 500,
      outdoor_temp_c: 31,
      indoor_temp_c: 23,
      h_o: 25,
    });
    // T_sol-air=46 => Q = 1*100*(46-23)=2300 W
    expect(q).toBeCloseTo(2300, 6);
  });

  it('glazing solar: Q = A*SHGC*I*Fo*Fs', () => {
    const q = glazingSolarGainW({
      window_area_m2: 25,
      window_shgc: 0.7,
      solar_irradiance_w_m2: 500,
      orientation_factor: 1.0,
      shading_factor: 1.0,
    });
    expect(q).toBeCloseTo(25 * 0.7 * 500, 6);
  });

  it('occupancy: Q = N*75', () => {
    expect(occupancyGainW(30)).toBeCloseTo(2250, 6);
    expect(occupancyGainW(0)).toBe(0);
  });

  it('ventilation: hot outdoor => positive load; higher ACH => higher load', () => {
    const base = ventilationLoadW({ ventilation_ach: 1, volume_m3: 300, outdoor_temp_c: 31, indoor_temp_c: 23 });
    const more = ventilationLoadW({ ventilation_ach: 4, volume_m3: 300, outdoor_temp_c: 31, indoor_temp_c: 23 });
    expect(base).toBeGreaterThan(0);
    expect(more).toBeGreaterThan(base);
  });
});

describe('sanity: monotonicity (Requirement 14.1)', () => {
  it('higher outdoor temp => more cooling', () => {
    const a = s();
    const b = s();
    b.environment.outdoor_temp_c += 5;
    expect(simulate(b).required_load_w).toBeGreaterThan(simulate(a).required_load_w);
  });

  it('higher occupancy => more heat load', () => {
    const a = s();
    const b = s();
    b.operation.occupancy += 20;
    expect(simulate(b).required_load_w).toBeGreaterThan(simulate(a).required_load_w);
  });

  it('higher setpoint => less cooling', () => {
    const a = s();
    const b = s();
    b.operation.ac_setpoint_c += 2;
    expect(simulate(b).required_load_w).toBeLessThan(simulate(a).required_load_w);
  });

  it('external shading => less solar gain', () => {
    const a = s();
    const b = s();
    b.interventions.external_shading = 'high';
    expect(simulate(b).gains.solar).toBeLessThan(simulate(a).gains.solar);
  });

  it('low-E glazing => less glazing solar + conduction', () => {
    const a = s();
    const b = s();
    b.interventions.low_e_glazing = true;
    const ra = simulate(a);
    const rb = simulate(b);
    expect(rb.gains.solar).toBeLessThan(ra.gains.solar);
    expect(rb.gains.envelope).toBeLessThan(ra.gains.envelope);
  });

  it('improved insulation => less envelope load', () => {
    const a = s();
    const b = s();
    b.interventions.improved_insulation = true;
    expect(simulate(b).gains.envelope).toBeLessThan(simulate(a).gains.envelope);
  });

  it('reflective roof => lower roof conduction', () => {
    const a = s();
    const b = s();
    b.interventions.reflective_roof = true;
    expect(simulate(b).gains.roof).toBeLessThan(simulate(a).gains.roof);
  });

  it('fan => more fan electricity + better comfort proxy, NOT a large air-temp drop', () => {
    const a = s();
    const b = s();
    b.interventions.fan_enabled = true;
    const ra = simulate(a);
    const rb = simulate(b);
    expect(rb.fan_kwh_day).toBeGreaterThan(ra.fan_kwh_day);
    expect(rb.perceived_temp_c).toBeLessThan(ra.perceived_temp_c);
    // Air temperature essentially unchanged by the fan.
    expect(Math.abs(rb.indoor_temp_c - ra.indoor_temp_c)).toBeLessThan(1e-9);
  });

  it('daylight lighting => less lighting electricity and less lighting heat', () => {
    const a = s();
    const b = s();
    b.interventions.daylight_lighting_control = true;
    const ra = simulate(a);
    const rb = simulate(b);
    expect(rb.lighting_kwh_day).toBeLessThan(ra.lighting_kwh_day);
    expect(rb.gains.lighting).toBeLessThan(ra.gains.lighting);
  });

  it('occupancy lighting => fewer lighting hours => less lighting electricity (heat unchanged)', () => {
    const a = s();
    const b = s();
    b.interventions.occupancy_lighting_control = true;
    const ra = simulate(a);
    const rb = simulate(b);
    expect(rb.lighting_kwh_day).toBeLessThan(ra.lighting_kwh_day);
    expect(rb.gains.lighting).toBeCloseTo(ra.gains.lighting, 6);
  });

  it('occupancy AC => less runtime when occupied fraction < 1', () => {
    const a = s();
    const b = s();
    b.interventions.occupancy_ac_control = true;
    expect(simulate(b).effective_ac_hours).toBeLessThan(simulate(a).effective_ac_hours);
  });

  it('more ventilation can INCREASE cooling load (hot-humid interaction)', () => {
    const a = s();
    const b = s();
    b.operation.ventilation_ach = 4;
    expect(simulate(b).gains.ventilation).toBeGreaterThan(simulate(a).gains.ventilation);
  });
});

describe('finite HVAC capacity & indoor temperature (Requirement 4.7)', () => {
  it('within capacity => indoor temp == setpoint', () => {
    const a = s();
    a.operation.hvac_capacity_kw = 100; // generous
    const r = simulate(a);
    expect(r.indoor_temp_basis).toBe('setpoint');
    expect(r.indoor_temp_c).toBeCloseTo(a.operation.ac_setpoint_c, 6);
    expect(r.capacity_limited).toBe(false);
  });

  it('demand above capacity => equilibrium temp > setpoint, cooling == capacity', () => {
    const a = s();
    a.operation.hvac_capacity_kw = 2; // tiny capacity
    const r = simulate(a);
    expect(r.capacity_limited).toBe(true);
    expect(r.indoor_temp_basis).toBe('equilibrium');
    expect(r.indoor_temp_c).toBeGreaterThan(a.operation.ac_setpoint_c);
    expect(r.cooling_load_w).toBeCloseTo(2000, 0);
  });

  it('gain-reducing intervention lowers equilibrium temp in capacity-limited case', () => {
    const a = s();
    a.operation.hvac_capacity_kw = 2;
    const b = structuredClone(a);
    b.interventions.external_shading = 'high';
    b.interventions.reflective_roof = true;
    b.interventions.low_e_glazing = true;
    expect(simulate(b).indoor_temp_c).toBeLessThan(simulate(a).indoor_temp_c);
  });

  it('equilibrium solver is deterministic (same inputs => same output)', () => {
    const a = s();
    a.operation.hvac_capacity_kw = 2;
    expect(simulate(a).indoor_temp_c).toBe(simulate(a).indoor_temp_c);
  });
});

describe('independent lighting hours (Requirement 7a)', () => {
  it('changing AC hours does NOT change lighting electricity', () => {
    const a = s();
    const b = s();
    b.operation.ac_hours_per_day = 24;
    expect(simulate(b).lighting_kwh_day).toBeCloseTo(simulate(a).lighting_kwh_day, 6);
  });

  it('changing lighting hours DOES change lighting electricity', () => {
    const a = s();
    const b = s();
    b.operation.lighting_hours_per_day = 24;
    expect(simulate(b).lighting_kwh_day).toBeGreaterThan(simulate(a).lighting_kwh_day);
  });
});

describe('geometry validation (Requirement 13.4)', () => {
  it('baseline is valid', () => {
    expect(validateScenario(s())).toHaveLength(0);
  });

  it('window larger than gross wall area is flagged', () => {
    const a = s();
    a.room.window_area_m2 = 100000;
    const msgs = validateScenario(a);
    expect(msgs.some((m) => m.field === 'room.window_area_m2')).toBe(true);
  });

  it('non-positive dimensions flagged', () => {
    const a = s();
    a.room.floor_area_m2 = 0;
    a.room.ceiling_height_m = 0;
    const msgs = validateScenario(a);
    expect(msgs.some((m) => m.field === 'room.floor_area_m2')).toBe(true);
    expect(msgs.some((m) => m.field === 'room.ceiling_height_m')).toBe(true);
  });

  it('derived geometry is sane for baseline', () => {
    const g = deriveGeometry(s().room);
    expect(g.volume_m3).toBeCloseTo(300, 6);
    expect(g.roof_area_m2).toBeCloseTo(100, 6);
    expect(g.opaque_wall_area_m2).toBeGreaterThan(0);
  });
});

describe('edge cases (Requirement 13)', () => {
  it('0 occupants, 0 window, 0 solar => no NaN/negative', () => {
    const a = s();
    a.operation.occupancy = 0;
    a.room.window_area_m2 = 0;
    a.environment.solar_irradiance_w_m2 = 0;
    assertFinitePositive(simulate(a));
  });

  it('outdoor temp below setpoint => no negative cooling electricity', () => {
    const a = s();
    a.environment.outdoor_temp_c = 15;
    a.environment.solar_irradiance_w_m2 = 0;
    a.operation.occupancy = 0;
    a.operation.lighting_w_m2 = 0;
    a.operation.plug_load_w_m2 = 0;
    const r = simulate(a);
    expect(r.cooling_load_w).toBe(0);
    expect(r.hvac_kwh_day).toBe(0);
    assertFinitePositive(r);
  });

  it('AC off => 0 HVAC energy, indoor drifts to outdoor', () => {
    const a = s();
    a.operation.ac_on = false;
    const r = simulate(a);
    expect(r.hvac_kwh_day).toBe(0);
    expect(r.indoor_temp_basis).toBe('ac_off');
    expect(r.indoor_temp_c).toBeCloseTo(a.environment.outdoor_temp_c, 6);
  });

  it('very high ventilation and very large/small rooms stay finite', () => {
    const big = s();
    big.room.floor_area_m2 = 100000;
    big.operation.ventilation_ach = 50;
    assertFinitePositive(simulate(big));
    const small = s();
    small.room.floor_area_m2 = 1;
    assertFinitePositive(simulate(small));
  });
});

describe('comfort classification (Requirement 6)', () => {
  it('classifies by perceived temperature within the comfort band', () => {
    expect(classifyComfort(24)).toBe('comfortable');
    expect(classifyComfort(26)).toBe('borderline');
    expect(classifyComfort(29)).toBe('outside_target');
  });
});

describe('comparison & demo (Requirements 7, 16)', () => {
  it('§44 demo scenario is model-driven and reduces total energy', () => {
    const baseline = simulate(s());
    const demo = s();
    demo.operation.ac_setpoint_c = 25;
    demo.interventions.fan_enabled = true;
    demo.interventions.external_shading = 'moderate';
    demo.interventions.occupancy_ac_control = true;
    demo.interventions.daylight_lighting_control = true;
    const scenario = simulate(demo);
    const cmp = compare(baseline, scenario);

    expect(scenario.total_kwh_day).toBeLessThan(baseline.total_kwh_day);
    expect(cmp.metrics.total_kwh_day.delta_pct).toBeLessThan(0);
    // Breakdown reports physical quantities baseline -> scenario.
    expect(cmp.impact_breakdown.length).toBeGreaterThanOrEqual(6);
    const solar = cmp.impact_breakdown.find((r) => r.label === 'Solar heat gain')!;
    expect(solar.scenario).toBeLessThan(solar.baseline);
  });
});
