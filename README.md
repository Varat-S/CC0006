# NTU Sustainable Building — Scenario Simulator

A simplified, single-zone **building-performance scenario simulator**, demonstrated using a
*representative* NTU campus space. It lets you define a baseline room, adjust operational
and building parameters, toggle sustainability interventions, and immediately see the
predicted impact on indoor temperature, thermal comfort, and electricity use — always
**compared against a baseline**, with a causal "what changed, and why?" breakdown.

> ## ⚠️ Disclaimer
> This prototype is a simplified building-performance decision-support tool intended for
> **comparative scenario analysis**. It is **not** a calibrated digital twin, certified
> building-energy model, or a substitute for detailed engineering simulation. NTU-specific
> operational parameters that are not publicly available are represented using transparent
> assumptions or user-defined values. It does **not** claim to reproduce any specific
> building (e.g. Gaia or The Hive).

## What it does

- **Baseline room** — ships with an illustrative representative room (100 m², 3 m ceiling,
  30 occupants, 25 m² west-facing glazing, 31 °C / 75 % RH / 500 W/m², 23 °C setpoint).
  Reset to it at any time.
- **Adjustable inputs** — building geometry, environment, and operation (setpoint, hours,
  ventilation, lighting, occupancy, COP, finite HVAC capacity, …).
- **≥10 interventions** — ceiling fan, external shading, occupancy-responsive AC, low-E
  glazing, daylight- and occupancy-responsive lighting, reflective roof, improved
  insulation, ventilation rate, AC setpoint.
- **Comparison + impact breakdown** — baseline-vs-scenario cards, table, and bar chart,
  plus a breakdown of **physical intermediate quantities** (solar gain, envelope/roof
  conduction, lighting heat, ventilation load, HVAC runtime, fan electricity).
- **Transparency** — a Data & Assumptions tab shows every parameter with a structured
  provenance record (source class, title, URL, accessed date, note, confidence), and a
  Methodology tab lists the equations and limitations.

## Modelling approach (summary)

- **Quasi-steady-state single-zone** sensible heat balance:
  `Q_total = Q_envelope + Q_roof + Q_solar + Q_occupancy + Q_lighting + Q_plug + Q_ventilation`.
- **Envelope** (walls + windows): `Q = U·A·(T_out − T_in)`.
- **Roof** via **sol-air** temperature: `T_sol-air = T_out + (α·I)/h_o`, then
  `Q_roof = U_roof·A_roof·(T_sol-air − T_in)`. A reflective roof lowers α.
- **Glazing solar**: `Q = A·SHGC·I·F_orientation·F_shade`.
- **Ventilation**: `Q = ṁ·c_p·(T_out − T_in)` — in hot-humid conditions, more ventilation
  can *increase* cooling load (this is deliberately shown).
- **Finite HVAC capacity**: within capacity → indoor temp stays at setpoint; above capacity
  → solve the equilibrium indoor temperature where gains equal max cooling (bounded
  bisection, deterministic).
- **HVAC electricity**: `P = Q_cooling / COP`, `E = P · effective runtime`.
- **Lighting electricity** is computed **independently** of HVAC hours.
- **Fan** improves the comfort proxy only; it does not lower room air temperature.
- Default model is **sensible-only**: outdoor RH is shown, indoor RH is not predicted
  (latent-load modelling is future work).

All physical constants live in a single config file (`src/data/constants.ts`); comfort
thresholds in `src/data/comfortLimits.ts`; material presets in `src/data/materials.ts`.

## Project structure

```
src/
  model/      pure TypeScript physics (no React) — simulate, compare, each sub-model
  data/       constants, comfort limits, materials, baseline, presets, provenance
  app/
    state/    scenario reducer + useScenario hook
    ui/       control panel, result cards, comparison, breakdown, provenance, methodology
```

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm test          # run the unit + sanity + render tests (vitest --run)
npm run build     # type-check and produce a production build
```

> Node note: if `npm` fails with a missing `proxy-bootstrap.js`, run commands with
> `env -u NODE_OPTIONS` (a sandbox-only environment quirk).

## Testing

The model is deterministic and covered by unit, sanity/monotonicity, capacity/equilibrium,
independent-lighting, geometry-validation, and edge-case tests, plus render smoke tests for
the UI. See `src/model/model.test.ts` and `src/app/App.test.tsx`.

## Example demonstration

From the baseline, applying setpoint 25 °C + ceiling fan + external shading +
occupancy-responsive AC + daylight-responsive lighting reduces total electricity versus the
baseline, with the mechanism visible in the impact breakdown. All numbers are produced by
the model — none are hardcoded. Try the one-click **presets** (Operational optimisation,
Low-cost retrofit, Envelope retrofit, Combined) for quick demos.

## Status

Phases 1–4 of the project spec are implemented (core model, interactive UI, all core
interventions, comfort/provenance/breakdown/methodology). Optional Phase 5 items (weather
CSV / hourly simulation, optimisation search, economic layer) are not yet implemented. See
`.kiro/specs/ntu-building-digital-twin/` for the full requirements, design, and tasks.
