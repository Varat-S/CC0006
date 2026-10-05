/**
 * types.ts — the structured, inspectable data model (Requirements 1.4, 4.1, 4.7, 7a).
 */

export type Orientation = 'north' | 'south' | 'east' | 'west';
export type ShadingLevel = 'none' | 'moderate' | 'high';
export type InsulationLevel = 'baseline' | 'moderate' | 'high';
export type GlazingPreset = 'standard' | 'low_e';
export type Comfort = 'comfortable' | 'borderline' | 'outside_target';
export type IndoorTempBasis = 'setpoint' | 'equilibrium' | 'ac_off';

export interface RoomParams {
  floor_area_m2: number;
  ceiling_height_m: number;
  window_area_m2: number;
  orientation: Orientation;
  glazing_preset: GlazingPreset;
  wall_u_value: number; // W/(m^2*K)
  roof_u_value: number; // W/(m^2*K)
  window_u_value: number; // W/(m^2*K)
  window_shgc: number; // 0..1
  roof_solar_absorptance: number; // 0..1
  insulation_level: InsulationLevel;
}

export interface EnvironmentParams {
  outdoor_temp_c: number;
  outdoor_rh_pct: number;
  solar_irradiance_w_m2: number;
  wind_speed_m_s?: number;
}

export interface OperationParams {
  occupancy: number;
  ac_setpoint_c: number;
  ventilation_ach: number;
  lighting_w_m2: number; // LPD
  plug_load_w_m2: number; // EPD
  ac_hours_per_day: number;
  lighting_hours_per_day: number; // INDEPENDENT of ac_hours_per_day (Requirement 7a)
  hvac_cop: number;
  hvac_capacity_kw: number; // finite cooling capacity (Requirement 4.7)
  occupied_fraction: number; // 0..1, used by occupancy-responsive AC & lighting
  ac_on: boolean;
}

export interface Interventions {
  fan_enabled: boolean;
  external_shading: ShadingLevel;
  occupancy_ac_control: boolean;
  daylight_lighting_control: boolean;
  occupancy_lighting_control: boolean;
  low_e_glazing: boolean;
  reflective_roof: boolean;
  improved_insulation: boolean;
}

export interface Scenario {
  room: RoomParams;
  environment: EnvironmentParams;
  operation: OperationParams;
  interventions: Interventions;
}

/** Derived geometry (documented simplifying assumptions — Requirement 1.6). */
export interface Geometry {
  volume_m3: number;
  gross_wall_area_m2: number;
  opaque_wall_area_m2: number;
  roof_area_m2: number;
}

/** All sensible heat gains in Watts, evaluated at a given indoor temperature T_in. */
export interface HeatGains {
  envelope: number; // opaque walls + window conduction
  roof: number; // sol-air-driven roof conduction (separate term)
  solar: number; // glazing solar gain only
  occupancy: number;
  lighting: number;
  plug: number;
  ventilation: number; // may be negative only if T_out < T_in
  total: number;
}

export interface SimulationResult {
  geometry: Geometry;
  gains: HeatGains; // evaluated at the resolved indoor_temp_c
  required_load_w: number; // load to hold the setpoint (max(0, gains@setpoint))
  cooling_load_w: number; // min(required_load, capacity); 0 when AC off
  capacity_limited: boolean;
  hvac_power_kw: number;
  effective_ac_hours: number;
  hvac_kwh_day: number;
  lighting_kwh_day: number; // from lighting_hours_per_day, independent of HVAC
  fan_kwh_day: number;
  plug_kwh_day: number;
  total_kwh_day: number;
  indoor_temp_c: number;
  indoor_temp_basis: IndoorTempBasis;
  perceived_temp_c: number; // indoor_temp - fan offset when fan on (comfort proxy)
  indoor_rh_pct?: number; // only if humidity model active
  comfort: Comfort;
  // Effective (post-intervention) values exposed for the breakdown / transparency.
  effective_lpd_w_m2: number;
  effective_lighting_hours: number;
}

export interface MetricDelta {
  baseline: number;
  scenario: number;
  delta_abs: number;
  delta_pct: number;
}

export interface BreakdownRow {
  label: string;
  unit: 'kW' | 'h' | 'kWh/day';
  baseline: number;
  scenario: number;
  delta_pct: number;
}

export interface ComparisonResult {
  metrics: {
    indoor_temp_c: MetricDelta;
    hvac_kwh_day: MetricDelta;
    lighting_kwh_day: MetricDelta;
    total_kwh_day: MetricDelta;
  };
  comfort: { baseline: Comfort; scenario: Comfort };
  impact_breakdown: BreakdownRow[];
}

export interface ValidationMessage {
  field: string;
  message: string;
}
