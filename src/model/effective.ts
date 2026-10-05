/**
 * effective.ts — resolve interventions into EFFECTIVE physical parameters.
 *
 * This centralises how each intervention maps onto a physical quantity, so the physics
 * modules stay simple and the mapping is inspectable in one place.
 */

import { CONSTANTS } from '../data/constants';
import { GLAZING_PRESETS } from '../data/materials';
import type { Scenario } from './types';

export interface EffectiveParams {
  wall_u_value: number;
  roof_u_value: number;
  window_u_value: number;
  window_shgc: number;
  roof_absorptance: number;
  shading_factor: number;
  orientation_factor: number;
  effective_lpd_w_m2: number;
  effective_lighting_hours: number;
  effective_ac_hours: number;
  fan_power_w: number;
}

export function resolveEffectiveParams(scenario: Scenario): EffectiveParams {
  const { room, operation, interventions } = scenario;

  // --- Glazing: low-E toggle overrides U-value & SHGC with the low-E preset ---
  const glazing = interventions.low_e_glazing ? GLAZING_PRESETS.low_e : GLAZING_PRESETS.standard;
  // If the user explicitly set a glazing_preset we honour the toggle result; the toggle is
  // the primary control per the interventions model.
  const window_u_value = interventions.low_e_glazing ? glazing.u_value : room.window_u_value;
  const window_shgc = interventions.low_e_glazing ? glazing.shgc : room.window_shgc;

  // --- Insulation: multiply baseline U-values. "improved_insulation" bumps the level up. ---
  let insulationLevel = room.insulation_level;
  if (interventions.improved_insulation && insulationLevel === 'baseline') {
    insulationLevel = 'high';
  }
  const uMult = CONSTANTS.insulation_u_multiplier[insulationLevel];
  const wall_u_value = room.wall_u_value * uMult;
  const roof_u_value = room.roof_u_value * uMult;

  // --- Reflective roof: lower solar absorptance ---
  const roof_absorptance = interventions.reflective_roof
    ? CONSTANTS.roof_absorptance.reflective
    : room.roof_solar_absorptance;

  // --- Shading & orientation factors for glazing solar gain ---
  const shading_factor = CONSTANTS.shading_factor[interventions.external_shading];
  const orientation_factor = CONSTANTS.orientation_factor[room.orientation];

  // --- Lighting: daylight control reduces POWER (LPD); occupancy control reduces HOURS ---
  const effective_lpd_w_m2 = interventions.daylight_lighting_control
    ? operation.lighting_w_m2 * CONSTANTS.daylight_lighting_factor
    : operation.lighting_w_m2;
  const effective_lighting_hours = interventions.occupancy_lighting_control
    ? operation.lighting_hours_per_day * CONSTANTS.occupancy_lighting_factor
    : operation.lighting_hours_per_day;

  // --- Occupancy-responsive AC: reduce effective runtime by occupied fraction ---
  const effective_ac_hours = interventions.occupancy_ac_control
    ? operation.ac_hours_per_day * clamp01(operation.occupied_fraction)
    : operation.ac_hours_per_day;

  const fan_power_w = interventions.fan_enabled ? CONSTANTS.default_fan_power_w : 0;

  return {
    wall_u_value,
    roof_u_value,
    window_u_value,
    window_shgc,
    roof_absorptance,
    shading_factor,
    orientation_factor,
    effective_lpd_w_m2,
    effective_lighting_hours,
    effective_ac_hours,
    fan_power_w,
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
