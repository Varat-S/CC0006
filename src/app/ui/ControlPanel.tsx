/**
 * ControlPanel.tsx — left sidebar grouped into Building / Environment / Operation /
 * Interventions (Requirements 2, 3, 11.1).
 */

import { Slider, Toggle, Select } from './controls';
import type { ScenarioStore } from '../state/useScenario';
import type { Orientation, ShadingLevel } from '../../model/types';

export function ControlPanel({ store }: { store: ScenarioStore }) {
  const { scenario, dispatch } = store;
  const { room, environment, operation, interventions } = scenario;

  return (
    <aside className="control-panel">
      <section>
        <h3>Building</h3>
        <Slider
          label="Floor area"
          tooltip="Conditioned floor area of the single zone."
          value={room.floor_area_m2}
          min={10}
          max={500}
          step={5}
          unit="m²"
          onChange={(v) => dispatch({ type: 'updateRoom', patch: { floor_area_m2: v } })}
        />
        <Slider
          label="Ceiling height"
          tooltip="Room height; volume = floor area × ceiling height."
          value={room.ceiling_height_m}
          min={2}
          max={6}
          step={0.1}
          unit="m"
          onChange={(v) => dispatch({ type: 'updateRoom', patch: { ceiling_height_m: v } })}
        />
        <Slider
          label="Window area"
          tooltip="Glazed area facing outdoors."
          value={room.window_area_m2}
          min={0}
          max={120}
          step={1}
          unit="m²"
          onChange={(v) => dispatch({ type: 'updateRoom', patch: { window_area_m2: v } })}
        />
        <Select<Orientation>
          label="Orientation"
          tooltip="Façade orientation. West/east get higher afternoon/morning solar factors."
          value={room.orientation}
          options={[
            { value: 'north', label: 'North (lower sun)' },
            { value: 'south', label: 'South (moderate)' },
            { value: 'east', label: 'East (high morning)' },
            { value: 'west', label: 'West (high afternoon)' },
          ]}
          onChange={(v) => dispatch({ type: 'updateRoom', patch: { orientation: v } })}
        />
      </section>

      <section>
        <h3>Environment</h3>
        <Slider
          label="Outdoor temperature"
          tooltip="Representative outdoor air temperature (illustrative; not a live feed)."
          value={environment.outdoor_temp_c}
          min={20}
          max={40}
          step={0.5}
          unit="°C"
          onChange={(v) => dispatch({ type: 'updateEnvironment', patch: { outdoor_temp_c: v } })}
        />
        <Slider
          label="Outdoor RH"
          tooltip="Outdoor relative humidity. Displayed; indoor RH is not predicted in this MVP."
          value={environment.outdoor_rh_pct}
          min={30}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => dispatch({ type: 'updateEnvironment', patch: { outdoor_rh_pct: v } })}
        />
        <Slider
          label="Solar irradiance"
          tooltip="Incident solar irradiance driving glazing solar gain and roof sol-air."
          value={environment.solar_irradiance_w_m2}
          min={0}
          max={1000}
          step={25}
          unit="W/m²"
          onChange={(v) => dispatch({ type: 'updateEnvironment', patch: { solar_irradiance_w_m2: v } })}
        />
      </section>

      <section>
        <h3>Operation</h3>
        <Slider
          label="Occupancy"
          tooltip="Number of occupants; each adds sensible heat."
          value={operation.occupancy}
          min={0}
          max={100}
          step={1}
          unit="people"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { occupancy: v } })}
        />
        <Slider
          label="AC setpoint"
          tooltip="Target indoor temperature. Higher setpoint lowers cooling load."
          value={operation.ac_setpoint_c}
          min={18}
          max={28}
          step={0.5}
          unit="°C"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { ac_setpoint_c: v } })}
        />
        <Slider
          label="AC hours/day"
          tooltip="HVAC operating hours per day."
          value={operation.ac_hours_per_day}
          min={0}
          max={24}
          step={1}
          unit="h"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { ac_hours_per_day: v } })}
        />
        <Slider
          label="Lighting hours/day"
          tooltip="Lighting operating hours — INDEPENDENT of HVAC hours."
          value={operation.lighting_hours_per_day}
          min={0}
          max={24}
          step={1}
          unit="h"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { lighting_hours_per_day: v } })}
        />
        <Slider
          label="Ventilation"
          tooltip="Air changes per hour. In hot-humid conditions MORE ventilation can INCREASE cooling load."
          value={operation.ventilation_ach}
          min={0}
          max={6}
          step={0.5}
          unit="ACH"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { ventilation_ach: v } })}
        />
        <Slider
          label="Lighting load (LPD)"
          tooltip="Lighting power density in W/m²."
          value={operation.lighting_w_m2}
          min={0}
          max={20}
          step={0.5}
          unit="W/m²"
          onChange={(v) => dispatch({ type: 'updateOperation', patch: { lighting_w_m2: v } })}
        />
        <details className="advanced">
          <summary>Advanced assumptions</summary>
          <Slider
            label="HVAC COP"
            tooltip="Coefficient of performance. Electricity = cooling load / COP."
            value={operation.hvac_cop}
            min={2}
            max={6}
            step={0.1}
            onChange={(v) => dispatch({ type: 'updateOperation', patch: { hvac_cop: v } })}
          />
          <Slider
            label="HVAC capacity"
            tooltip="Finite cooling capacity. Above this, indoor temp rises above setpoint."
            value={operation.hvac_capacity_kw}
            min={1}
            max={60}
            step={1}
            unit="kW"
            onChange={(v) => dispatch({ type: 'updateOperation', patch: { hvac_capacity_kw: v } })}
          />
          <Slider
            label="Occupied fraction"
            tooltip="Fraction of the operating day the space is occupied (for occupancy-responsive AC)."
            value={operation.occupied_fraction}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => dispatch({ type: 'updateOperation', patch: { occupied_fraction: v } })}
          />
          <Slider
            label="Plug load (EPD)"
            tooltip="Equipment power density in W/m²."
            value={operation.plug_load_w_m2}
            min={0}
            max={20}
            step={0.5}
            unit="W/m²"
            onChange={(v) => dispatch({ type: 'updateOperation', patch: { plug_load_w_m2: v } })}
          />
          <Toggle
            label="AC on"
            tooltip="Turn the HVAC off to see indoor temperature drift toward outdoor."
            checked={operation.ac_on}
            onChange={(v) => dispatch({ type: 'updateOperation', patch: { ac_on: v } })}
          />
        </details>
      </section>

      <section>
        <h3>Interventions</h3>
        <Toggle
          label="Ceiling fan"
          tooltip="Adds fan electricity and improves the comfort proxy. Does NOT lower air temperature."
          checked={interventions.fan_enabled}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { fan_enabled: v } })}
        />
        <Select<ShadingLevel>
          label="External shading"
          tooltip="Reduces glazing solar gain."
          value={interventions.external_shading}
          options={[
            { value: 'none', label: 'None' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'high', label: 'High-performance' },
          ]}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { external_shading: v } })}
        />
        <Toggle
          label="Occupancy-responsive AC"
          tooltip="Reduces effective HVAC runtime by the occupied fraction."
          checked={interventions.occupancy_ac_control}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { occupancy_ac_control: v } })}
        />
        <Toggle
          label="Low-E / improved glazing"
          tooltip="Lower U-value and SHGC — reduces conductive and solar load."
          checked={interventions.low_e_glazing}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { low_e_glazing: v } })}
        />
        <Toggle
          label="Daylight-responsive lighting"
          tooltip="Reduces effective lighting POWER (LPD) — less lighting electricity and heat."
          checked={interventions.daylight_lighting_control}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { daylight_lighting_control: v } })}
        />
        <Toggle
          label="Occupancy-responsive lighting"
          tooltip="Reduces effective lighting HOURS — less lighting electricity."
          checked={interventions.occupancy_lighting_control}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { occupancy_lighting_control: v } })}
        />
        <Toggle
          label="Reflective roof"
          tooltip="Lower solar absorptance lowers the roof sol-air temperature and roof heat gain."
          checked={interventions.reflective_roof}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { reflective_roof: v } })}
        />
        <Toggle
          label="Improved insulation"
          tooltip="Lower wall/roof U-values — reduces envelope conductive load."
          checked={interventions.improved_insulation}
          onChange={(v) => dispatch({ type: 'updateInterventions', patch: { improved_insulation: v } })}
        />
      </section>
    </aside>
  );
}
