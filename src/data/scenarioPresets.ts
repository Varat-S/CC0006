/**
 * scenarioPresets.ts — one-click demo presets (Requirement 8).
 *
 * Each preset is a transform applied on top of the baseline scenario. Applying a preset
 * recalculates everything deterministically.
 */

import type { Scenario } from '../model/types';
import { cloneBaseline } from './baselineScenario';

export interface Preset {
  id: string;
  label: string;
  description: string;
  apply: (s: Scenario) => Scenario;
}

export const PRESETS: Preset[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'No interventions. The illustrative representative room.',
    apply: () => cloneBaseline(),
  },
  {
    id: 'operational',
    label: 'Operational optimisation',
    description: 'AC setpoint +1.5 °C, occupancy-responsive AC, occupancy-responsive lighting.',
    apply: () => {
      const s = cloneBaseline();
      s.operation.ac_setpoint_c += 1.5;
      s.interventions.occupancy_ac_control = true;
      s.interventions.occupancy_lighting_control = true;
      return s;
    },
  },
  {
    id: 'low_cost',
    label: 'Low-cost retrofit',
    description: 'Ceiling fan, external shading, daylight-responsive lighting.',
    apply: () => {
      const s = cloneBaseline();
      s.interventions.fan_enabled = true;
      s.interventions.external_shading = 'moderate';
      s.interventions.daylight_lighting_control = true;
      return s;
    },
  },
  {
    id: 'envelope',
    label: 'Envelope retrofit',
    description: 'Low-E glazing, improved insulation, reflective roof.',
    apply: () => {
      const s = cloneBaseline();
      s.interventions.low_e_glazing = true;
      s.interventions.improved_insulation = true;
      s.interventions.reflective_roof = true;
      return s;
    },
  },
  {
    id: 'combined',
    label: 'Combined scenario',
    description: 'A mix: setpoint +2 °C, fan, high shading, occupancy AC, daylight lighting, low-E, reflective roof.',
    apply: () => {
      const s = cloneBaseline();
      s.operation.ac_setpoint_c += 2;
      s.interventions.fan_enabled = true;
      s.interventions.external_shading = 'high';
      s.interventions.occupancy_ac_control = true;
      s.interventions.daylight_lighting_control = true;
      s.interventions.occupancy_lighting_control = true;
      s.interventions.low_e_glazing = true;
      s.interventions.reflective_roof = true;
      s.interventions.improved_insulation = true;
      return s;
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
