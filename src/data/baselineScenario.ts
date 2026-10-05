/**
 * baselineScenario.ts — the default ILLUSTRATIVE representative room (handoff §7).
 *
 * LABEL: "Illustrative representative room. Not measured NTU operational data."
 * The user can always reset to this baseline.
 */

import type { Scenario } from '../model/types';
import { GLAZING_PRESETS, ROOF_PRESETS } from './materials';
import { CONSTANTS } from './constants';

export const BASELINE_LABEL = 'Illustrative representative room. Not measured NTU operational data.';

export const baselineScenario: Scenario = {
  room: {
    floor_area_m2: 100,
    ceiling_height_m: 3,
    window_area_m2: 25,
    orientation: 'west',
    glazing_preset: 'standard',
    wall_u_value: 1.5,
    roof_u_value: ROOF_PRESETS.standard.u_value,
    window_u_value: GLAZING_PRESETS.standard.u_value,
    window_shgc: GLAZING_PRESETS.standard.shgc,
    roof_solar_absorptance: ROOF_PRESETS.standard.absorptance,
    insulation_level: 'baseline',
  },
  environment: {
    outdoor_temp_c: 31,
    outdoor_rh_pct: 75,
    solar_irradiance_w_m2: 500,
    wind_speed_m_s: 1.5,
  },
  operation: {
    occupancy: 30,
    ac_setpoint_c: 23,
    ventilation_ach: 1.0,
    lighting_w_m2: 8,
    plug_load_w_m2: CONSTANTS.default_plug_load_w_m2,
    ac_hours_per_day: 12,
    lighting_hours_per_day: 12,
    hvac_cop: CONSTANTS.default_hvac_cop,
    hvac_capacity_kw: CONSTANTS.default_hvac_capacity_kw,
    occupied_fraction: 0.7,
    ac_on: true,
  },
  interventions: {
    fan_enabled: false,
    external_shading: 'none',
    occupancy_ac_control: false,
    daylight_lighting_control: false,
    occupancy_lighting_control: false,
    low_e_glazing: false,
    reflective_roof: false,
    improved_insulation: false,
  },
};

/** Deep clone so callers never mutate the shared baseline. */
export function cloneBaseline(): Scenario {
  return structuredClone(baselineScenario);
}
