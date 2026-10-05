/**
 * internalGains.ts — occupancy, lighting, and plug internal sensible heat (Requirements 4.4, 4.5).
 *
 *   Q_occupancy = N * person_sensible_w
 *   Q_lighting  = effective_LPD * floor_area   (daylight control lowers effective LPD)
 *   Q_plug      = EPD * floor_area              (optional/advanced)
 *
 * Lighting ELECTRICITY (not heat) is computed separately on its own schedule — see
 * energyModel.ts / Requirement 7a — because lighting hours are independent of HVAC hours.
 */

import { CONSTANTS } from '../data/constants';

export function occupancyGainW(occupancy: number): number {
  return Math.max(0, occupancy) * CONSTANTS.person_sensible_w;
}

export function lightingGainW(effective_lpd_w_m2: number, floor_area_m2: number): number {
  return Math.max(0, effective_lpd_w_m2) * Math.max(0, floor_area_m2);
}

export function plugGainW(plug_load_w_m2: number, floor_area_m2: number): number {
  return Math.max(0, plug_load_w_m2) * Math.max(0, floor_area_m2);
}
