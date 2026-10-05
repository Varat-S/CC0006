/**
 * comfortLimits.ts — configurable thermal-comfort thresholds (Requirement 6.3).
 *
 * These reference Singapore / BCA guidance ranges for air-conditioned spaces and are
 * presented as REFERENCE values, not statutory regulation. Thresholds are intentionally
 * kept in one editable place. This is a simplified comfort envelope, NOT a PMV/PPD model.
 *
 * Classification uses the (fan-adjusted) perceived temperature, and optionally RH when an
 * indoor humidity model is active.
 */

export interface ComfortLimits {
  /** At or below this perceived temperature => Comfortable (upper edge of comfort). */
  comfortable_max_c: number;
  /** Above comfortable_max_c and at/below this => Borderline; above => Outside target. */
  borderline_max_c: number;
  /** Optional RH envelope (used only when indoor RH is modelled). */
  rh_comfortable_max_pct: number;
  rh_borderline_max_pct: number;
}

export const COMFORT_LIMITS: ComfortLimits = {
  // Typical SG air-conditioned comfort upper edge ~ 25 C; borderline up to ~ 27 C.
  comfortable_max_c: 25.0,
  borderline_max_c: 27.0,
  // Indoor RH comfort guidance (BCA Green Mark references ~ 65-70% upper bound).
  rh_comfortable_max_pct: 65,
  rh_borderline_max_pct: 75,
};
