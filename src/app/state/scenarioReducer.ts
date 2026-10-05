/**
 * scenarioReducer.ts — explicit, testable scenario state updates.
 */

import type { Scenario } from '../../model/types';
import { cloneBaseline } from '../../data/baselineScenario';
import { getPreset } from '../../data/scenarioPresets';

export type ScenarioAction =
  | { type: 'updateRoom'; patch: Partial<Scenario['room']> }
  | { type: 'updateEnvironment'; patch: Partial<Scenario['environment']> }
  | { type: 'updateOperation'; patch: Partial<Scenario['operation']> }
  | { type: 'updateInterventions'; patch: Partial<Scenario['interventions']> }
  | { type: 'applyPreset'; presetId: string }
  | { type: 'reset' };

export function scenarioReducer(state: Scenario, action: ScenarioAction): Scenario {
  switch (action.type) {
    case 'updateRoom':
      return { ...state, room: { ...state.room, ...action.patch } };
    case 'updateEnvironment':
      return { ...state, environment: { ...state.environment, ...action.patch } };
    case 'updateOperation':
      return { ...state, operation: { ...state.operation, ...action.patch } };
    case 'updateInterventions':
      return { ...state, interventions: { ...state.interventions, ...action.patch } };
    case 'applyPreset': {
      const preset = getPreset(action.presetId);
      return preset ? preset.apply(state) : state;
    }
    case 'reset':
      return cloneBaseline();
    default:
      return state;
  }
}

export function initScenario(): Scenario {
  return cloneBaseline();
}
