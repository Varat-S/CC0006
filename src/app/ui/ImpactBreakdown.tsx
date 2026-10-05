/**
 * ImpactBreakdown.tsx — physical intermediate quantities, baseline → scenario
 * (Requirement 7.3). NOT additive per-intervention savings.
 */

import type { ComparisonResult } from '../../model/types';

export function ImpactBreakdown({ comparison }: { comparison: ComparisonResult }) {
  return (
    <div className="breakdown">
      <p className="breakdown-note">
        Change in physical quantities (baseline → scenario). These are not independently
        additive — they show the mechanism behind the energy result.
      </p>
      <table>
        <tbody>
          {comparison.impact_breakdown.map((r) => {
            const cls = r.delta_pct < 0 ? 'good' : r.delta_pct > 0 ? 'bad' : '';
            return (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td className="num">
                  {r.baseline.toFixed(2)} → {r.scenario.toFixed(2)} {r.unit}
                </td>
                <td className={`num ${cls}`}>
                  {r.delta_pct > 0 ? '+' : ''}
                  {r.delta_pct.toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
