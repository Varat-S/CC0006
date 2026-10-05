/**
 * compare.ts — baseline-vs-scenario deltas and the impact breakdown (Requirement 7).
 *
 * The impact breakdown reports changes in PHYSICAL INTERMEDIATE QUANTITIES (baseline →
 * scenario), NOT per-intervention attributed savings — so interactions between multiple
 * simultaneous interventions are never double-counted (Requirement 7.3).
 */

import type { BreakdownRow, ComparisonResult, MetricDelta, SimulationResult } from './types';

function delta(baseline: number, scenario: number): MetricDelta {
  const delta_abs = scenario - baseline;
  const delta_pct = baseline !== 0 ? (delta_abs / Math.abs(baseline)) * 100 : scenario === 0 ? 0 : 100;
  return { baseline, scenario, delta_abs, delta_pct };
}

function pct(baseline: number, scenario: number): number {
  if (baseline !== 0) return ((scenario - baseline) / Math.abs(baseline)) * 100;
  return scenario === 0 ? 0 : 100;
}

export function compare(baseline: SimulationResult, scenario: SimulationResult): ComparisonResult {
  const row = (
    label: string,
    unit: BreakdownRow['unit'],
    b: number,
    s: number
  ): BreakdownRow => ({ label, unit, baseline: b, scenario: s, delta_pct: pct(b, s) });

  const impact_breakdown: BreakdownRow[] = [
    row('Solar heat gain', 'kW', baseline.gains.solar / 1000, scenario.gains.solar / 1000),
    row('Envelope conduction', 'kW', baseline.gains.envelope / 1000, scenario.gains.envelope / 1000),
    row('Roof conduction', 'kW', baseline.gains.roof / 1000, scenario.gains.roof / 1000),
    row('Occupancy load', 'kW', baseline.gains.occupancy / 1000, scenario.gains.occupancy / 1000),
    row('Lighting heat', 'kW', baseline.gains.lighting / 1000, scenario.gains.lighting / 1000),
    row('Ventilation load', 'kW', baseline.gains.ventilation / 1000, scenario.gains.ventilation / 1000),
    row('HVAC runtime', 'h', baseline.effective_ac_hours, scenario.effective_ac_hours),
    row('Fan electricity', 'kWh/day', baseline.fan_kwh_day, scenario.fan_kwh_day),
  ];

  return {
    metrics: {
      indoor_temp_c: delta(baseline.indoor_temp_c, scenario.indoor_temp_c),
      hvac_kwh_day: delta(baseline.hvac_kwh_day, scenario.hvac_kwh_day),
      lighting_kwh_day: delta(baseline.lighting_kwh_day, scenario.lighting_kwh_day),
      total_kwh_day: delta(baseline.total_kwh_day, scenario.total_kwh_day),
    },
    comfort: { baseline: baseline.comfort, scenario: scenario.comfort },
    impact_breakdown,
  };
}
