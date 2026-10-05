/**
 * simulate.ts — the quasi-steady-state single-zone orchestrator (Requirements 4.1, 4.7, 7a).
 *
 * Heat gains depend on the indoor temperature T_in (envelope, roof sol-air, and ventilation
 * all scale with ΔT), so we model gains as a function gains(T_in) and resolve T_in against a
 * FINITE HVAC capacity:
 *
 *   1. required_load = max(0, gains(setpoint))
 *   2. if required_load <= capacity   -> hold setpoint       (basis = 'setpoint')
 *   3. if required_load  > capacity   -> solve gains(T_in)=capacity via bounded bisection
 *                                        (basis = 'equilibrium')
 *   4. if AC off                      -> cooling 0, T_in drifts to outdoor (basis='ac_off')
 *
 * HVAC electricity: P = cooling_load / COP; E = P * effective_runtime_hours.
 * Lighting electricity is computed INDEPENDENTLY from lighting hours (not HVAC hours).
 */

import { CONSTANTS } from '../data/constants';
import type { HeatGains, Scenario, SimulationResult } from './types';
import { deriveGeometry } from './geometry';
import { resolveEffectiveParams, type EffectiveParams } from './effective';
import { envelopeConductionW } from './envelopeModel';
import { roofConductionW } from './roofModel';
import { glazingSolarGainW } from './solarModel';
import { occupancyGainW, lightingGainW, plugGainW } from './internalGains';
import { ventilationLoadW } from './ventilationModel';
import { classifyComfort } from './comfortModel';

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/** Compute all sensible heat gains (W) at a given indoor temperature. */
function computeGains(
  scenario: Scenario,
  eff: EffectiveParams,
  geom: { volume_m3: number; opaque_wall_area_m2: number; roof_area_m2: number },
  indoor_temp_c: number
): HeatGains {
  const { room, environment, operation } = scenario;

  const envelope = envelopeConductionW({
    wall_u_value: eff.wall_u_value,
    opaque_wall_area_m2: geom.opaque_wall_area_m2,
    window_u_value: eff.window_u_value,
    window_area_m2: room.window_area_m2,
    outdoor_temp_c: environment.outdoor_temp_c,
    indoor_temp_c,
  });

  const roof = roofConductionW({
    roof_u_value: eff.roof_u_value,
    roof_area_m2: geom.roof_area_m2,
    roof_absorptance: eff.roof_absorptance,
    solar_irradiance_w_m2: environment.solar_irradiance_w_m2,
    outdoor_temp_c: environment.outdoor_temp_c,
    indoor_temp_c,
  });

  const solar = glazingSolarGainW({
    window_area_m2: room.window_area_m2,
    window_shgc: eff.window_shgc,
    solar_irradiance_w_m2: environment.solar_irradiance_w_m2,
    orientation_factor: eff.orientation_factor,
    shading_factor: eff.shading_factor,
  });

  const occupancy = occupancyGainW(operation.occupancy);
  const lighting = lightingGainW(eff.effective_lpd_w_m2, room.floor_area_m2);
  const plug = plugGainW(operation.plug_load_w_m2, room.floor_area_m2);
  const ventilation = ventilationLoadW({
    ventilation_ach: operation.ventilation_ach,
    volume_m3: geom.volume_m3,
    outdoor_temp_c: environment.outdoor_temp_c,
    indoor_temp_c,
  });

  const total = envelope + roof + solar + occupancy + lighting + plug + ventilation;
  return {
    envelope: safe(envelope),
    roof: safe(roof),
    solar: safe(solar),
    occupancy: safe(occupancy),
    lighting: safe(lighting),
    plug: safe(plug),
    ventilation: safe(ventilation),
    total: safe(total),
  };
}

/**
 * Solve for the equilibrium indoor temperature where gains(T_in) == capacity_w, via bounded
 * bisection. gains(T_in) is monotonically DECREASING in T_in (ΔT terms shrink as T_in rises),
 * so a unique root exists when gains(setpoint) > capacity. Deterministic: fixed tol + iter cap.
 */
function solveEquilibriumTemp(
  scenario: Scenario,
  eff: EffectiveParams,
  geom: { volume_m3: number; opaque_wall_area_m2: number; roof_area_m2: number },
  capacity_w: number
): number {
  const { t_min_c, t_max_c, tol_c, max_iter } = CONSTANTS.equilibrium_solver;
  let lo: number = Math.max(t_min_c, scenario.operation.ac_setpoint_c);
  let hi: number = t_max_c;

  const g = (t: number) => computeGains(scenario, eff, geom, t).total - capacity_w;

  // g(lo) should be >= 0 (gains exceed capacity at the setpoint). If g(hi) is still > 0,
  // clamp to hi (room cannot be cooled below outdoor-driven equilibrium within bracket).
  if (g(hi) > 0) return hi;

  for (let i = 0; i < max_iter; i++) {
    const mid = (lo + hi) / 2;
    const gm = g(mid);
    if (Math.abs(gm) < 1e-6 || hi - lo < tol_c) return mid;
    if (gm > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function simulate(scenario: Scenario): SimulationResult {
  const eff = resolveEffectiveParams(scenario);
  const fullGeom = deriveGeometry(scenario.room);
  const geom = {
    volume_m3: fullGeom.volume_m3,
    opaque_wall_area_m2: fullGeom.opaque_wall_area_m2,
    roof_area_m2: fullGeom.roof_area_m2,
  };

  const { operation } = scenario;
  const setpoint = operation.ac_setpoint_c;
  const capacityW = Math.max(0, operation.hvac_capacity_kw) * 1000;

  // Required load to hold the setpoint (floored at 0 — no negative cooling).
  const gainsAtSetpoint = computeGains(scenario, eff, geom, setpoint);
  const requiredLoadW = Math.max(0, gainsAtSetpoint.total);

  let indoor_temp_c: number;
  let indoor_temp_basis: SimulationResult['indoor_temp_basis'];
  let cooling_load_w: number;
  let capacity_limited = false;
  let gains: HeatGains;

  if (!operation.ac_on) {
    // AC off: no cooling; indoor drifts toward outdoor (simplified: equals outdoor air temp).
    indoor_temp_c = scenario.environment.outdoor_temp_c;
    indoor_temp_basis = 'ac_off';
    cooling_load_w = 0;
    gains = computeGains(scenario, eff, geom, indoor_temp_c);
  } else if (requiredLoadW <= capacityW) {
    // Within capacity: hold the setpoint.
    indoor_temp_c = setpoint;
    indoor_temp_basis = 'setpoint';
    cooling_load_w = requiredLoadW;
    gains = gainsAtSetpoint;
  } else {
    // Capacity-limited: solve for the elevated equilibrium temperature.
    capacity_limited = true;
    indoor_temp_c = solveEquilibriumTemp(scenario, eff, geom, capacityW);
    indoor_temp_basis = 'equilibrium';
    cooling_load_w = capacityW;
    gains = computeGains(scenario, eff, geom, indoor_temp_c);
  }

  // --- HVAC electricity ---
  const cop = operation.hvac_cop > 0 ? operation.hvac_cop : CONSTANTS.default_hvac_cop;
  const hvac_power_kw = operation.ac_on ? cooling_load_w / 1000 / cop : 0;
  const effective_ac_hours = operation.ac_on ? Math.max(0, eff.effective_ac_hours) : 0;
  const hvac_kwh_day = safe(hvac_power_kw * effective_ac_hours);

  // --- Lighting electricity: INDEPENDENT of HVAC hours (Requirement 7a) ---
  const lighting_kw = (eff.effective_lpd_w_m2 * Math.max(0, scenario.room.floor_area_m2)) / 1000;
  const lighting_kwh_day = safe(lighting_kw * Math.max(0, eff.effective_lighting_hours));

  // --- Fan electricity: adds consumption, improves comfort proxy only ---
  // Fan runtime is DECOUPLED from HVAC runtime: the fan runs during OCCUPIED hours
  // (ac_hours_per_day × occupied_fraction), representing the "higher setpoint + fan-assisted
  // comfort" strategy rather than running whenever the AC is scheduled on.
  const fan_hours_per_day = scenario.interventions.fan_enabled
    ? Math.max(0, operation.ac_hours_per_day) * clamp01(operation.occupied_fraction)
    : 0;
  const fan_kwh_day = safe((eff.fan_power_w / 1000) * fan_hours_per_day);

  // --- Plug electricity (optional) ---
  const plug_kwh_day = safe(
    (plugGainW(operation.plug_load_w_m2, scenario.room.floor_area_m2) / 1000) *
      Math.max(0, operation.ac_hours_per_day)
  );

  const total_kwh_day = safe(hvac_kwh_day + lighting_kwh_day + fan_kwh_day + plug_kwh_day);

  // --- Comfort: fan lowers PERCEIVED temperature only, never the air temperature ---
  const perceived_temp_c = scenario.interventions.fan_enabled
    ? indoor_temp_c - CONSTANTS.fan_comfort_offset_c
    : indoor_temp_c;
  const comfort = classifyComfort(perceived_temp_c);

  return {
    geometry: fullGeom,
    gains,
    required_load_w: safe(requiredLoadW),
    cooling_load_w: safe(Math.max(0, cooling_load_w)),
    capacity_limited,
    hvac_power_kw: safe(Math.max(0, hvac_power_kw)),
    effective_ac_hours,
    hvac_kwh_day: Math.max(0, hvac_kwh_day),
    lighting_kwh_day: Math.max(0, lighting_kwh_day),
    fan_kwh_day: Math.max(0, fan_kwh_day),
    plug_kwh_day: Math.max(0, plug_kwh_day),
    total_kwh_day: Math.max(0, total_kwh_day),
    indoor_temp_c: safe(indoor_temp_c),
    indoor_temp_basis,
    perceived_temp_c: safe(perceived_temp_c),
    comfort,
    effective_lpd_w_m2: eff.effective_lpd_w_m2,
    effective_lighting_hours: eff.effective_lighting_hours,
  };
}
