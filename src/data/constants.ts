/**
 * constants.ts — the SINGLE assumptions/config object for the model.
 *
 * No physical constant should be hard-coded anywhere else in the codebase
 * (Requirement 4.9). All values here are ILLUSTRATIVE / representative engineering
 * references unless a specific sourced value is supplied via the provenance layer.
 */

export const CONSTANTS = {
  // --- Air properties (standard, ~25-30 C) ---
  air_density: 1.2, // kg/m^3
  air_cp: 1005, // J/(kg*K)

  // --- Internal gains ---
  person_sensible_w: 75, // W/person (sensible)
  person_latent_w: 55, // W/person (latent) — used only if humidity model is active

  // --- HVAC ---
  default_hvac_cop: 3.5, // coefficient of performance (editable, 3.0-4.0 typical)
  default_hvac_capacity_kw: 20, // finite sensible cooling capacity (illustrative)

  // --- Envelope / roof sol-air ---
  outside_surface_h_o: 25, // W/(m^2*K), outside surface heat-transfer coefficient (sol-air)

  // --- Fan ---
  default_fan_power_w: 50, // W (ceiling/ventilating fan)
  fan_comfort_offset_c: 0.8, // perceived-temperature reduction when fan on (comfort proxy ONLY)

  // --- Intervention factors ---
  // External shading reduces glazing solar gain (F_shade).
  shading_factor: { none: 1.0, moderate: 0.75, high: 0.65 },
  // Daylight-responsive lighting reduces effective lighting POWER (LPD).
  daylight_lighting_factor: 0.7,
  // Occupancy-responsive lighting reduces effective lighting HOURS.
  occupancy_lighting_factor: 0.75,
  // Fallback occupied fraction when occupancy-responsive AC is on but no fraction supplied.
  occupancy_control_runtime_factor: 0.75,

  // --- Simplified orientation factor for glazing solar gain ---
  // N lower, S moderate, E high (morning), W high (afternoon). Clearly simplified;
  // a proper hourly solar-geometry model would replace this.
  orientation_factor: { north: 0.4, south: 0.7, east: 0.85, west: 1.0 },

  // --- Insulation presets: multipliers applied to baseline U-values ---
  // Lower multiplier = better insulation = lower conductive load.
  insulation_u_multiplier: { baseline: 1.0, moderate: 0.7, high: 0.45 },

  // --- Reflective-roof absorptance preset (used by the reflective_roof toggle) ---
  roof_absorptance: { standard: 0.75, reflective: 0.3 },

  // --- Equilibrium solver (bounded bisection) for capacity-limited indoor temp ---
  // Fixed tolerance + iteration cap keep results deterministic (Requirement 4.8).
  equilibrium_solver: { t_min_c: 15, t_max_c: 55, tol_c: 0.01, max_iter: 80 },

  // --- Default plug/equipment power density (optional/advanced) ---
  default_plug_load_w_m2: 6, // W/m^2
} as const;

export type Constants = typeof CONSTANTS;
