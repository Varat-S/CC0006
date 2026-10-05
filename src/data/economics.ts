/**
 * economics.ts — ILLUSTRATIVE economic assumptions (Requirement 15.2).
 *
 * All values are illustrative order-of-magnitude figures for a ~100 m² space, NOT sourced
 * quotations. They exist to demonstrate the economic sustainability dimension (capital
 * cost / annual saving / simple payback), not to provide financial advice.
 */

import type { Provenance } from './provenance';

const illustrative = (note: string): Provenance => ({
  sourceClass: 'ASSUMPTION',
  sourceTitle: 'Illustrative cost assumption',
  sourceUrl: null,
  accessedDate: null,
  note,
  confidence: 'low',
});

export interface EconomicAssumptions {
  /** Electricity tariff in SGD per kWh (illustrative). */
  tariff_sgd_per_kwh: number;
  /** Operating days per year used to annualise daily savings. */
  operating_days_per_year: number;
  /** Illustrative capital cost (SGD) for each intervention when enabled. */
  capital_cost_sgd: {
    fan_enabled: number;
    external_shading: number;
    occupancy_ac_control: number;
    daylight_lighting_control: number;
    occupancy_lighting_control: number;
    low_e_glazing: number;
    reflective_roof: number;
    improved_insulation: number;
    ac_setpoint_change: number; // operational change — effectively free
  };
  provenance: Provenance;
}

export const ECONOMICS: EconomicAssumptions = {
  tariff_sgd_per_kwh: 0.3, // illustrative SG commercial tariff
  operating_days_per_year: 250, // ~weekday teaching calendar
  capital_cost_sgd: {
    fan_enabled: 400,
    external_shading: 6000,
    occupancy_ac_control: 2500,
    daylight_lighting_control: 3000,
    occupancy_lighting_control: 1500,
    low_e_glazing: 12000,
    reflective_roof: 8000,
    improved_insulation: 10000,
    ac_setpoint_change: 0,
  },
  provenance: illustrative(
    'Order-of-magnitude figures for a ~100 m² space; not sourced quotations. For demonstration only.'
  ),
};
