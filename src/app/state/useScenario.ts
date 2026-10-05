/**
 * useScenario.ts — the single hook the UI uses. Holds the current scenario, and derives
 * the baseline result, scenario result, comparison, and validation messages.
 */

import { useMemo, useReducer } from 'react';
import { simulate } from '../../model/simulate';
import { compare } from '../../model/compare';
import { validateScenario } from '../../model/geometry';
import { cloneBaseline } from '../../data/baselineScenario';
import { scenarioReducer, initScenario, type ScenarioAction } from './scenarioReducer';
import type { ComparisonResult, Scenario, SimulationResult, ValidationMessage } from '../../model/types';

export interface ScenarioStore {
  scenario: Scenario;
  dispatch: React.Dispatch<ScenarioAction>;
  baselineResult: SimulationResult;
  scenarioResult: SimulationResult;
  comparison: ComparisonResult;
  validation: ValidationMessage[];
  isValid: boolean;
}

// The baseline is fixed (the illustrative reference room) and computed once.
const BASELINE = cloneBaseline();

export function useScenario(): ScenarioStore {
  const [scenario, dispatch] = useReducer(scenarioReducer, undefined, initScenario);

  const baselineResult = useMemo(() => simulate(BASELINE), []);
  const validation = useMemo(() => validateScenario(scenario), [scenario]);
  const isValid = validation.length === 0;

  const scenarioResult = useMemo(
    () => (isValid ? simulate(scenario) : baselineResult),
    [scenario, isValid, baselineResult]
  );
  const comparison = useMemo(
    () => compare(baselineResult, scenarioResult),
    [baselineResult, scenarioResult]
  );

  return { scenario, dispatch, baselineResult, scenarioResult, comparison, validation, isValid };
}
