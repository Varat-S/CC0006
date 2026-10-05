/**
 * solarModel.ts — GLAZING solar heat gain only (Requirement 4.3).
 *
 *   Q_solar = A_glass * SHGC * I * F_orientation * F_shade
 *
 * Roof solar is handled by the sol-air term in roofModel.ts, not here.
 * F_orientation is a clearly SIMPLIFIED factor (no hourly solar geometry).
 */

export function glazingSolarGainW(params: {
  window_area_m2: number;
  window_shgc: number;
  solar_irradiance_w_m2: number;
  orientation_factor: number;
  shading_factor: number;
}): number {
  return (
    Math.max(0, params.window_area_m2) *
    params.window_shgc *
    Math.max(0, params.solar_irradiance_w_m2) *
    params.orientation_factor *
    params.shading_factor
  );
}
