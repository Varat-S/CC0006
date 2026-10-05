/**
 * materials.ts — glazing & roof presets (Requirement 9.4).
 *
 * Values are ILLUSTRATIVE engineering references unless sourced. Each preset carries a
 * Provenance record so the Data & Assumptions view can show where it came from.
 */

import type { Provenance } from './provenance';

export interface GlazingPresetSpec {
  label: string;
  u_value: number; // W/(m^2*K)
  shgc: number; // 0..1
  provenance: Provenance;
}

export interface RoofPresetSpec {
  label: string;
  u_value: number; // W/(m^2*K)
  absorptance: number; // 0..1
  provenance: Provenance;
}

const engGlazing = (note: string): Provenance => ({
  sourceClass: 'ENGINEERING_REFERENCE',
  sourceTitle: 'Glazing engineering reference (representative U / SHGC)',
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence: 'medium',
});

const engRoof = (note: string): Provenance => ({
  sourceClass: 'ENGINEERING_REFERENCE',
  sourceTitle: 'Roof/surface engineering reference (representative U / absorptance)',
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence: 'medium',
});

export const GLAZING_PRESETS: Record<'standard' | 'low_e', GlazingPresetSpec> = {
  standard: {
    label: 'Standard single glazing',
    u_value: 5.5,
    shgc: 0.7,
    provenance: engGlazing('Representative clear single glazing; high U-value and SHGC.'),
  },
  low_e: {
    label: 'Low-E / improved glazing',
    u_value: 2.0,
    shgc: 0.35,
    provenance: engGlazing('Representative low-emissivity double glazing; lower U-value and SHGC.'),
  },
};

export const ROOF_PRESETS: Record<'standard' | 'reflective', RoofPresetSpec> = {
  standard: {
    label: 'Standard roof surface',
    u_value: 1.5,
    absorptance: 0.75,
    provenance: engRoof('Representative dark/standard roof; high solar absorptance.'),
  },
  reflective: {
    label: 'Reflective (cool) roof surface',
    u_value: 1.5,
    absorptance: 0.3,
    provenance: engRoof('Representative cool-roof coating; low solar absorptance.'),
  },
};
