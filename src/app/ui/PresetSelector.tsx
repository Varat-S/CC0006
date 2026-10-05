/**
 * PresetSelector.tsx — one-click scenario presets + reset (Requirements 8, 11.4).
 */

import { PRESETS } from '../../data/scenarioPresets';
import type { ScenarioStore } from '../state/useScenario';

export function PresetSelector({ store }: { store: ScenarioStore }) {
  return (
    <div className="presets">
      <span className="presets-label">Presets:</span>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          title={p.description}
          onClick={() => store.dispatch({ type: 'applyPreset', presetId: p.id })}
        >
          {p.label}
        </button>
      ))}
      <button className="reset" onClick={() => store.dispatch({ type: 'reset' })}>
        Reset to baseline
      </button>
    </div>
  );
}
