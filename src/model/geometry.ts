/**
 * geometry.ts — derived geometry + input validation (Requirements 1.6, 13.4).
 *
 * SIMPLIFYING ASSUMPTION: the room is treated as a roughly square single zone.
 *   side        = sqrt(floor_area)
 *   perimeter   = 4 * side
 *   gross_wall  = perimeter * ceiling_height
 *   opaque_wall = gross_wall - window_area  (floored at 0)
 *   roof_area   = floor_area
 * These are documented approximations, not measured dimensions.
 */

import type { Geometry, Scenario, ValidationMessage } from './types';

export function deriveGeometry(room: {
  floor_area_m2: number;
  ceiling_height_m: number;
  window_area_m2: number;
}): Geometry {
  const area = Math.max(0, room.floor_area_m2);
  const height = Math.max(0, room.ceiling_height_m);
  const side = Math.sqrt(area);
  const perimeter = 4 * side;
  const grossWall = perimeter * height;
  const window = Math.max(0, room.window_area_m2);
  const opaqueWall = Math.max(0, grossWall - window);
  return {
    volume_m3: area * height,
    gross_wall_area_m2: grossWall,
    opaque_wall_area_m2: opaqueWall,
    roof_area_m2: area,
  };
}

/**
 * Validate geometry/inputs (Requirement 13.4). Returns human-readable messages; empty
 * array means valid. The UI surfaces these rather than silently computing nonsense.
 */
export function validateScenario(scenario: Scenario): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const { room, operation } = scenario;

  if (!(room.floor_area_m2 > 0)) {
    messages.push({ field: 'room.floor_area_m2', message: 'Floor area must be greater than 0 m².' });
  }
  if (!(room.ceiling_height_m > 0)) {
    messages.push({ field: 'room.ceiling_height_m', message: 'Ceiling height must be greater than 0 m.' });
  }
  if (operation.ventilation_ach < 0) {
    messages.push({ field: 'operation.ventilation_ach', message: 'Ventilation (ACH) cannot be negative.' });
  }
  if (operation.occupancy < 0) {
    messages.push({ field: 'operation.occupancy', message: 'Occupancy cannot be negative.' });
  }
  if (room.window_area_m2 < 0) {
    messages.push({ field: 'room.window_area_m2', message: 'Window area cannot be negative.' });
  }

  // window_area <= gross_wall_area (only meaningful when geometry is positive)
  if (room.floor_area_m2 > 0 && room.ceiling_height_m > 0) {
    const geom = deriveGeometry(room);
    if (room.window_area_m2 > geom.gross_wall_area_m2 + 1e-9) {
      messages.push({
        field: 'room.window_area_m2',
        message: `Window area (${room.window_area_m2.toFixed(1)} m²) exceeds the available gross wall area (${geom.gross_wall_area_m2.toFixed(1)} m²).`,
      });
    }
  }

  return messages;
}
