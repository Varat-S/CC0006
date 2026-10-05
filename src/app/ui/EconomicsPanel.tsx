/**
 * EconomicsPanel.tsx — illustrative economic layer + three sustainability dimensions
 * (Requirements 15.2, 15.3, 7.4).
 */

import { computeEconomics, sustainabilitySummary } from '../../model/economics';
import { ECONOMICS } from '../../data/economics';
import { cloneBaseline } from '../../data/baselineScenario';
import type { ScenarioStore } from '../state/useScenario';

const BASELINE = cloneBaseline();

export function EconomicsPanel({ store }: { store: ScenarioStore }) {
  const { scenario, baselineResult, scenarioResult } = store;
  const econ = computeEconomics(baselineResult, scenarioResult, scenario, BASELINE);
  const summary = sustainabilitySummary(baselineResult, scenarioResult, scenario, BASELINE);

  const paybackText =
    econ.simple_payback_years === null
      ? 'No net saving — payback not applicable'
      : `${econ.simple_payback_years.toFixed(1)} years`;

  return (
    <div className="economics-panel">
      <div className="disclaimer">
        All monetary figures are <strong>illustrative</strong> order-of-magnitude values for a
        ~100 m² space (tariff {ECONOMICS.tariff_sgd_per_kwh} SGD/kWh,{' '}
        {ECONOMICS.operating_days_per_year} operating days/yr) — not sourced quotations or
        financial advice. {ECONOMICS.provenance.note}
      </div>

      <h3>Three sustainability dimensions</h3>
      <div className="cards">
        <div className="card">
          <div className="card-label">🌱 Environmental</div>
          <div className={`card-value ${summary.environmental.daily_electricity_delta_kwh < 0 ? 'good' : ''}`}>
            {summary.environmental.daily_electricity_delta_pct > 0 ? '+' : ''}
            {summary.environmental.daily_electricity_delta_pct.toFixed(1)}%
          </div>
          <div className="card-sub">
            electricity · {Math.abs(summary.environmental.annual_co2_delta_kg).toFixed(0)} kg CO₂/yr{' '}
            {summary.environmental.annual_co2_delta_kg < 0 ? 'avoided' : 'added'}
          </div>
        </div>
        <div className="card">
          <div className="card-label">💰 Economic</div>
          <div className={`card-value ${econ.annual_saving_sgd > 0 ? 'good' : ''}`}>
            {econ.annual_saving_sgd >= 0 ? '' : '−'}SGD {Math.abs(econ.annual_saving_sgd).toFixed(0)}
          </div>
          <div className="card-sub">per year · payback {paybackText}</div>
        </div>
        <div className="card">
          <div className="card-label">🧍 Social</div>
          <div className="card-value">{summary.social.comfort.replace('_', ' ')}</div>
          <div className="card-sub">
            indoor {summary.social.indoor_temp_c.toFixed(1)} °C · outdoor RH{' '}
            {summary.social.outdoor_rh_pct}%
          </div>
        </div>
      </div>

      <section className="block">
        <h3>Cost &amp; payback breakdown</h3>
        <table>
          <tbody>
            <tr>
              <td>Daily electricity saving</td>
              <td className="num">{econ.daily_saving_kwh.toFixed(1)} kWh/day</td>
            </tr>
            <tr>
              <td>Annual electricity saving</td>
              <td className="num">{econ.annual_saving_kwh.toFixed(0)} kWh/yr</td>
            </tr>
            <tr>
              <td>Annual cost saving</td>
              <td className="num">SGD {econ.annual_saving_sgd.toFixed(0)}</td>
            </tr>
            <tr>
              <td>Estimated capital cost</td>
              <td className="num">SGD {econ.capital_cost_sgd.toFixed(0)}</td>
            </tr>
            <tr>
              <td>
                <strong>Simple payback</strong>
              </td>
              <td className="num">
                <strong>{paybackText}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {econ.activeCostItems.length > 0 && (
          <>
            <h4>Active interventions (illustrative capital cost)</h4>
            <table>
              <tbody>
                {econ.activeCostItems.map((it) => (
                  <tr key={it.label}>
                    <td>{it.label}</td>
                    <td className="num">SGD {it.cost_sgd.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
