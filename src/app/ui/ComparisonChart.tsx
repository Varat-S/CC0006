/**
 * ComparisonChart.tsx — simple side-by-side bars for baseline vs scenario electricity.
 */

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonResult } from '../../model/types';

export function ComparisonChart({ comparison }: { comparison: ComparisonResult }) {
  const m = comparison.metrics;
  const data = [
    { name: 'HVAC', baseline: round(m.hvac_kwh_day.baseline), scenario: round(m.hvac_kwh_day.scenario) },
    { name: 'Lighting', baseline: round(m.lighting_kwh_day.baseline), scenario: round(m.lighting_kwh_day.scenario) },
    { name: 'Total', baseline: round(m.total_kwh_day.baseline), scenario: round(m.total_kwh_day.scenario) },
  ];
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit=" kWh" />
          <Tooltip formatter={(v: number) => `${v} kWh/day`} />
          <Legend />
          <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" />
          <Bar dataKey="scenario" name="Scenario" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
