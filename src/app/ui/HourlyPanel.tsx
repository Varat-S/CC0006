/**
 * HourlyPanel.tsx — Dataset mode: run an hourly simulation over a built-in representative
 * day or an uploaded weather CSV (Requirement 12.2, 12.3).
 */

import { useMemo, useState } from 'react';
import { parseWeatherCsv, sampleSingaporeDay, type WeatherRow } from '../../data/weatherLoader';
import { simulateHourly } from '../../model/hourlySimulation';
import { HourlyChart } from './HourlyChart';
import type { Scenario } from '../../model/types';

export function HourlyPanel({ scenario }: { scenario: Scenario }) {
  const [weather, setWeather] = useState<WeatherRow[]>(() => sampleSingaporeDay());
  const [source, setSource] = useState<'sample' | 'csv'>('sample');
  const [errors, setErrors] = useState<string[]>([]);

  const result = useMemo(() => simulateHourly(scenario, weather), [scenario, weather]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, errors } = parseWeatherCsv(String(reader.result ?? ''));
      setErrors(errors);
      if (rows.length > 0) {
        setWeather(rows);
        setSource('csv');
      }
    };
    reader.readAsText(file);
  }

  function useSample() {
    setWeather(sampleSingaporeDay());
    setSource('sample');
    setErrors([]);
  }

  const t = result.totals;

  return (
    <div className="hourly-panel">
      <div className="disclaimer">
        Dataset / hourly mode runs the same single-zone model at each hour using a
        representative weekday schedule (occupied 08:00–20:00). The built-in day is an
        illustrative Singapore-like profile — not measured data. Upload a CSV with columns:
        <code> timestamp, temperature_c, relative_humidity_pct, solar_irradiance_w_m2, wind_speed_m_s</code>.
      </div>

      <div className="hourly-controls">
        <button className={source === 'sample' ? 'active' : ''} onClick={useSample}>
          Use representative day
        </button>
        <label className="file-btn">
          Upload weather CSV
          <input type="file" accept=".csv,text/csv" onChange={onFile} />
        </label>
        <span className="muted">{weather.length} hours loaded ({source})</span>
      </div>

      {errors.length > 0 && (
        <div className="validation">
          <strong>CSV issues:</strong>
          <ul>
            {errors.slice(0, 6).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="cards">
        <div className="card">
          <div className="card-label">Total electricity</div>
          <div className="card-value">{t.total_kwh_day.toFixed(1)}</div>
          <div className="card-sub">kWh/day</div>
        </div>
        <div className="card">
          <div className="card-label">HVAC electricity</div>
          <div className="card-value">{t.hvac_kwh_day.toFixed(1)}</div>
          <div className="card-sub">kWh/day</div>
        </div>
        <div className="card">
          <div className="card-label">Peak indoor temp</div>
          <div className="card-value">{t.peak_indoor_temp_c.toFixed(1)} °C</div>
          <div className="card-sub">{t.hours_capacity_limited} h capacity-limited</div>
        </div>
        <div className="card">
          <div className="card-label">Hours outside comfort</div>
          <div className="card-value">{t.hours_outside_comfort}</div>
          <div className="card-sub">of {result.steps.length} h</div>
        </div>
      </div>

      <section className="block">
        <HourlyChart result={result} />
      </section>
    </div>
  );
}
