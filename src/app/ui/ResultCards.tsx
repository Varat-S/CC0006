/**
 * ResultCards.tsx — top summary cards (Requirement 7.1, 11.2) + comfort badge.
 */

import { comfortLabel } from '../../model/comfortModel';
import type { Comfort, SimulationResult } from '../../model/types';

export function ComfortBadge({ comfort }: { comfort: Comfort }) {
  return <span className={`badge badge-${comfort}`}>{comfortLabel(comfort)}</span>;
}

function basisNote(result: SimulationResult): string {
  switch (result.indoor_temp_basis) {
    case 'setpoint':
      return 'maintained at setpoint';
    case 'equilibrium':
      return 'capacity-limited equilibrium';
    case 'ac_off':
      return 'AC off — drifts to outdoor';
  }
}

export function ResultCards({
  result,
  deltaPct,
}: {
  result: SimulationResult;
  deltaPct: number;
}) {
  const deltaClass = deltaPct < 0 ? 'good' : deltaPct > 0 ? 'bad' : '';
  return (
    <div className="cards">
      <div className="card">
        <div className="card-label">Indoor temperature</div>
        <div className="card-value">{result.indoor_temp_c.toFixed(1)} °C</div>
        <div className="card-sub">{basisNote(result)}</div>
      </div>
      <div className="card">
        <div className="card-label">Comfort</div>
        <div className="card-value">
          <ComfortBadge comfort={result.comfort} />
        </div>
        <div className="card-sub">perceived {result.perceived_temp_c.toFixed(1)} °C</div>
      </div>
      <div className="card">
        <div className="card-label">HVAC electricity</div>
        <div className="card-value">{result.hvac_kwh_day.toFixed(1)}</div>
        <div className="card-sub">kWh/day</div>
      </div>
      <div className="card">
        <div className="card-label">Total electricity</div>
        <div className="card-value">{result.total_kwh_day.toFixed(1)}</div>
        <div className="card-sub">kWh/day</div>
      </div>
      <div className="card">
        <div className="card-label">Energy vs baseline</div>
        <div className={`card-value ${deltaClass}`}>
          {deltaPct > 0 ? '+' : ''}
          {deltaPct.toFixed(1)}%
        </div>
        <div className="card-sub">total electricity</div>
      </div>
    </div>
  );
}
