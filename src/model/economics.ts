/**
 * economics.ts (model) — illustrative economic + sustainability-dimension summary
 * (Requirements 15.2, 15.3, 7.4).
 *
 * Computes capital cost, annual electricity saving, and simple payback for a scenario
 * versus the baseline, plus a three-dimension sustainability summary (environmental /
 * economic / social). All monetary figures are ILLUSTRATIVE.
 */

import { ECONOMICS } from '../data/economics';
import type { Scenario, SimulationResult } from './types';

export interface EconomicResult {
  daily_saving_kwh: number;
  annual_saving_kwh: number;
  annual_saving_sgd: number;
  capital_cost_sgd: number;
  simple_payback_years: number | null; // null when there is no net saving
  activeCostItems: { label: string; cost_sgd: number }[];
}

export interface SustainabilitySummary {
  environmental: {
    daily_electricity_delta_kwh: number;
    daily_electricity_delta_pct: number;
    annual_co2_delta_kg: number; // illustrative via grid factor
  };
  economic: {
    annual_saving_sgd: number;
    capital_cost_sgd: number;
    simple_payback_years: number | null;
  };
  social: {
    comfort: SimulationResult['comfort'];
    perceived_temp_c: number;
    indoor_temp_c: number;
    outdoor_rh_pct: number;
  };
}

function capitalCost(scenario: Scenario, baseline: Scenario): EconomicResult['activeCostItems'] {
  const c = ECONOMICS.capital_cost_sgd;
  const i = scenario.interventions;
  const items: EconomicResult['activeCostItems'] = [];
  if (i.fan_enabled) items.push({ label: 'Ceiling fan', cost_sgd: c.fan_enabled });
  if (i.external_shading !== 'none') items.push({ label: 'External shading', cost_sgd: c.external_shading });
  if (i.occupancy_ac_control) items.push({ label: 'Occupancy-responsive AC', cost_sgd: c.occupancy_ac_control });
  if (i.daylight_lighting_control) items.push({ label: 'Daylight-responsive lighting', cost_sgd: c.daylight_lighting_control });
  if (i.occupancy_lighting_control) items.push({ label: 'Occupancy-responsive lighting', cost_sgd: c.occupancy_lighting_control });
  if (i.low_e_glazing) items.push({ label: 'Low-E glazing', cost_sgd: c.low_e_glazing });
  if (i.reflective_roof) items.push({ label: 'Reflective roof', cost_sgd: c.reflective_roof });
  if (i.improved_insulation) items.push({ label: 'Improved insulation', cost_sgd: c.improved_insulation });
  if (scenario.operation.ac_setpoint_c !== baseline.operation.ac_setpoint_c) {
    items.push({ label: 'AC setpoint change', cost_sgd: c.ac_setpoint_change });
  }
  return items;
}

export function computeEconomics(
  baselineResult: SimulationResult,
  scenarioResult: SimulationResult,
  scenario: Scenario,
  baseline: Scenario
): EconomicResult {
  const daily_saving_kwh = baselineResult.total_kwh_day - scenarioResult.total_kwh_day;
  const annual_saving_kwh = daily_saving_kwh * ECONOMICS.operating_days_per_year;
  const annual_saving_sgd = annual_saving_kwh * ECONOMICS.tariff_sgd_per_kwh;

  const activeCostItems = capitalCost(scenario, baseline);
  const capital_cost_sgd = activeCostItems.reduce((s, it) => s + it.cost_sgd, 0);

  const simple_payback_years =
    annual_saving_sgd > 0 ? capital_cost_sgd / annual_saving_sgd : null;

  return {
    daily_saving_kwh,
    annual_saving_kwh,
    annual_saving_sgd,
    capital_cost_sgd,
    simple_payback_years,
    activeCostItems,
  };
}

export function sustainabilitySummary(
  baselineResult: SimulationResult,
  scenarioResult: SimulationResult,
  scenario: Scenario,
  baseline: Scenario
): SustainabilitySummary {
  const econ = computeEconomics(baselineResult, scenarioResult, scenario, baseline);
  const dailyDeltaKwh = scenarioResult.total_kwh_day - baselineResult.total_kwh_day;
  const dailyDeltaPct =
    baselineResult.total_kwh_day > 0 ? (dailyDeltaKwh / baselineResult.total_kwh_day) * 100 : 0;

  return {
    environmental: {
      daily_electricity_delta_kwh: dailyDeltaKwh,
      daily_electricity_delta_pct: dailyDeltaPct,
      annual_co2_delta_kg: dailyDeltaKwh * ECONOMICS.operating_days_per_year * ECONOMICS.grid_co2_kg_per_kwh,
    },
    economic: {
      annual_saving_sgd: econ.annual_saving_sgd,
      capital_cost_sgd: econ.capital_cost_sgd,
      simple_payback_years: econ.simple_payback_years,
    },
    social: {
      comfort: scenarioResult.comfort,
      perceived_temp_c: scenarioResult.perceived_temp_c,
      indoor_temp_c: scenarioResult.indoor_temp_c,
      outdoor_rh_pct: scenario.environment.outdoor_rh_pct,
    },
  };
}
