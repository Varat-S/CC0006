/**
 * ComparisonTable.tsx — central baseline-vs-scenario comparison (Requirement 7.2).
 */

import { comfortLabel } from '../../model/comfortModel';
import type { ComparisonResult, MetricDelta } from '../../model/types';

function fmtDelta(d: MetricDelta, unit: string, digits = 1) {
  const sign = d.delta_abs > 0 ? '+' : '';
  return `${sign}${d.delta_abs.toFixed(digits)} ${unit} (${sign}${d.delta_pct.toFixed(1)}%)`;
}

function deltaClass(delta: number, lowerIsBetter = true) {
  if (delta === 0) return '';
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  return good ? 'good' : 'bad';
}

export function ComparisonTable({ comparison }: { comparison: ComparisonResult }) {
  const m = comparison.metrics;
  return (
    <table className="comparison">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Baseline</th>
          <th>Scenario</th>
          <th>Delta</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Indoor temperature</td>
          <td>{m.indoor_temp_c.baseline.toFixed(1)} °C</td>
          <td>{m.indoor_temp_c.scenario.toFixed(1)} °C</td>
          <td>{fmtDelta(m.indoor_temp_c, '°C')}</td>
        </tr>
        <tr>
          <td>HVAC electricity</td>
          <td>{m.hvac_kwh_day.baseline.toFixed(1)} kWh</td>
          <td>{m.hvac_kwh_day.scenario.toFixed(1)} kWh</td>
          <td className={deltaClass(m.hvac_kwh_day.delta_abs)}>{fmtDelta(m.hvac_kwh_day, 'kWh')}</td>
        </tr>
        <tr>
          <td>Lighting electricity</td>
          <td>{m.lighting_kwh_day.baseline.toFixed(1)} kWh</td>
          <td>{m.lighting_kwh_day.scenario.toFixed(1)} kWh</td>
          <td className={deltaClass(m.lighting_kwh_day.delta_abs)}>{fmtDelta(m.lighting_kwh_day, 'kWh')}</td>
        </tr>
        <tr>
          <td>Total electricity</td>
          <td>{m.total_kwh_day.baseline.toFixed(1)} kWh</td>
          <td>{m.total_kwh_day.scenario.toFixed(1)} kWh</td>
          <td className={deltaClass(m.total_kwh_day.delta_abs)}>{fmtDelta(m.total_kwh_day, 'kWh')}</td>
        </tr>
        <tr>
          <td>Comfort</td>
          <td>{comfortLabel(comparison.comfort.baseline)}</td>
          <td>{comfortLabel(comparison.comfort.scenario)}</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
  );
}
