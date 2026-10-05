/**
 * comfortLimits.ts — configurable thermal-comfort thresholds (Requirement 6.3).
 *
 * These reference Singapore / BCA guidance ranges for air-conditioned spaces and are
 * presented as REFERENCE values, not statutory regulation. Thresholds are intentionally
 * kept in one editable place. This is a simplified comfort envelope, NOT a PMV/PPD model.
 *
 * Classification uses the (fan-adjusted) perceived temperature, and optionally RH when an
 * indoor humidity model is active. BOTH a lower and an upper bound are enforced so that
 * unrealistically cold (overcooled) conditions are not classified as comfortable.
 */

export interface ComfortLimits {
  /** Comfortable band (perceived temperature). */
  comfortable_min_c: number;
  comfortable_max_c: number;
  /** Borderline band extends below/above the comfortable band; outside it => outside target. */
  borderline_min_c: number;
  borderline_max_c: number;
  /** Optional RH envelope (used only when indoor RH is modelled). */
  rh_comfortable_max_pct: number;
  rh_borderline_max_pct: number;
}

export const COMFORT_LIMITS: ComfortLimits = {
  // Typical SG air-conditioned comfort band ~ 23-25 C; borderline 22-27 C.
  comfortable_min_c: 23.0,
  comfortable_max_c: 25.0,
  borderline_min_c: 22.0,
  borderline_max_c: 27.0,
  // Indoor RH comfort guidance (SS 554 / BCA Green Mark reference ~ 65-70% upper bound).
  rh_comfortable_max_pct: 65,
  rh_borderline_max_pct: 75,
};
