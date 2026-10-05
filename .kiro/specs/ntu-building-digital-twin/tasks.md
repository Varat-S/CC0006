# Implementation Plan — NTU Sustainable Building Digital-Twin Prototype

Tasks are ordered to follow the handoff's implementation sequence (model first; hourly
simulation and optimisation last). Each task references the requirements it satisfies.

## Phase 1 — Core model foundation

- [ ] 1. Scaffold the project and config layer
  - Initialise a Vite + React + TypeScript app with Vitest, ESLint, Prettier.
  - Create `/src/data/constants.ts` as the single assumptions/config object (air density,
    cp, person loads, COP, fan power, fan comfort offset, shading/lighting/orientation
    factors) — no constants hardcoded elsewhere.
  - Create `/src/data/comfortLimits.ts` and `/src/data/materials.ts` (glazing/roof presets,
    documented as illustrative).
  - _Requirements: 4.9, 6.3, 9.4_

- [ ] 2. Define the scenario and result types and the baseline scenario
  - Implement `/src/model/types.ts` (`Scenario`, `HeatGains`, `SimulationResult`,
    `MetricDelta`, `ComparisonResult`).
  - Implement `/src/data/baselineScenario.ts` (default illustrative values from handoff §7).
  - _Requirements: 1.1, 1.3, 1.4, 4.1_

- [ ] 3. Implement geometry derivation and the envelope model
  - Derive volume, wall/roof areas from floor area + ceiling height with documented
    comments; implement `envelopeModel.ts` using `Q = U·A·ΔT`.
  - _Requirements: 1.6, 4.2_

- [ ] 4. Implement solar and internal-gains models
  - `solarModel.ts`: `A_glass·SHGC·I·F_orientation·F_shade` + reflective-roof absorbed-solar
    term via absorptance.
  - `internalGains.ts`: occupancy sensible, lighting heat (reducible), plug load.
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 5. Implement ventilation and HVAC energy models and the orchestrator
  - `ventilationModel.ts`: `V̇ = ACH·V/3600`, `ṁ = ρ·V̇`, `Q = ṁ·cp·ΔT` (keeps the
    hot-humid "more ACH → more load" behaviour).
  - `energyModel.ts`: `cooling_load = max(0, total)`, `P = load/COP`, daily kWh with
    effective runtime; totals.
  - `simulate.ts`: orchestrate the full heat balance → `SimulationResult`.
  - _Requirements: 4.1, 4.6, 4.7, 4.8, 13.2, 13.3_

- [ ] 6. Phase-1 unit and sanity tests
  - Vitest tests (run with `--run`) for envelope, solar, occupancy, ventilation, HVAC power
    conversion; monotonicity for outdoor temp, occupancy, setpoint; no NaN/Infinity/negative
    electricity.
  - _Requirements: 14.1, 14.2, 14.3, 4.8_

## Phase 2 — Interactive UI and comparison; first interventions

- [ ] 7. Scenario state and comparison engine
  - `/src/app/state/scenarioReducer.ts` (update/reset/applyPreset) and `useScenario.ts`
    hook returning current + baseline results.
  - `compare.ts`: per-metric absolute/% deltas vs baseline + impact-breakdown assembly.
  - _Requirements: 1.5, 7.2, 7.3, 2.4_

- [ ] 8. Control panel and results area shell
  - Building / Environment / Operation control sections (sliders, dropdowns, tooltips);
    result cards; reset-to-baseline button.
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.1, 11.1, 11.2, 11.4_

- [ ] 9. Baseline-vs-scenario comparison UI
  - `ComparisonTable.tsx` / bar chart as the central comparison component.
  - _Requirements: 7.2, 11.2_

- [ ] 10. Interventions: AC setpoint, occupancy, external shading, glazing
  - Wire setpoint and occupancy to the model; add shading dropdown (none/moderate/high) and
    glazing preset (standard/low-E) driving U/SHGC.
  - _Requirements: 3.2, 3.5, 3.6, 2.2, 2.3_

## Phase 3 — Remaining interventions

- [ ] 11. Fan intervention (comfort offset + fan electricity, not air-temp drop)
  - _Requirements: 3.4_

- [ ] 12. Ventilation (ACH) control and occupancy-responsive AC
  - ACH slider; occupancy-AC reduces effective runtime by occupied fraction.
  - _Requirements: 3.3, 3.7_

- [ ] 13. Lighting interventions and envelope interventions
  - Daylight- and occupancy-responsive lighting (reduce lighting electricity + internal
    heat); reflective roof (lower absorptance); improved insulation (lower U-values).
  - _Requirements: 3.8, 3.9, 3.10_

- [ ] 14. Intervention toggle panel + ≥8 controls verified
  - `InterventionToggles.tsx` grouping all interventions.
  - _Requirements: 3.1, 11.1, 16.1_

## Phase 4 — Comfort, provenance, breakdown, charts, methodology

- [ ] 15. Comfort model and status badge
  - `comfortModel.ts` using perceived temp (+ RH if available) and configurable thresholds;
    color/status badge in UI.
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 16. Impact-breakdown panel
  - `ImpactBreakdown.tsx` showing per-mechanism %/kWh changes.
  - _Requirements: 7.3_

- [ ] 17. Data provenance and assumptions view
  - `/src/data/provenance.ts` (source class + optional confidence per parameter);
    `ProvenancePanel.tsx` / Data & Assumptions view.
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 18. Scenario presets and preset selector
  - `scenarioPresets.ts` (Baseline / Operational optimisation / Low-cost retrofit /
    Envelope retrofit / Combined) + `PresetSelector.tsx`.
  - _Requirements: 8.1, 8.2_

- [ ] 19. Methodology panel and app disclaimers
  - `MethodologyPanel.tsx` with equations + limitations; proof-of-concept and
    "representative NTU space" framing in the shell; no "digital twin of Gaia".
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 20. Humidity handling (feature-flagged)
  - Always display outdoor RH; implement credible indoor-RH model OR omit indoor RH and
    state latent modelling is future work. Never fabricate RH.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 21. Edge-case hardening and tests
  - Input clamping/validation; tests for 0 occupants, 0 window, 0 solar, T_out ≤ setpoint,
    very high ventilation, AC off, very small/large room, extreme humidity; full
    monotonicity suite incl. shading/low-E/insulation/fan/daylight/occupancy-AC; demo
    regression test (model-driven, not hardcoded).
  - _Requirements: 13.1, 13.2, 13.3, 14.1, 14.2, 14.3, 16.2_

- [ ] 22. Polished example scenario and README
  - Wire the §44 demo (setpoint 25 °C, fan, shading, occupancy-AC, daylight lighting) so all
    numbers come from the model; write README with assumptions, limitations, and the §53
    disclaimer.
  - _Requirements: 11.5, 16.1, 10.3, 16.2_

## Phase 5 — Optional (non-blocking; do not start before Phase 1–4)

- [ ] 23. Weather CSV (Dataset mode) and hourly simulation with time-series charts
  - _Requirements: 12.2, 12.3, 12.4_

- [ ] 24. Optimisation mode (brute-force min energy subject to acceptable comfort)
  - _Requirements: 15.1_

- [ ] 25. Economic layer and sustainability-dimension framing
  - Illustrative capital cost / annual saving / simple payback; environmental/economic/
    social summary.
  - _Requirements: 15.2, 15.3, 7.4_
