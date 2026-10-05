/**
 * ventilationModel.ts — sensible ventilation heat load (Requirement 4.6).
 *
 *   V_dot = ACH * V_room / 3600       (m^3/s)
 *   m_dot = rho * V_dot               (kg/s)
 *   Q     = m_dot * cp * (T_out - T_in)
 *
 * NOTE (Requirement 3.7): in Singapore's hot-humid climate, T_out > T_in, so MORE
 * ventilation INCREASES the sensible cooling load. This interaction is deliberately
 * preserved — "more ventilation ≠ always better". (Latent load from outdoor moisture is
 * only added when an indoor humidity model is active; the MVP is sensible-only.)
 */

import { CONSTANTS } from '../data/constants';

export function ventilationLoadW(params: {
  ventilation_ach: number;
  volume_m3: number;
  outdoor_temp_c: number;
  indoor_temp_c: number;
}): number {
  const ach = Math.max(0, params.ventilation_ach);
  const vDot = (ach * Math.max(0, params.volume_m3)) / 3600; // m^3/s
  const mDot = CONSTANTS.air_density * vDot; // kg/s
  return mDot * CONSTANTS.air_cp * (params.outdoor_temp_c - params.indoor_temp_c);
}
