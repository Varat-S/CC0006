/**
 * envelopeModel.ts — opaque-wall + window conductive heat gain (Requirement 4.2).
 *
 *   Q = U * A * (T_out - T_in)
 *
 * The ROOF is handled separately in roofModel.ts via the sol-air approach, because it is
 * driven by absorbed solar radiation rather than plain outdoor air temperature.
 */

export function envelopeConductionW(params: {
  wall_u_value: number;
  opaque_wall_area_m2: number;
  window_u_value: number;
  window_area_m2: number;
  outdoor_temp_c: number;
  indoor_temp_c: number;
}): number {
  const dT = params.outdoor_temp_c - params.indoor_temp_c;
  const wall = params.wall_u_value * params.opaque_wall_area_m2 * dT;
  const window = params.window_u_value * params.window_area_m2 * dT;
  return wall + window;
}
