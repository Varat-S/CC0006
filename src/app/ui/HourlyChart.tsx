/**
 * HourlyChart.tsx — time-series plots for the hourly simulation (Requirement 12.3):
 * indoor vs outdoor temperature, HVAC energy, and occupancy over the day.
 */

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyResult } from '../../model/hourlySimulation';

export function HourlyChart({ result }: { result: HourlyResult }) {
  const data = result.steps.map((s) => ({
    time: s.timestamp,
    indoor: round(s.indoor_temp_c),
    outdoor: round(s.outdoor_temp_c),
    hvac: round(s.hvac_kwh),
    occupancy: s.occupancy,
  }));

  return (
    <div className="hourly-charts">
      <h4>Indoor vs outdoor temperature (°C)</h4>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" interval={2} />
          <YAxis unit="°" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="outdoor" name="Outdoor" stroke="#f59e0b" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="indoor" name="Indoor" stroke="#2563eb" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>

      <h4>HVAC energy per hour (kWh)</h4>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" interval={2} />
          <YAxis unit=" kWh" />
          <Tooltip />
          <Bar dataKey="hvac" name="HVAC kWh" fill="#2563eb" />
        </ComposedChart>
      </ResponsiveContainer>

      <h4>Occupancy (people)</h4>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" interval={2} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="occupancy" name="Occupancy" fill="#16a34a" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
