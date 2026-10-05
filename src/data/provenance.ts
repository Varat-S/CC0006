/**
 * provenance.ts — structured source records (Requirement 9).
 *
 * Every parameter and material value should carry a Provenance record so the
 * Data & Assumptions view can answer BOTH:
 *   - "What kind of source is this?"  (sourceClass + confidence)
 *   - "Where exactly did this value come from?"  (sourceTitle + sourceUrl + accessedDate + note)
 *
 * Values here are representative engineering references / assumptions unless otherwise
 * stated. This prototype does NOT use unpublished NTU-specific engineering parameters.
 */

export type SourceClass =
  | 'PUBLIC_NTU_DATA'
  | 'PUBLIC_SINGAPORE_DATA'
  | 'ENGINEERING_REFERENCE'
  | 'MANUFACTURER_SPECIFICATION'
  | 'ASSUMPTION'
  | 'USER_INPUT';

export type Confidence = 'high' | 'medium' | 'low';

export interface Provenance {
  sourceClass: SourceClass;
  sourceTitle: string;
  sourceUrl: string | null;
  accessedDate: string | null; // ISO date
  note: string;
  confidence: Confidence;
}

const ENG = (title: string, note: string, confidence: Confidence = 'medium'): Provenance => ({
  sourceClass: 'ENGINEERING_REFERENCE',
  sourceTitle: title,
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence,
});

const ASSUMPTION = (note: string, confidence: Confidence = 'low'): Provenance => ({
  sourceClass: 'ASSUMPTION',
  sourceTitle: 'Illustrative project assumption',
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence,
});

const USER = (note: string): Provenance => ({
  sourceClass: 'USER_INPUT',
  sourceTitle: 'User-selected value',
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence: 'high',
});

const SG = (title: string, note: string, confidence: Confidence = 'medium'): Provenance => ({
  sourceClass: 'PUBLIC_SINGAPORE_DATA',
  sourceTitle: title,
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence,
});

/**
 * Provenance for each inspectable parameter, keyed by a dotted path matching the Scenario
 * shape (plus a few model constants). Surfaced in the Data & Assumptions view.
 */
export const PARAMETER_PROVENANCE: Record<string, Provenance> = {
  // Room
  'room.floor_area_m2': ASSUMPTION('Representative tutorial-space floor area; not NTU-specific.'),
  'room.ceiling_height_m': ASSUMPTION('Typical teaching-space ceiling height.'),
  'room.window_area_m2': ASSUMPTION('Representative glazed area; not NTU-specific.'),
  'room.orientation': USER('Facade orientation chosen by the user.'),
  'room.wall_u_value': ENG('ASHRAE Fundamentals (opaque wall U-value range)', 'Representative value for a medium-mass wall.'),
  'room.roof_u_value': ENG('ASHRAE Fundamentals (roof U-value range)', 'Representative value; not NTU-specific.'),
  'room.window_u_value': ENG('Glazing engineering reference', 'From the selected glazing preset.'),
  'room.window_shgc': ENG('Glazing engineering reference', 'From the selected glazing preset.'),
  'room.roof_solar_absorptance': ENG('Surface solar-absorptance reference', 'Standard dark roof ~0.75; reflective ~0.30.'),
  'room.insulation_level': USER('Insulation retrofit level chosen by the user.'),

  // Environment
  'environment.outdoor_temp_c': SG('MSS / data.gov.sg representative conditions', 'Illustrative hot-day value; not a live feed.'),
  'environment.outdoor_rh_pct': SG('MSS / data.gov.sg representative conditions', 'Illustrative humid value; not a live feed.'),
  'environment.solar_irradiance_w_m2': SG('Representative Singapore solar irradiance', 'Illustrative midday clear-sky value.'),

  // Operation
  'operation.occupancy': USER('Number of occupants chosen by the user.'),
  'operation.ac_setpoint_c': USER('AC setpoint chosen by the user.'),
  'operation.ventilation_ach': USER('Ventilation rate (air changes/hour) chosen by the user.'),
  'operation.lighting_w_m2': ENG('Lighting power density reference', 'Representative LPD for a modern teaching space.'),
  'operation.plug_load_w_m2': ENG('Equipment power density reference', 'Representative plug/equipment load.'),
  'operation.ac_hours_per_day': USER('HVAC operating hours chosen by the user.'),
  'operation.lighting_hours_per_day': USER('Lighting operating hours chosen by the user (independent of HVAC).'),
  'operation.hvac_cop': ENG('Chiller/split-system COP reference', 'Representative COP; editable in advanced panel.'),
  'operation.hvac_capacity_kw': ASSUMPTION('Illustrative finite cooling capacity; not NTU-specific.'),

  // Model constants
  'constants.person_sensible_w': ENG('ASHRAE occupant heat-gain tables', 'Sensible heat per seated/light-activity person.'),
  'constants.person_latent_w': ENG('ASHRAE occupant heat-gain tables', 'Latent heat per person (humidity model only).'),
  'constants.air_density': ENG('Standard air properties', 'Dry air near 25-30 C.', 'high'),
  'constants.air_cp': ENG('Standard air properties', 'Specific heat of air.', 'high'),
  'constants.outside_surface_h_o': ENG('ASHRAE outside surface film coefficient', 'Used in the sol-air roof term.'),
  'constants.fan_comfort_offset_c': ENG('Elevated-air-speed comfort references', 'Simplified perceived-temperature offset; comfort proxy only.'),
};

export const DEFAULT_PROVENANCE: Provenance = ASSUMPTION('No specific source recorded.', 'low');

export function getProvenance(path: string): Provenance {
  return PARAMETER_PROVENANCE[path] ?? DEFAULT_PROVENANCE;
}
