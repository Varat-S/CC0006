/**
 * roofModel.ts — roof conductive gain via the simplified SOL-AIR temperature
 * (Requirement 4.2a).
 *
 *   T_sol-air = T_out + (alpha * I) / h_o
 *   Q_roof    = U_roof * A_roof * (T_sol-air - T_in)
 *
 * A reflective ("cool") roof LOWERS alpha, which lowers T_sol-air and therefore the roof
 * conduction indoors. Absorbed roof solar is NEVER added directly to the indoor load.
 */

import { CONSTANTS } from '../data/constants';

export function roofSolAirTempC(params: {
  outdoor_temp_c: number;
  roof_absorptance: number;
  solar_irradiance_w_m2: number;
  h_o?: number;
}): number {
  const h_o = params.h_o ?? CONSTANTS.outside_surface_h_o;
  if (!(h_o > 0)) return params.outdoor_temp_c;
  return params.outdoor_temp_c + (params.roof_absorptance * params.solar_irradiance_w_m2) / h_o;
}

export function roofConductionW(params: {
  roof_u_value: number;
  roof_area_m2: number;
  roof_absorptance: number;
  solar_irradiance_w_m2: number;
  outdoor_temp_c: number;
  indoor_temp_c: number;
  h_o?: number;
}): number {
  const tSolAir = roofSolAirTempC(params);
  return params.roof_u_value * params.roof_area_m2 * (tSolAir - params.indoor_temp_c);
}
