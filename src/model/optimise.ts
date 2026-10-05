/**
 * optimise.ts — brute-force "find best combination" search (Requirement 15.1).
 *
 * Searches a small discrete option space over interventions (and a few setpoints) to find
 * the configuration with the LOWEST total daily electricity whose comfort is still
 * ACCEPTABLE (comfortable or borderline). Deterministic exhaustive search over a bounded
 * grid — adequate for the small option space.
 */

import type { Comfort, Scenario, ShadingLevel } from './types';
import { simulate } from './simulate';

export interface OptimisationCandidate {
  scenario: Scenario;
  total_kwh_day: number;
  indoor_temp_c: number;
  comfort: Comfort;
}

export interface OptimisationResult {
  recommended: OptimisationCandidate | null;
  baselineTotal: number;
  estimatedReductionPct: number;
  evaluated: number;
  acceptableFound: number;
}

const BOOL = [false, true];
const SHADING: ShadingLevel[] = ['none', 'moderate', 'high'];

function isAcceptable(c: Comfort): boolean {
  return c === 'comfortable' || c === 'borderline';
}

/**
 * @param base              the scenario to optimise around (geometry/environment fixed)
 * @param setpointOptions   candidate AC setpoints (°C) to try
 */
export function optimise(
  base: Scenario,
  setpointOptions: number[] = [base.operation.ac_setpoint_c, base.operation.ac_setpoint_c + 1, base.operation.ac_setpoint_c + 2]
): OptimisationResult {
  const baselineTotal = simulate(base).total_kwh_day;

  let best: OptimisationCandidate | null = null;
  let evaluated = 0;
  let acceptableFound = 0;

  for (const setpoint of setpointOptions) {
    for (const fan of BOOL) {
      for (const shading of SHADING) {
        for (const occAc of BOOL) {
          for (const daylight of BOOL) {
            for (const occLight of BOOL) {
              for (const lowE of BOOL) {
                for (const roof of BOOL) {
                  for (const insul of BOOL) {
                    const candidate: Scenario = {
                      ...base,
                      operation: { ...base.operation, ac_setpoint_c: setpoint },
                      interventions: {
                        fan_enabled: fan,
                        external_shading: shading,
                        occupancy_ac_control: occAc,
                        daylight_lighting_control: daylight,
                        occupancy_lighting_control: occLight,
                        low_e_glazing: lowE,
                        reflective_roof: roof,
                        improved_insulation: insul,
                      },
                    };
                    const r = simulate(candidate);
                    evaluated += 1;
                    if (!isAcceptable(r.comfort)) continue;
                    acceptableFound += 1;
                    if (best === null || r.total_kwh_day < best.total_kwh_day) {
                      best = {
                        scenario: candidate,
                        total_kwh_day: r.total_kwh_day,
                        indoor_temp_c: r.indoor_temp_c,
                        comfort: r.comfort,
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const estimatedReductionPct =
    best && baselineTotal > 0 ? ((baselineTotal - best.total_kwh_day) / baselineTotal) * 100 : 0;

  return { recommended: best, baselineTotal, estimatedReductionPct, evaluated, acceptableFound };
}

/** Human-readable list of the interventions active in a candidate. */
export function describeInterventions(s: Scenario): string[] {
  const i = s.interventions;
  const list: string[] = [];
  list.push(`AC setpoint ${s.operation.ac_setpoint_c} °C`);
  if (i.fan_enabled) list.push('Ceiling fan');
  if (i.external_shading !== 'none') list.push(`External shading (${i.external_shading})`);
  if (i.occupancy_ac_control) list.push('Occupancy-responsive AC');
  if (i.daylight_lighting_control) list.push('Daylight-responsive lighting');
  if (i.occupancy_lighting_control) list.push('Occupancy-responsive lighting');
  if (i.low_e_glazing) list.push('Low-E glazing');
  if (i.reflective_roof) list.push('Reflective roof');
  if (i.improved_insulation) list.push('Improved insulation');
  if (list.length === 1) list.push('No interventions');
  return list;
}
