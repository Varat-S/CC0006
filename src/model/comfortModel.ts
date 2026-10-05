/**
 * comfortModel.ts — simplified comfort status (Requirement 6).
 *
 * Classifies Comfortable / Borderline / Outside target using the (fan-adjusted) PERCEIVED
 * temperature and, when available, indoor RH. Thresholds come from the configurable
 * comfortLimits file. This is NOT a PMV/PPD model.
 */

import { COMFORT_LIMITS, type ComfortLimits } from '../data/comfortLimits';
import type { Comfort } from './types';

export function classifyComfort(
  perceived_temp_c: number,
  indoor_rh_pct?: number,
  limits: ComfortLimits = COMFORT_LIMITS
): Comfort {
  // Temperature-based classification, enforcing BOTH a lower and upper bound so that
  // overcooled (too-cold) conditions are not treated as comfortable.
  let byTemp: Comfort;
  if (perceived_temp_c < limits.borderline_min_c || perceived_temp_c > limits.borderline_max_c) {
    byTemp = 'outside_target';
  } else if (perceived_temp_c < limits.comfortable_min_c || perceived_temp_c > limits.comfortable_max_c) {
    byTemp = 'borderline';
  } else {
    byTemp = 'comfortable';
  }

  // If RH is modelled, it can only worsen (never improve) the status.
  if (indoor_rh_pct === undefined) return byTemp;

  let byRh: Comfort;
  if (indoor_rh_pct <= limits.rh_comfortable_max_pct) byRh = 'comfortable';
  else if (indoor_rh_pct <= limits.rh_borderline_max_pct) byRh = 'borderline';
  else byRh = 'outside_target';

  return worseOf(byTemp, byRh);
}

const RANK: Record<Comfort, number> = { comfortable: 0, borderline: 1, outside_target: 2 };

function worseOf(a: Comfort, b: Comfort): Comfort {
  return RANK[a] >= RANK[b] ? a : b;
}

export function comfortLabel(c: Comfort): string {
  switch (c) {
    case 'comfortable':
      return 'Comfortable';
    case 'borderline':
      return 'Borderline';
    case 'outside_target':
      return 'Outside target';
  }
}
