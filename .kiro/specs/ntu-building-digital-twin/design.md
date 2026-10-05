# Design — NTU Sustainable Building Digital-Twin Prototype

## Overview

A lightweight, client-only web application that behaves like a transparent single-zone
building simulator for comparative scenario analysis. The user defines a baseline room,
adjusts parameters, toggles interventions, and immediately sees how predicted indoor
temperature, thermal comfort, and electricity use change **relative to the baseline**,
with a causal impact breakdown.

The guiding engineering principle: **comparative correctness and transparency over false
numerical precision.** The model is a deterministic, quasi-steady-state single-zone heat
balance. There is no backend, no persistence of user data beyond the browser, and no
external data calls at runtime — everything needed ships with the app.

### Why this design
- **Single-zone quasi-steady-state** is sufficient for "what changes, and why?" and keeps
  the physics inspectable (Requirement 4). Transient CFD/BIM are explicitly out of scope.
- **Pure, framework-agnostic model layer** (plain TypeScript, no React imports) makes the
  physics unit-testable in isolation and keeps the "why" auditable (Requirements 4, 14).
- **Config-driven constants and presets** satisfy the no-hardcoded-constants and
  provenance requirements (Requirements 4.9, 9).
- **Client-only** keeps the prototype trivial to run, deterministic, and reproducible.

## Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | **TypeScript** | One language for model + UI; types make the scenario object and physics self-documenting. |
| UI framework | **React 18** | Mature, declarative; good fit for reactive controls → recompute → results. |
| Build/dev | **Vite** | Fast dev server and build; minimal config. |
| Styling | **CSS modules** (or a small utility layer) | Lightweight; no heavy design-system dependency. |
| Charts | **Recharts** | Simple bar/line charts for comparison, breakdown, and (optional) hourly plots. |
| State | **React state + a scenario reducer** (Context or Zustand) | Scenario is a single structured object; a reducer keeps updates explicit and testable. |
| Tests | **Vitest** | Fast, TS-native; runs model unit tests and sanity/monotonicity tests. Run with `--run` (no watch). |
| Lint/format | **ESLint + Prettier** | Consistency. |

> The framework is chosen for inspectability and single-language simplicity, consistent
> with the handoff's "framework can be chosen freely / lightweight web app is sufficient."
> If the team prefers Python, the same module boundaries apply (e.g. Streamlit UI +
> pure-Python model + pytest); this design assumes the TypeScript/React stack.

## Architecture

```
┌──────────────────────────── UI (React) ────────────────────────────┐
│  App shell / tabs: Simulator · Compare · Data&Assumptions · Method  │
│                                                                     │
│  Control panel (Building/Environment/Operation/Interventions)       │
│        │ dispatch(update)                                           │
│        ▼                                                            │
│  Scenario state (reducer)  ──────────────► ScenarioState (baseline  │
│        │ current scenario                     + current)            │
│        ▼                                                            │
│  Results area (cards · comparison · impact breakdown · provenance)  │
└───────────────────────────── │ calls ───────────────────────────────┘
                                ▼
┌─────────────────────── Model (pure TypeScript) ─────────────────────┐
│  simulate(scenario, config) → SimulationResult                      │
│    solarModel · envelopeModel · occupancy/internal gains ·          │
│    ventilationModel · (optional humidityModel) · energyModel ·      │
│    comfortModel                                                     │
│  compare(baselineResult, scenarioResult) → ComparisonResult         │
└────────────────────────────── │ reads ──────────────────────────────┘
                                 ▼
┌───────────────────────────── Data / Config ────────────────────────┐
│  constants (air, person loads, COP, factors) · material presets ·   │
│  comfort limits · default/baseline scenario · scenario presets ·    │
│  provenance tags · (optional) weather CSV loader                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory layout

```
/src
  /app
    App.tsx                 # shell, tabs, layout
    /ui                     # presentational components
      ControlPanel.tsx
      BuildingControls.tsx
      EnvironmentControls.tsx
      OperationControls.tsx
      InterventionToggles.tsx
      ResultCards.tsx
      ComparisonTable.tsx   # baseline vs scenario (central component)
      ImpactBreakdown.tsx
      ProvenancePanel.tsx
      MethodologyPanel.tsx
      PresetSelector.tsx
    /state
      scenarioReducer.ts    # update/reset/applyPreset actions
      useScenario.ts        # hook: current + baseline results, comparison
  /model                    # PURE: no React imports
    types.ts                # Scenario, SimulationResult, ComparisonResult, HeatGains
    simulate.ts             # orchestrates the heat balance → results
    solarModel.ts
    envelopeModel.ts
    internalGains.ts        # occupancy + lighting + plug
    ventilationModel.ts
    humidityModel.ts        # optional / feature-flagged
    comfortModel.ts
    energyModel.ts          # cooling load → HVAC electricity; totals
    compare.ts              # deltas + impact breakdown
  /data
    constants.ts            # the single assumptions/config object
    materials.ts            # glazing/roof presets (documented, illustrative)
    comfortLimits.ts        # configurable thresholds
    baselineScenario.ts     # default illustrative scenario
    scenarioPresets.ts      # Baseline / Operational / Low-cost / Envelope / Combined
    provenance.ts           # per-parameter source class + confidence
    weatherLoader.ts        # optional CSV parsing for dataset/hourly mode
  /tests
    *.test.ts               # unit + sanity/monotonicity (Vitest)
/README.md
```

This mirrors the handoff's recommended modular structure (`/app`, `/model`, `/data`,
`/config`, `/tests`), with `/config` folded into `/data` as plain data files.

## Data Model

### Scenario (input)

```ts
interface Scenario {
  room: {
    floor_area_m2: number;
    ceiling_height_m: number;        // volume = floor_area × ceiling_height
    window_area_m2: number;          // or derived from window_to_wall_ratio
    orientation: 'north' | 'south' | 'east' | 'west';
    glazing_preset: 'standard' | 'low_e';   // drives u/shgc unless custom
    wall_u_value: number;
    roof_u_value: number;
    window_u_value: number;          // from glazing preset or custom
    window_shgc: number;             // from glazing preset or custom
    roof_solar_absorptance: number;
    insulation_level: 'baseline' | 'moderate' | 'high';
  };
  environment: {
    outdoor_temp_c: number;
    outdoor_rh_pct: number;
    solar_irradiance_w_m2: number;
    wind_speed_m_s?: number;
  };
  operation: {
    occupancy: number;
    ac_setpoint_c: number;
    ventilation_ach: number;
    lighting_w_m2: number;
    plug_load_w_m2: number;
    ac_hours_per_day: number;
    lighting_hours_per_day: number;  // INDEPENDENT of ac_hours_per_day
    hvac_cop: number;                // editable in advanced panel
    hvac_capacity_kw: number;        // finite cooling capacity (editable, advanced)
    occupied_fraction: number;       // used by occupancy-responsive AC
  };
  interventions: {
    fan_enabled: boolean;
    external_shading: 'none' | 'moderate' | 'high';
    occupancy_ac_control: boolean;
    daylight_lighting_control: boolean;
    occupancy_lighting_control: boolean;
    low_e_glazing: boolean;          // convenience toggle → glazing_preset
    reflective_roof: boolean;
    improved_insulation: boolean;
  };
}
```

All values are explicit and inspectable (Requirement 1.4). Geometry derivations (wall area,
volume) are computed in the model and documented, not stored as hidden magic.

### SimulationResult (output)

Heat gains are a function of the indoor temperature (`T_in`), because envelope, roof
sol-air, and ventilation terms all depend on `ΔT`. We therefore model gains as
`gains(T_in)` and resolve `T_in` against finite capacity (see HVAC energy below).

```ts
interface HeatGains {               // all in W (sensible), evaluated at a given T_in
  envelope: number;                 // opaque walls + window conduction
  roof: number;                     // sol-air driven roof conduction (separate term)
  solar: number;                    // glazing solar gain only
  occupancy: number;
  lighting: number;
  plug: number;
  ventilation: number;              // can be negative only if T_out < T_in
  total: number;
}

interface SimulationResult {
  gains: HeatGains;                 // evaluated at the resolved indoor_temp_c
  required_load_w: number;          // load to hold setpoint (max(0, gains@setpoint))
  cooling_load_w: number;           // min(required_load, capacity)
  capacity_limited: boolean;        // true when required_load > capacity
  hvac_power_kw: number;            // cooling_load / COP
  effective_ac_hours: number;       // ac_hours × occupied_fraction if occupancy AC on
  hvac_kwh_day: number;
  lighting_kwh_day: number;         // from lighting_hours_per_day, independent of HVAC
  fan_kwh_day: number;
  plug_kwh_day: number;             // if plug load enabled
  total_kwh_day: number;
  indoor_temp_c: number;            // = setpoint when within capacity; solved equilibrium when capacity_limited; drifts to outdoor if AC off
  indoor_temp_basis: 'setpoint' | 'equilibrium' | 'ac_off'; // for honest labelling in UI
  perceived_temp_c: number;         // indoor_temp − fan_offset when fan on
  indoor_rh_pct?: number;           // only if humidity model active
  comfort: 'comfortable' | 'borderline' | 'outside_target';
}
```

### ComparisonResult (scenario vs baseline)

The impact breakdown reports **physical intermediate quantities** (baseline → scenario),
not per-intervention attributed savings, to avoid double-counting interactions
(Requirement 7.3).

```ts
interface MetricDelta { baseline: number; scenario: number; delta_abs: number; delta_pct: number; }

interface BreakdownRow {
  label: string;                    // e.g. "Solar heat gain"
  unit: 'kW' | 'h' | 'kWh/day';
  baseline: number;
  scenario: number;
  delta_pct: number;
}

interface ComparisonResult {
  metrics: {
    indoor_temp_c: MetricDelta;
    hvac_kwh_day: MetricDelta;
    lighting_kwh_day: MetricDelta;
    total_kwh_day: MetricDelta;
  };
  comfort: { baseline: Comfort; scenario: Comfort };
  impact_breakdown: BreakdownRow[]; // solar gain, envelope conduction, roof conduction,
                                    // lighting heat, ventilation load (kW); HVAC runtime (h);
                                    // fan electricity (kWh/day) — each baseline → scenario
}
```

## Model / Physics Design

All constants come from `/data/constants.ts`; nothing is hardcoded in the physics
functions (Requirement 4.9). Representative defaults:

```ts
export const CONSTANTS = {
  air_density: 1.2,            // kg/m³
  air_cp: 1005,                // J/(kg·K)
  person_sensible_w: 75,
  person_latent_w: 55,
  default_hvac_cop: 3.5,
  default_hvac_capacity_kw: 20,   // finite cooling capacity (illustrative)
  outside_surface_h_o: 25,        // W/(m²·K), outside surface heat-transfer coeff (sol-air)
  default_fan_power_w: 50,
  fan_comfort_offset_c: 0.8,
  shading_factor: { none: 1.0, moderate: 0.75, high: 0.65 },
  daylight_lighting_factor: 0.70,   // reduces effective lighting POWER (LPD)
  occupancy_lighting_factor: 0.75,  // reduces effective lighting HOURS
  occupancy_control_runtime_factor: 0.75, // fallback when occupied_fraction not set
  orientation_factor: { north: 0.4, south: 0.7, east: 0.85, west: 1.0 },
  equilibrium_solver: { t_min_c: 18, t_max_c: 50, tol_c: 0.01, max_iter: 60 },
};
```

### Geometry derivation (documented approximation)
- `volume_m3 = floor_area × ceiling_height`.
- Assume a roughly square floor plan: `side = sqrt(floor_area)`; `perimeter = 4·side`;
  `gross_wall_area = perimeter × ceiling_height`; `opaque_wall_area = gross_wall − window_area`.
- `roof_area = floor_area`.
- These are clearly commented as simplifying assumptions (Requirement 1.6).

### Envelope (opaque walls + window conduction) — `Q = U·A·ΔT`, `ΔT = T_out − T_in`
Sum conductive gains for opaque walls and window glass. Improved insulation lowers
`wall_u_value` per `insulation_level`; low-E lowers `window_u_value`. The roof is handled
separately below via sol-air (it is driven by absorbed solar, not plain `T_out`).

### Roof — sol-air temperature (Requirement 4.2a)
`T_sol-air = T_out + (α · I) / h_o`, then `Q_roof = U_roof · A_roof · (T_sol-air − T_in)`,
where α = `roof_solar_absorptance`, I = solar irradiance, h_o = `outside_surface_h_o`.
A **reflective roof lowers α** (baseline 0.75 → reflective 0.30), which lowers `T_sol-air`
and therefore roof conduction indoors. Absorbed roof solar is **never** added directly to
the indoor load. Improved insulation lowers `roof_u_value`.

### Solar (glazing only) — `Q_solar = A_glass · SHGC · I · F_orientation · F_shade`
`F_shade` from the shading dropdown; `F_orientation` from the simplified factor table. The
orientation factor is clearly labelled simplified; hourly solar geometry is a future
replacement, not an MVP claim. (Roof solar is handled by the sol-air term above, not here.)

### Internal gains
- Occupancy sensible: `N · person_sensible_w`.
- Lighting heat: `A_floor · effective_LPD`, where **daylight-responsive** control reduces
  effective LPD (× `daylight_lighting_factor`). This reduced LPD lowers lighting heat.
- Plug: `A_floor · EPD` (optional/advanced; defaults modest).

### Lighting electricity (independent of HVAC — Requirement 7a)
`E_lighting = effective_LPD · A_floor · effective_lighting_hours / 1000` (kWh/day), using
`lighting_hours_per_day`, NOT `ac_hours_per_day`. **Daylight-responsive** control reduces
effective LPD; **occupancy-responsive** control reduces effective lighting hours
(× `occupancy_lighting_factor`). Both propagate to lighting electricity and lighting heat.

### Ventilation — `Q_vent = ṁ·c_p·ΔT`
`V̇ = ACH · volume / 3600`; `ṁ = ρ · V̇`. In hot outdoor conditions `ΔT>0` so more ACH
*raises* cooling load — the design deliberately preserves this to demonstrate the
"ventilation ≠ always better" interaction (Requirement 3.7). If the humidity model is
active, a latent ventilation term is added.

### Humidity (feature-flagged, Requirement 5)
Default MVP: **display outdoor RH only**, omit predicted indoor RH, and state latent
modelling is future work. If enabled, a simplified moisture balance (outdoor RH +
occupant latent + ventilation latent − HVAC moisture removal) estimates indoor RH; it is
gated behind a flag so no fake precise RH is ever shown.

### HVAC energy and indoor-temperature resolution (Requirement 4.7)
HVAC capacity is **finite** (`hvac_capacity_kw`). The indoor temperature is resolved
honestly rather than assumed:
1. Compute `required_load_w = max(0, gains(T_in = setpoint).total)` — the load needed to
   hold the setpoint. (Negative loads floored at 0 → Requirement 13.)
2. **Within capacity:** if `required_load_w ≤ capacity`, then `indoor_temp_c = setpoint`
   (`indoor_temp_basis = 'setpoint'`) and `cooling_load_w = required_load_w`.
3. **Capacity-limited:** if `required_load_w > capacity`, solve for the equilibrium `T_in`
   where `gains(T_in).total = capacity` using a bounded bisection over
   `equilibrium_solver` (fixed tolerance/iteration cap → deterministic). This yields an
   elevated `indoor_temp_c` (`indoor_temp_basis = 'equilibrium'`) with
   `cooling_load_w = capacity`. Because gains fall as `T_in` rises (ΔT shrinks), a unique
   root exists in the bracket; `gains(T_in)` is monotonic in `T_in`.
4. **AC off:** `cooling_load_w = 0`, `hvac_kwh_day = 0`, `indoor_temp_c` drifts toward
   outdoor (`indoor_temp_basis = 'ac_off'`). No negative electricity.

Then `hvac_power_kw = cooling_load_w / 1000 / COP`; effective runtime =
`ac_hours × occupied_fraction` when occupancy-AC is on, else `ac_hours`;
`hvac_kwh_day = hvac_power_kw × effective_runtime`.

This makes gain-reducing interventions (shading, glazing, insulation, reflective roof)
legitimately lower the **equilibrium indoor temperature** in capacity-limited cases — we
never claim they change indoor air temperature while assuming unlimited capacity.

### Fan (Requirement 3.4)
Adds `fan_kwh_day = fan_power_w/1000 × fan_hours`, where fan runtime is **decoupled** from
HVAC runtime: `fan_hours = ac_hours_per_day × occupied_fraction` (the fan runs during
occupied hours, representing a "higher setpoint + fan-assisted comfort" strategy). Does
**not** change `indoor_temp_c`; instead `perceived_temp_c = indoor_temp_c −
fan_comfort_offset_c`, which feeds comfort only. In hourly mode the fan runs during occupied
hours regardless of whether the AC is scheduled on that hour.

### Comfort (Requirement 6)
Thresholds from `/data/comfortLimits.ts` (configurable, referencing Singapore/BCA guidance).
Classify using `perceived_temp_c` (and RH if available) against BOTH a lower and an upper
bound (`comfortable_min/max_c`, `borderline_min/max_c`) so that overcooled (too-cold)
conditions are not treated as comfortable: outside the borderline band → Outside target;
within borderline but outside comfortable → Borderline; within the comfortable band →
Comfortable. Status badge shown. No PMV/PPD claim.

### Totals & comparison
`total_kwh_day = hvac + lighting + fan (+ plug)`. `compare()` computes per-metric absolute
and % deltas vs the baseline result. The **impact breakdown reports physical intermediate
quantities** as baseline → scenario (solar gain, envelope conduction, roof conduction,
lighting heat, ventilation load in kW; HVAC runtime in h; fan electricity in kWh/day) each
with its own %. It does **not** sum per-intervention attributed savings, so interactions
between multiple simultaneous interventions are never double-counted (Requirement 7.3).

## UI Design

- **Layout:** left control panel (Building / Environment / Operation / Interventions) +
  right results area. Optional top tabs: Simulator · Compare · Data & Assumptions ·
  Methodology.
- **Controls:** sliders for continuous values, dropdowns for material/shading presets,
  toggles for interventions, tooltips per variable, Reset-to-baseline button, preset
  selector, optional Save-scenario.
- **Results area:** top cards (temperature, comfort badge, HVAC kWh/day, total kWh/day,
  energy delta %); comparison table/bar chart (baseline vs scenario); impact breakdown;
  provenance/assumptions one click away.
- **Reactivity:** any control change dispatches a scenario update → the model recomputes
  current + baseline → results re-render. Target: a full 5-toggle demo in ~30 seconds
  (Requirement 11.5).
- **Framing:** header/footer carry the proof-of-concept and "representative NTU space"
  disclaimer; never "digital twin of Gaia".

## Data, Provenance & Weather

- **Provenance:** `/data/provenance.ts` maps each parameter to a **structured provenance
  record** so the Data & Assumptions view answers both "what kind of source?" and "where
  exactly?":
  ```ts
  type SourceClass =
    | 'PUBLIC_NTU_DATA' | 'PUBLIC_SINGAPORE_DATA' | 'ENGINEERING_REFERENCE'
    | 'MANUFACTURER_SPECIFICATION' | 'ASSUMPTION' | 'USER_INPUT';

  interface Provenance {
    sourceClass: SourceClass;
    sourceTitle: string;          // e.g. "ASHRAE Fundamentals 2021, Ch. 15"
    sourceUrl: string | null;     // link when one exists
    accessedDate: string | null;  // ISO date the value was taken
    note: string;                 // e.g. "Representative value; not NTU-specific"
    confidence: 'high' | 'medium' | 'low';
  }
  ```
  The same structure is used for NTU, Singapore-weather, BCA, manufacturer, assumption, and
  user-input values (inapplicable fields may be null).
- **Materials:** `/data/materials.ts` holds glazing/roof presets with documented,
  illustrative values, each carrying a `Provenance` record.
- **Weather:** Manual mode is default. Optional Dataset mode uses `weatherLoader.ts` to
  parse CSV (timestamp, temperature_c, relative_humidity_pct, solar_irradiance_w_m2,
  wind_speed_m_s); optional hourly simulation iterates timesteps and plots indoor/outdoor
  temperature, HVAC energy, and occupancy. MVP works entirely without these.

## Error Handling & Edge Cases (Requirement 13)

- **Geometry/input validation (Requirement 13.4):** a `validateScenario(scenario)` function
  enforces `floor_area > 0`, `ceiling_height > 0`, `ACH >= 0`, `occupancy >= 0`, and
  `window_area <= gross_wall_area` (gross wall area derived from floor area + ceiling
  height). It returns a list of human-readable validation messages; the UI shows these and
  blocks/annotates the result rather than silently computing impossible geometry.
- Clamp/validate inputs at the control layer (non-negative areas, occupancy, ACH; sane
  ranges) so the model receives valid numbers.
- Cooling load floored at 0 → no negative electricity when `T_out ≤ setpoint` or AC off.
- Guard against division/degenerate geometry (e.g. zero floor area) producing NaN/Infinity;
  the model returns safe zeros/placeholders instead.
- Zero window area ⇒ zero solar + zero window conduction; zero occupants ⇒ zero occupant
  load; extreme humidity handled by the humidity flag (shown or omitted, never fabricated).

## Testing Strategy (Requirements 14)

- **Unit tests** (Vitest, run with `--run`): solar load, envelope load, occupancy load,
  ventilation load, HVAC power conversion, scenario delta, fan comfort adjustment, lighting
  intervention, occupancy runtime reduction.
- **Sanity / monotonicity tests:** higher outdoor temp → more cooling; higher occupancy →
  more load; higher setpoint → less cooling; shading → less solar; low-E → less glazing
  gain; more insulation → less envelope load; reflective roof (lower α) → lower roof sol-air
  and lower roof conduction; fan → more fan electricity + better comfort proxy but ≤ small
  air-temp change; daylight lighting → lower effective LPD → less lighting electricity +
  less lighting heat; occupancy lighting → fewer lighting hours → less lighting electricity;
  occupancy AC → less runtime when occupied fraction < 1.
- **Capacity / indoor-temp tests:** within capacity → `indoor_temp_c == setpoint`
  (`basis = 'setpoint'`); demand above capacity → `indoor_temp_c > setpoint` and
  `cooling_load_w == capacity` (`basis = 'equilibrium'`); gain-reducing interventions lower
  the equilibrium temperature in capacity-limited cases; equilibrium solver converges
  deterministically within the iteration cap.
- **Independent lighting test:** changing `ac_hours_per_day` does not change
  `lighting_kwh_day`; changing `lighting_hours_per_day` does.
- **Invariants:** no NaN/Infinity/negative electricity; no negative loads from any
  intervention; determinism (same inputs → same outputs).
- **Demo regression:** assert the polished example scenario's deltas are produced by the
  model (not hardcoded) and remain stable.

## Implementation Phasing (maps to tasks)

1. **Phase 1 — core model:** scenario data model, baseline config, envelope, occupancy,
   lighting, solar, HVAC electricity + unit tests.
2. **Phase 2 — UI + first interventions:** control panel, results, baseline/scenario
   comparison, AC setpoint, occupancy, shading, glazing.
3. **Phase 3 — remaining interventions:** fan, ventilation, occupancy-responsive AC,
   daylight lighting, reflective roof, insulation.
4. **Phase 4 — comfort, provenance, breakdown, charts, methodology.**
5. **Phase 5 (optional):** weather CSV, hourly simulation, optimisation, economics.

Hourly simulation and optimisation are explicitly **not** started first.
