/**
 * OptimisePanel.tsx — "Find best combination" brute-force optimisation (Requirement 15.1).
 *
 * Searches the intervention space for the lowest total electricity whose comfort is still
 * acceptable, around the CURRENT scenario's geometry/environment. The user can apply the
 * recommended configuration.
 */

import { useMemo } from 'react';
import { optimise, describeInterventions } from '../../model/optimise';
import type { ScenarioStore } from '../state/useScenario';

export function OptimisePanel({ store }: { store: ScenarioStore }) {
  const { scenario, dispatch } = store;
  const result = useMemo(() => optimise(scenario), [scenario]);
  const rec = result.recommended;

  return (
    <div className="optimise-panel">
      <div className="disclaimer">
        Brute-force search over AC setpoint and the eight toggle interventions
        ({result.evaluated} combinations evaluated), minimising total daily electricity while
        keeping comfort acceptable (Comfortable or Borderline). Geometry and environment are
        held at the current scenario's values.
      </div>

      {!rec ? (
        <div className="validation">
          No acceptable-comfort configuration was found in the search space for these
          conditions. Try adjusting the environment or HVAC capacity.
        </div>
      ) : (
        <>
          <div className="cards">
            <div className="card">
              <div className="card-label">Recommended total</div>
              <div className="card-value">{rec.total_kwh_day.toFixed(1)}</div>
              <div className="card-sub">kWh/day</div>
            </div>
            <div className="card">
              <div className="card-label">Reduction vs baseline-of-search</div>
              <div className="card-value good">-{result.estimatedReductionPct.toFixed(1)}%</div>
              <div className="card-sub">from {result.baselineTotal.toFixed(1)} kWh/day</div>
            </div>
            <div className="card">
              <div className="card-label">Indoor temperature</div>
              <div className="card-value">{rec.indoor_temp_c.toFixed(1)} °C</div>
              <div className="card-sub">comfort: {rec.comfort.replace('_', ' ')}</div>
            </div>
            <div className="card">
              <div className="card-label">Acceptable configs</div>
              <div className="card-value">{result.acceptableFound}</div>
              <div className="card-sub">of {result.evaluated} evaluated</div>
            </div>
          </div>

          <section className="block">
            <h3>Recommended configuration</h3>
            <ul className="rec-list">
              {describeInterventions(rec.scenario).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <button
              className="apply"
              onClick={() => {
                dispatch({ type: 'updateInterventions', patch: rec.scenario.interventions });
                dispatch({
                  type: 'updateOperation',
                  patch: { ac_setpoint_c: rec.scenario.operation.ac_setpoint_c },
                });
              }}
            >
              Apply recommended configuration
            </button>
          </section>
        </>
      )}
    </div>
  );
}
