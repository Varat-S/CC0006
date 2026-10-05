/**
 * hourlySimulation.ts — hourly quasi-steady-state scenario analysis (Requirement 12.3).
 *
 * This runs 24 INDEPENDENT hourly operating snapshots: for each hour we load weather +
 * occupancy + schedule, compute heat gains, cooling demand, and electrical demand (by
 * reusing the single-point `simulate()` with per-hour overrides), and store the result.
 * Indoor temperature is NOT carried forward between hours, so this is a sequence of
 * quasi-steady-state snapshots, NOT a transient thermal-capacitance simulation. The UI then
 * plots indoor vs outdoor temperature, HVAC energy, and occupancy over the day.
 *
 * Per-hour energy: because `simulate()` returns daily kWh = power × daily hours, we instead
 * take instantaneous power and multiply by 1 hour per step, and gate HVAC/lighting by the
 * operating schedule for that hour. This keeps the hourly totals internally consistent.
 */

import type { Scenario, SimulationResult } from './types';
import { simulate } from './simulate';
import type { WeatherRow } from '../data/weatherLoader';

export interface HourlyStep {
  hour: number;
  timestamp: string;
  outdoor_temp_c: number;
  indoor_temp_c: number;
  occupancy: number;
  ac_on: boolean;
  lighting_on: boolean;
  fan_on: boolean;
  hvac_kwh: number; // energy in this 1-hour step
  lighting_kwh: number;
  fan_kwh: number;
  plug_kwh: number;
  total_kwh: number; // hvac + lighting + fan + plug
  comfort: SimulationResult['comfort'];
  capacity_limited: boolean;
}

export interface HourlyResult {
  steps: HourlyStep[];
  totals: {
    hvac_kwh_day: number;
    lighting_kwh_day: number;
    fan_kwh_day: number;
    plug_kwh_day: number;
    total_kwh_day: number;
    peak_indoor_temp_c: number;
    hours_outside_comfort: number;
    hours_capacity_limited: number;
  };
}

export interface HourlySchedule {
  /** Hours (0-23) during which the HVAC is scheduled to operate. */
  acHours: Set<number>;
  /** Hours (0-23) during which lighting is scheduled on. */
  lightingHours: Set<number>;
  /** Per-hour occupancy fraction (0..1) of the scenario's peak occupancy. */
  occupancyProfile: number[]; // length 24
}

/** A representative weekday teaching-space schedule (08:00-20:00 occupied/operating). */
export function defaultSchedule(): HourlySchedule {
  const occupancyProfile = Array.from({ length: 24 }, (_, h) => {
    if (h >= 8 && h < 12) return 0.9;
    if (h >= 12 && h < 14) return 0.5; // lunch dip
    if (h >= 14 && h < 18) return 0.9;
    if (h >= 18 && h < 20) return 0.4;
    return 0.0;
  });
  const acHours = new Set<number>();
  const lightingHours = new Set<number>();
  for (let h = 8; h < 20; h++) {
    acHours.add(h);
    lightingHours.add(h);
  }
  return { acHours, lightingHours, occupancyProfile };
}

export function simulateHourly(
  scenario: Scenario,
  weather: WeatherRow[],
  schedule: HourlySchedule = defaultSchedule()
): HourlyResult {
  const steps: HourlyStep[] = [];
  let hvacTotal = 0;
  let lightingTotal = 0;
  let fanTotal = 0;
  let plugTotal = 0;
  let peakIndoor = -Infinity;
  let hoursOutside = 0;
  let hoursCapacity = 0;

  // Use up to 24 hours (one representative day).
  const n = Math.min(24, weather.length);

  for (let h = 0; h < n; h++) {
    const w = weather[h];
    const occFrac = schedule.occupancyProfile[h] ?? 0;
    const acOn = schedule.acHours.has(h);
    const lightingOn = schedule.lightingHours.has(h);

    // Build a per-hour scenario: 1 operating hour per step, gated by the schedule.
    const hourScenario: Scenario = {
      ...scenario,
      environment: {
        ...scenario.environment,
        outdoor_temp_c: w.temperature_c,
        outdoor_rh_pct: w.relative_humidity_pct,
        solar_irradiance_w_m2: w.solar_irradiance_w_m2,
        wind_speed_m_s: w.wind_speed_m_s ?? scenario.environment.wind_speed_m_s,
      },
      operation: {
        ...scenario.operation,
        occupancy: Math.round(scenario.operation.occupancy * occFrac),
        ac_on: scenario.operation.ac_on && acOn,
        ac_hours_per_day: 1, // instantaneous: 1 hour this step
        lighting_hours_per_day: lightingOn ? 1 : 0,
        // Occupancy-responsive AC is already captured by the schedule gating, so disable
        // the daily-runtime shortcut here to avoid double-counting.
        occupied_fraction: 1,
      },
      interventions: {
        ...scenario.interventions,
        occupancy_ac_control: false,
        // Occupancy-responsive lighting: turn lighting off in (nearly) empty hours.
        occupancy_lighting_control: false,
      },
    };

    // Occupancy-responsive lighting at hourly resolution: no occupants => lighting off.
    const effLightingOn =
      lightingOn && (!scenario.interventions.occupancy_lighting_control || occFrac > 0.05);
    if (!effLightingOn) hourScenario.operation.lighting_hours_per_day = 0;

    const r = simulate(hourScenario);

    const hvac_kwh = r.hvac_kwh_day; // ac_hours_per_day=1 => this is the 1-hour energy
    const lighting_kwh = r.lighting_kwh_day;
    // Plug electricity accrues whenever the space is in use (occupied this hour), matching
    // the main simulator which includes plug load. 1-hour step => plug power (kW) × 1 h.
    const plug_on = occFrac > 0.05;
    const plug_kwh = plug_on ? r.plug_kwh_day : 0;
    // Fan runtime is DECOUPLED from HVAC scheduling: run the fan during OCCUPIED hours.
    // r.fan_kwh_day is one hour of fan energy here (per-hour scenario uses 1 h, fraction 1).
    const fan_on = scenario.interventions.fan_enabled && occFrac > 0.05;
    const fan_kwh = fan_on ? r.fan_kwh_day : 0;
    const total_kwh = hvac_kwh + lighting_kwh + fan_kwh + plug_kwh;

    hvacTotal += hvac_kwh;
    lightingTotal += lighting_kwh;
    fanTotal += fan_kwh;
    plugTotal += plug_kwh;
    peakIndoor = Math.max(peakIndoor, r.indoor_temp_c);
    if (r.comfort === 'outside_target') hoursOutside += 1;
    if (r.capacity_limited) hoursCapacity += 1;

    steps.push({
      hour: h,
      timestamp: w.timestamp,
      outdoor_temp_c: w.temperature_c,
      indoor_temp_c: r.indoor_temp_c,
      occupancy: hourScenario.operation.occupancy,
      ac_on: hourScenario.operation.ac_on,
      lighting_on: effLightingOn,
      fan_on,
      hvac_kwh,
      lighting_kwh,
      fan_kwh,
      plug_kwh,
      total_kwh,
      comfort: r.comfort,
      capacity_limited: r.capacity_limited,
    });
  }

  return {
    steps,
    totals: {
      hvac_kwh_day: hvacTotal,
      lighting_kwh_day: lightingTotal,
      fan_kwh_day: fanTotal,
      plug_kwh_day: plugTotal,
      total_kwh_day: hvacTotal + lightingTotal + fanTotal + plugTotal,
      peak_indoor_temp_c: Number.isFinite(peakIndoor) ? peakIndoor : 0,
      hours_outside_comfort: hoursOutside,
      hours_capacity_limited: hoursCapacity,
    },
  };
}

