/**
 * provenance.ts — structured source records (Requirement 9).
 *
 * Every parameter and material value carries a Provenance record so the Data & Assumptions
 * view can answer BOTH:
 *   - "What kind of source is this?"  (sourceClass + confidence)
 *   - "Where exactly did this value come from?"  (sourceTitle + sourceUrl + accessedDate + note)
 *
 * Concrete public references are provided where a value corresponds to a published
 * engineering reference, standard, or public dataset. Values that cannot be properly
 * sourced are kept explicitly as ASSUMPTION and are NOT implied to be engineering
 * standards. This prototype does NOT use unpublished NTU-specific engineering parameters.
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

/** Date these references were last reviewed. */
const ACCESSED = '2026-10-05';

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

/**
 * Provenance for each inspectable parameter, keyed by a dotted path matching the Scenario
 * shape (plus a few model constants). Surfaced in the Data & Assumptions view.
 */
export const PARAMETER_PROVENANCE: Record<string, Provenance> = {
  // --- Room (geometry is illustrative; U/SHGC come from engineering references) ---
  'room.floor_area_m2': ASSUMPTION('Representative tutorial-space floor area; not NTU-specific.'),
  'room.ceiling_height_m': ASSUMPTION('Typical teaching-space ceiling height.'),
  'room.window_area_m2': ASSUMPTION('Representative glazed area; not NTU-specific.'),
  'room.orientation': USER('Façade orientation chosen by the user.'),
  'room.wall_u_value': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 15 (Fenestration) & Ch. 25-27 (opaque assemblies)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/ashrae-handbook',
    accessedDate: ACCESSED,
    note: 'Representative opaque medium-mass wall U-value; not NTU-specific.',
    confidence: 'medium',
  },
  'room.roof_u_value': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals (roof/ceiling assembly U-values)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/ashrae-handbook',
    accessedDate: ACCESSED,
    note: 'Representative roof U-value; from the selected roof preset. Not NTU-specific.',
    confidence: 'medium',
  },
  'room.window_u_value': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 15 (Fenestration); NFRC rated U-factors',
    sourceUrl: 'https://www.nfrc.org/',
    accessedDate: ACCESSED,
    note: 'From the selected glazing preset (standard vs low-E).',
    confidence: 'medium',
  },
  'room.window_shgc': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 15; NFRC rated SHGC',
    sourceUrl: 'https://www.nfrc.org/',
    accessedDate: ACCESSED,
    note: 'From the selected glazing preset (standard vs low-E).',
    confidence: 'medium',
  },
  'room.roof_solar_absorptance': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals (surface solar absorptance); LBNL Cool Roofs',
    sourceUrl: 'https://heatisland.lbl.gov/coolscience/cool-roofs',
    accessedDate: ACCESSED,
    note: 'Standard dark roof ~0.75; reflective (cool) roof ~0.30.',
    confidence: 'medium',
  },
  'room.insulation_level': USER('Insulation retrofit level chosen by the user.'),

  // --- Environment (public Singapore data) ---
  'environment.outdoor_temp_c': {
    sourceClass: 'PUBLIC_SINGAPORE_DATA',
    sourceTitle: 'Meteorological Service Singapore — Climate of Singapore / realtime weather (data.gov.sg)',
    sourceUrl: 'http://www.weather.gov.sg/climate-climate-of-singapore/',
    accessedDate: ACCESSED,
    note: 'Illustrative hot-afternoon value in the typical SG daytime range; not a live feed.',
    confidence: 'medium',
  },
  'environment.outdoor_rh_pct': {
    sourceClass: 'PUBLIC_SINGAPORE_DATA',
    sourceTitle: 'Meteorological Service Singapore — Climate of Singapore (relative humidity)',
    sourceUrl: 'http://www.weather.gov.sg/climate-climate-of-singapore/',
    accessedDate: ACCESSED,
    note: 'Illustrative humid value within the typical SG range; not a live feed.',
    confidence: 'medium',
  },
  'environment.solar_irradiance_w_m2': {
    sourceClass: 'PUBLIC_SINGAPORE_DATA',
    sourceTitle: 'NSRDB / Global Solar Atlas — Singapore GHI',
    sourceUrl: 'https://globalsolaratlas.info/map?c=1.352,103.82',
    accessedDate: ACCESSED,
    note: 'Illustrative midday clear-sky irradiance for Singapore.',
    confidence: 'medium',
  },

  // --- Operation ---
  'operation.occupancy': USER('Number of occupants chosen by the user.'),
  'operation.ac_setpoint_c': USER('AC setpoint chosen by the user.'),
  'operation.ventilation_ach': USER('Ventilation rate (air changes/hour) chosen by the user.'),
  'operation.lighting_w_m2': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE/IES Standard 90.1 — Lighting Power Density (educational/classroom)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    accessedDate: ACCESSED,
    note: 'Representative LPD for a modern teaching space.',
    confidence: 'medium',
  },
  'operation.plug_load_w_m2': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE 90.1 / NREL plug & process load references (office/education)',
    sourceUrl: 'https://www.nrel.gov/docs/fy13osti/54244.pdf',
    accessedDate: ACCESSED,
    note: 'Representative plug/equipment power density.',
    confidence: 'low',
  },
  'operation.ac_hours_per_day': USER('HVAC operating hours chosen by the user.'),
  'operation.lighting_hours_per_day': USER('Lighting operating hours chosen by the user (independent of HVAC).'),
  'operation.hvac_cop': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE 90.1 minimum efficiency / US DOE equipment data (chiller & split-system COP)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    accessedDate: ACCESSED,
    note: 'Representative COP ~3.5; editable in the advanced panel.',
    confidence: 'medium',
  },
  'operation.hvac_capacity_kw': ASSUMPTION('Illustrative finite cooling capacity; not NTU-specific.'),

  // --- Model constants ---
  'constants.person_sensible_w': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 18 (Table of representative occupant heat gain)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/ashrae-handbook',
    accessedDate: ACCESSED,
    note: 'Sensible heat per seated/light-activity person (~75 W).',
    confidence: 'high',
  },
  'constants.person_latent_w': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 18 (occupant heat gain)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/ashrae-handbook',
    accessedDate: ACCESSED,
    note: 'Latent heat per person (~55 W); used only when the humidity model is active.',
    confidence: 'high',
  },
  'constants.air_density': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'Engineering ToolBox — Air density and specific heat (near 25-30 °C)',
    sourceUrl: 'https://www.engineeringtoolbox.com/air-density-specific-weight-d_600.html',
    accessedDate: ACCESSED,
    note: 'Dry air density ~1.2 kg/m³ near 25-30 °C.',
    confidence: 'high',
  },
  'constants.air_cp': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'Engineering ToolBox — Air specific heat capacity',
    sourceUrl: 'https://www.engineeringtoolbox.com/air-specific-heat-capacity-d_705.html',
    accessedDate: ACCESSED,
    note: 'Specific heat of air ~1005 J/(kg·K).',
    confidence: 'high',
  },
  'constants.outside_surface_h_o': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Handbook — Fundamentals, Ch. 26 (exterior surface film / combined coefficient, summer)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/ashrae-handbook',
    accessedDate: ACCESSED,
    note: 'Outside surface heat-transfer coefficient h_o ~25 W/(m²·K) used in the sol-air term.',
    confidence: 'medium',
  },
  'constants.fan_comfort_offset_c': {
    sourceClass: 'ENGINEERING_REFERENCE',
    sourceTitle: 'ASHRAE Standard 55 — Thermal Environmental Conditions (elevated air speed / cooling effect)',
    sourceUrl: 'https://www.ashrae.org/technical-resources/bookstore/standard-55-thermal-environmental-conditions-for-human-occupancy',
    accessedDate: ACCESSED,
    note: 'Simplified perceived-temperature offset from elevated air speed; comfort proxy only.',
    confidence: 'low',
  },
  'constants.comfort_limits': {
    sourceClass: 'PUBLIC_SINGAPORE_DATA',
    sourceTitle: 'SS 554 : Indoor air quality for air-conditioned buildings; BCA Green Mark thermal comfort guidance',
    sourceUrl: 'https://www1.bca.gov.sg/buildsg/sustainability/green-mark-certification-scheme',
    accessedDate: ACCESSED,
    note: 'Comfort temperature/RH envelope reference. Not presented as statutory regulation.',
    confidence: 'medium',
  },
  'constants.grid_co2_kg_per_kwh': {
    sourceClass: 'PUBLIC_SINGAPORE_DATA',
    sourceTitle: 'EMA Singapore — Grid Emission Factor (Operating Margin), Singapore Energy Statistics',
    sourceUrl: 'https://www.ema.gov.sg/resources/singapore-energy-statistics',
    accessedDate: ACCESSED,
    note: 'Representative recent SG grid emission factor (~0.4168 kg CO₂/kWh); illustrative, verify current value.',
    confidence: 'medium',
  },
};

export const DEFAULT_PROVENANCE: Provenance = ASSUMPTION('No specific source recorded.', 'low');

export function getProvenance(path: string): Provenance {
  return PARAMETER_PROVENANCE[path] ?? DEFAULT_PROVENANCE;
}
