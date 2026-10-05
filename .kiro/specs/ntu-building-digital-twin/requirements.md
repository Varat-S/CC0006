# Requirements — NTU Sustainable Building Digital-Twin Prototype

## Introduction

This document specifies the requirements for a proof-of-concept, digital-twin–style
decision-support tool for sustainable building operations, demonstrated using a
representative NTU campus space.

The system lets a user define a baseline indoor space, adjust operational and building
parameters, toggle sustainability interventions, and observe the predicted impact on
indoor temperature, thermal comfort, and electricity consumption — always **compared
against a baseline**.

The purpose is **comparative scenario analysis** ("what changes, and why?"), not
engineering-grade absolute prediction. The prototype must never claim to be a calibrated
digital twin of a specific NTU building (e.g. Gaia or The Hive); public data are
insufficient for that.

### Guiding principles
- **Transparency over black-box precision.** Expose the logic so a user can see *why* a
  scenario improves or worsens.
- **Comparative correctness** matters more than false numerical precision.
- **Clear assumptions.** Every parameter is tagged with a data-provenance source class.
- **Simple, deterministic physics.** Quasi-steady-state single-zone heat balance.
- **Good, uncomplicated UX.**

### Non-goals (explicitly out of scope)
CFD; detailed airflow-field simulation; whole-building BIM; room-by-room campus
simulation; ML training on NTU historical sensor data; NTU BMS / IoT integration;
detailed chiller-plant simulation; whole-building energy certification; any claim of
calibrated absolute accuracy.

---

## Requirement 1 — Baseline room definition

**User story:** As a user, I want to define and view a baseline single-zone room with
explicit, inspectable parameters, so that every scenario has a clear reference point.

#### Acceptance criteria
1. WHEN the app loads THEN the system SHALL present a default illustrative baseline
   scenario (≈100 m², 3 m ceiling, 30 occupants, 25 m² glazing, west-facing, 31 °C
   outdoor, 75 % RH, 500 W/m² solar, 23 °C setpoint, 1 ACH, 12 h/day).
2. THE system SHALL label the baseline prominently as "Illustrative representative room.
   Not measured NTU operational data."
3. THE system SHALL model exactly one single-zone room at a time.
4. THE system SHALL store the full scenario as a structured, explicit, inspectable object
   with `room`, `environment`, `operation`, and `interventions` sections.
5. WHEN the user clicks "Reset to baseline" THEN the system SHALL restore every parameter
   and intervention to the default baseline.
6. WHERE a required geometric value (e.g. wall area) is not directly provided THE system
   SHALL infer it from floor area and ceiling height and SHALL document the approximation.

## Requirement 2 — Adjustable environmental, room, and operational parameters

**User story:** As a user, I want to control environmental, building, and operational
inputs, so that I can explore how conditions and configuration affect the result.

#### Acceptance criteria
1. THE system SHALL expose environment controls: outdoor temperature, outdoor RH, solar
   irradiance, and (optional) a ventilation/wind driving condition.
2. THE system SHALL expose room controls: floor area, ceiling height (volume derived),
   glazing area or window-to-wall ratio, orientation, baseline glazing type, roof/façade
   properties, and insulation level.
3. THE system SHALL expose operational controls: occupancy, AC setpoint, HVAC operating
   hours/schedule, ventilation rate (ACH), lighting load, and (optional) plug load.
4. WHEN any input changes THEN the system SHALL recalculate the scenario deterministically
   and update all outputs.
5. THE system SHALL use continuous controls (sliders) for continuous variables, dropdowns
   for material presets, and SHALL provide tooltips explaining each variable.

## Requirement 3 — Sustainability interventions

**User story:** As a user, I want to toggle retrofit and operating-strategy interventions,
so that I can compare their impact on comfort and energy.

#### Acceptance criteria
1. THE system SHALL implement at least the following interventions (minimum 8 controls):
   AC setpoint adjustment; occupancy-responsive AC on/off; ceiling/ventilating fan;
   external shading; low-E / improved glazing; increased/decreased ventilation;
   daylight-responsive lighting; occupancy-responsive lighting; reflective roof/façade;
   improved insulation.
2. WHEN the AC setpoint is raised THEN the system SHALL show a logically reduced cooling
   load/energy.
3. WHEN occupancy-responsive AC is enabled THEN the system SHALL reduce effective HVAC
   runtime by an occupied-fraction factor (runtime unchanged when occupied fraction = 1).
4. WHEN a fan is enabled THEN the system SHALL (a) add fan electrical consumption and
   (b) improve the comfort proxy via a labelled perceived-temperature offset, WITHOUT
   significantly lowering modelled room air temperature.
5. WHEN external shading is enabled THEN the system SHALL reduce solar heat gain via a
   shading factor (selectable None / Moderate / High-performance).
6. WHEN low-E / improved glazing is selected THEN the system SHALL reduce glazing U-value
   and SHGC per documented presets, reducing conductive and solar load.
7. WHEN ventilation (ACH) increases in hot-humid outdoor conditions THEN the system SHALL
   be able to show an *increase* in cooling load (i.e. "more ventilation ≠ always better").
8. WHEN daylight-responsive and/or occupancy-responsive lighting is enabled THEN the
   system SHALL reduce lighting electricity and the associated internal heat gain.
9. WHEN reflective roof/façade is enabled THEN the system SHALL reduce absorbed solar heat
   via a lower solar absorptance.
10. WHEN improved insulation is selected THEN the system SHALL reduce envelope U-values and
    envelope conductive load.
11. THE system MAY implement optional interventions if time permits: pre-cooling schedule,
    variable-speed HVAC, smart blinds, plug-load shutdown, simple PV offset. These SHALL
    NOT block the MVP.

## Requirement 4 — Simplified physics model

**User story:** As a user, I want results produced by a transparent physics model, so that
I can trust the comparison and understand the mechanism.

#### Acceptance criteria
1. THE system SHALL use a quasi-steady-state single-zone sensible heat-balance:
   `Q_total = Q_envelope + Q_solar + Q_occupancy + Q_lighting + Q_plug + Q_ventilation`.
2. THE system SHALL compute envelope conductive load as `Q = U·A·ΔT` with `ΔT = T_out − T_in`
   for walls, roof, and glazing conduction.
3. THE system SHALL compute solar gain as
   `Q_solar = A_glass · SHGC · I_solar · F_orientation · F_shade`, with a simplified
   orientation factor (N lower, S moderate, E high-morning, W high-afternoon).
4. THE system SHALL compute occupant sensible load as `N · q_person` using a configurable
   per-person sensible value (and latent value if humidity is modelled).
5. THE system SHALL compute lighting heat as `A_floor · LPD` (reducible by lighting
   interventions) and plug load as `A_floor · EPD` (optional/advanced).
6. THE system SHALL compute ventilation load as `Q_vent = ṁ · c_p · ΔT`, deriving airflow
   from `V̇ = ACH · V_room / 3600` and `ṁ = ρ · V̇`, using standard air constants.
7. THE system SHALL compute HVAC electrical power as `P = Q_cooling / COP` and daily HVAC
   energy as `E_HVAC = P · effective_runtime_hours`, with COP editable (default 3.0–4.0).
8. THE model SHALL be deterministic and reproducible: identical inputs always produce
   identical outputs; no randomness.
9. THE system SHALL NOT hardcode physical constants throughout the code; all constants
   SHALL live in a single assumptions/config file.

## Requirement 5 — Relative humidity (feasibility-gated)

**User story:** As a user, I want humidity context, so that comfort reflects Singapore's
hot-humid climate — without fabricated precision.

#### Acceptance criteria
1. THE system SHALL always display outdoor RH.
2. IF a credible simplified indoor humidity model is implemented THEN it SHALL account for
   outdoor RH, ventilation, occupant latent load, and an HVAC moisture-removal assumption,
   and SHALL feed into comfort.
3. IF a credible indoor humidity model cannot be implemented in the initial version THEN
   the system SHALL omit predicted indoor RH and SHALL state that full latent-load
   modelling is future work.
4. THE system SHALL NOT generate fake precise indoor RH values.

## Requirement 6 — Thermal comfort assessment

**User story:** As a user, I want a clear comfort status, so that I can avoid saving energy
by violating comfort.

#### Acceptance criteria
1. THE system SHALL report a simple comfort status: Comfortable / Borderline / Outside
   target.
2. THE comfort assessment SHALL use predicted indoor air temperature, RH if available, and
   the fan perceived-temperature offset if the fan is enabled.
3. THE comfort thresholds SHALL be configurable in a settings file and SHALL reference
   Singapore / BCA guidance values (not presented as statutory regulation unless confirmed).
4. THE system SHALL NOT claim full PMV/PPD unless it is properly implemented.
5. THE system SHALL display a color/status badge for comfort.

## Requirement 7 — Outputs, comparison, and impact breakdown

**User story:** As a user, I want outputs shown against the baseline with a causal
breakdown, so that I understand what changed and why.

#### Acceptance criteria
1. THE results panel SHALL display: predicted indoor temperature, comfort status, HVAC
   kWh/day, lighting kWh/day, total kWh/day, and % change vs baseline.
2. THE system SHALL always present a baseline-vs-scenario comparison (metric, baseline,
   scenario, delta) as a central UI component, using simple bars or side-by-side values.
3. THE system SHALL present an impact breakdown showing the mechanism (e.g. solar gain,
   envelope load, occupancy load, ventilation load, lighting heat, HVAC runtime, fan
   electricity) as percentage change and/or kWh/day contribution.
4. THE system MAY optionally display predicted RH, a CO₂ proxy, and carbon emissions.

## Requirement 8 — Scenario presets

**User story:** As a user, I want one-click presets, so that I can demo common strategies.

#### Acceptance criteria
1. THE system SHALL provide presets: Baseline (no interventions); Operational optimisation
   (setpoint +1.5 °C, occupancy-responsive AC, occupancy-responsive lighting); Low-cost
   retrofit (fan, shading, daylight lighting); Envelope retrofit (low-E glazing, improved
   insulation, reflective roof); Combined scenario (a mix).
2. WHEN a preset is selected THEN the system SHALL apply its parameters and recalculate.

## Requirement 9 — Data provenance and assumptions

**User story:** As a user, I want to see where every parameter comes from, so that I
understand the model's limitations.

#### Acceptance criteria
1. THE system SHALL tag every parameter with a source class: PUBLIC NTU DATA, PUBLIC
   SINGAPORE DATA, ENGINEERING REFERENCE, MANUFACTURER SPECIFICATION, ASSUMPTION, USER
   INPUT.
2. THE system MAY additionally tag a confidence level (High / Medium / Low).
3. THE system SHALL provide a Data & Assumptions view that lists every parameter, its
   value, and its source class, always visible or one click away.
4. THE system SHALL store material presets (glazing, roof, etc.) in a clean data file and
   SHALL document values as illustrative unless sourced.
5. THE system SHALL NOT invent NTU-specific room dimensions, HVAC capacity, exact glazing
   properties, electricity use, indoor temperature records, or occupancy history. Where a
   specific NTU building is referenced, only publicly documented qualitative features SHALL
   be used.

## Requirement 10 — Methodology and disclaimers

**User story:** As a user, I want a clear methodology and disclaimer, so that I understand
this is a proof of concept.

#### Acceptance criteria
1. THE system SHALL include a Methodology section stating it is a simplified single-zone
   thermal and electricity model for comparative analysis, not a calibrated engineering
   simulation, and not for final building-design decisions.
2. THE Methodology SHALL present the core equations (envelope, solar, occupancy,
   ventilation, HVAC electricity) and the model's limitations.
3. THE README SHALL carry a prominent disclaimer to the same effect (per handoff §53).
4. THE app SHALL avoid "digital twin of Gaia"; it SHALL use framing such as "Simplified
   digital-twin framework demonstrated using a representative NTU building space."

## Requirement 11 — User interface and workflow

**User story:** As a user, I want a clear simulator UI, so that I can run a full comparison
within ~30 seconds.

#### Acceptance criteria
1. THE UI SHALL provide a control panel/sidebar grouped into Building, Environment,
   Operation, and Interventions sections.
2. THE UI SHALL provide a results area with top cards (predicted temperature, comfort, HVAC
   kWh/day, total kWh/day, energy delta %), a baseline-vs-scenario comparison, an impact
   breakdown, and access to assumptions/provenance.
3. THE UI MAY organise content into tabs: Simulator, Compare, Data & Assumptions,
   Methodology.
4. THE UI SHALL provide reset-to-baseline, and MAY provide save-scenario if easy.
5. WHEN a user opens the app THEN within ~30 seconds they SHALL be able to raise the
   setpoint, enable fan, enable shading, enable occupancy-responsive AC, and enable
   daylight-responsive lighting, and immediately see temperature, comfort, HVAC energy,
   lighting energy, total energy, % change vs baseline, and the impact breakdown.

## Requirement 12 — Weather input modes

**User story:** As a user, I want to supply conditions manually or from a dataset, so that
I can run either a quick comparison or an hourly simulation.

#### Acceptance criteria
1. THE system SHALL default to Manual mode (user specifies outdoor temperature, RH, solar
   irradiance) as the primary, easiest demo path.
2. THE system MAY support Dataset mode: load hourly CSV with fields timestamp,
   temperature_c, relative_humidity_pct, solar_irradiance_w_m2, wind_speed_m_s.
3. WHERE hourly mode is implemented THE system SHALL, per timestep, load weather/occupancy/
   schedule, compute heat gains, cooling demand, and electrical demand, store results, and
   plot indoor vs outdoor temperature, HVAC energy, and occupancy over time.
4. THE MVP SHALL be fully functional in Manual mode without hourly simulation.

## Requirement 13 — Robustness and edge cases

**User story:** As a user, I want the tool to behave sensibly at extremes, so that I never
see broken numbers.

#### Acceptance criteria
1. THE system SHALL handle: 0 occupants, 0 window area, 0 solar irradiance, outdoor temp
   below indoor setpoint, very high ventilation, AC off, very small room, very large room,
   and extreme humidity.
2. WHEN outdoor temperature is at or below the setpoint THEN the system SHALL NOT produce
   negative cooling electricity (cooling load floored at 0).
3. THE system SHALL NEVER return NaN, Infinity, or negative electricity.

## Requirement 14 — Testing and validation

**User story:** As a developer, I want sanity and unit tests, so that model behaviour stays
physically plausible.

#### Acceptance criteria
1. THE system SHALL include monotonicity/direction tests: higher outdoor temp → more
   cooling; higher occupancy → more heat load; higher setpoint → less cooling; shading →
   less solar gain; low-E glazing → less glazing gain; more insulation → less envelope
   load; fan → more fan electricity + better comfort proxy but not a large air-temp drop;
   daylight lighting → less lighting electricity and internal heat; occupancy AC → less
   runtime when occupied fraction < 1.
2. THE system SHALL include unit tests for: solar load, envelope load, occupancy load,
   ventilation load, HVAC power conversion, scenario delta, fan comfort adjustment,
   lighting intervention, and occupancy runtime reduction.
3. THE tests SHALL assert no intervention yields physically nonsensical negative loads.

## Requirement 15 — Optional enhancements (non-blocking)

**User story:** As a user, I want optional extras if time permits, without delaying the MVP.

#### Acceptance criteria
1. THE system MAY provide an optimisation mode: brute-force search over the small option
   space to minimise energy subject to acceptable comfort, outputting the recommended
   configuration, estimated energy reduction, and comfort result.
2. THE system MAY provide an economic layer (capital cost, annual saving, simple payback),
   all labelled illustrative unless sourced.
3. THE system MAY surface the three sustainability dimensions: environmental (electricity /
   optional CO₂ reduction), economic (optional cost/payback), social (comfort / humidity /
   ventilation status).
4. These SHALL NOT be part of the MVP and SHALL NOT block delivery.

## Requirement 16 — Deliverables and acceptance

**User story:** As a stakeholder, I want a defined set of deliverables, so that completion
is unambiguous.

#### Acceptance criteria
1. THE prototype SHALL deliver: (1) interactive simulator; (2) baseline-vs-scenario
   comparison; (3) ≥8 intervention controls; (4) simplified thermal model; (5) electricity
   calculation; (6) comfort assessment; (7) impact breakdown; (8) data provenance /
   assumptions panel; (9) one polished example scenario driven by the model (no hardcoded
   result numbers); (10) basic tests; (11) README explaining assumptions and limitations.
2. THE prototype SHALL be considered successful only if it meets the acceptance checklist
   in handoff §51 (logical responses to setpoint/occupancy/shading/glazing/fan/occupancy-AC/
   daylight-lighting changes; baseline comparison; visible assumptions; proof-of-concept
   statement; no unsupported NTU claims; deterministic/reproducible).
