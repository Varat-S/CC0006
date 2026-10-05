/**
 * App.tsx — shell, tabs, and layout (Requirement 11).
 */

import { useState } from 'react';
import { useScenario } from './state/useScenario';
import { ControlPanel } from './ui/ControlPanel';
import { PresetSelector } from './ui/PresetSelector';
import { ResultCards } from './ui/ResultCards';
import { ComparisonTable } from './ui/ComparisonTable';
import { ComparisonChart } from './ui/ComparisonChart';
import { ImpactBreakdown } from './ui/ImpactBreakdown';
import { ProvenancePanel } from './ui/ProvenancePanel';
import { MethodologyPanel } from './ui/MethodologyPanel';
import { BASELINE_LABEL } from '../data/baselineScenario';

type Tab = 'simulator' | 'compare' | 'data' | 'methodology';

const TABS: { id: Tab; label: string }[] = [
  { id: 'simulator', label: 'Simulator' },
  { id: 'compare', label: 'Compare' },
  { id: 'data', label: 'Data & Assumptions' },
  { id: 'methodology', label: 'Methodology' },
];

export default function App() {
  const store = useScenario();
  const [tab, setTab] = useState<Tab>('simulator');
  const { scenario, scenarioResult, comparison, validation, isValid } = store;
  const environment = scenario.environment;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>NTU Sustainable Building — Scenario Simulator</h1>
          <p className="subtitle">
            Simplified digital-twin framework demonstrated using a representative NTU
            building space. Proof of concept — not a calibrated twin of any specific
            building.
          </p>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="layout">
        {(tab === 'simulator' || tab === 'compare') && <ControlPanel store={store} />}

        <main className="results">
          {!isValid && (
            <div className="validation">
              <strong>Please fix:</strong>
              <ul>
                {validation.map((v) => (
                  <li key={v.field}>{v.message}</li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'simulator' && (
            <>
              <PresetSelector store={store} />
              <p className="baseline-label">{BASELINE_LABEL}</p>
              <ResultCards result={scenarioResult} deltaPct={comparison.metrics.total_kwh_day.delta_pct} />
              <div className="rh-note">
                Outdoor RH: {environment.outdoor_rh_pct}%. Indoor RH is not predicted in this
                MVP (sensible-only model; latent modelling is future work).
              </div>
              <section className="block">
                <h2>Baseline vs scenario</h2>
                <ComparisonChart comparison={comparison} />
                <ComparisonTable comparison={comparison} />
              </section>
              <section className="block">
                <h2>Impact breakdown — what changed and why</h2>
                <ImpactBreakdown comparison={comparison} />
              </section>
            </>
          )}

          {tab === 'compare' && (
            <>
              <PresetSelector store={store} />
              <section className="block">
                <h2>Baseline vs scenario</h2>
                <ComparisonChart comparison={comparison} />
                <ComparisonTable comparison={comparison} />
              </section>
              <section className="block">
                <h2>Impact breakdown</h2>
                <ImpactBreakdown comparison={comparison} />
              </section>
            </>
          )}

          {tab === 'data' && <ProvenancePanel scenario={scenario} />}
          {tab === 'methodology' && <MethodologyPanel />}
        </main>
      </div>

      <footer className="app-footer">
        Deterministic, reproducible model. All values illustrative or user-defined. See the
        Methodology and Data &amp; Assumptions tabs.
      </footer>
    </div>
  );
}
