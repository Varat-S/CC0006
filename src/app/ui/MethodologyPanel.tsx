/**
 * MethodologyPanel.tsx — equations, assumptions, and limitations (Requirement 10).
 */

export function MethodologyPanel() {
  return (
    <div className="methodology">
      <div className="disclaimer strong">
        This is a <strong>simplified single-zone thermal and electricity model for
        comparative scenario analysis</strong>. It is a proof of concept — not a calibrated
        digital twin, certified building-energy model, or a substitute for detailed
        engineering simulation. It is demonstrated using a <em>representative</em> NTU
        building space and does not claim to reproduce any specific building (e.g. Gaia or
        The Hive). NTU-specific operational parameters that are not publicly available are
        represented using transparent assumptions or user-defined values.
      </div>

      <h3>Core equations</h3>
      <ul className="equations">
        <li>
          <strong>Envelope conduction</strong> (walls + windows): Q = U·A·(T_out − T_in)
        </li>
        <li>
          <strong>Roof (sol-air)</strong>: T_sol-air = T_out + (α·I)/h_o; Q_roof =
          U_roof·A_roof·(T_sol-air − T_in). A reflective roof lowers α.
        </li>
        <li>
          <strong>Glazing solar gain</strong>: Q = A_glass·SHGC·I·F_orientation·F_shade
        </li>
        <li>
          <strong>Occupancy</strong>: Q = N·q_person (sensible)
        </li>
        <li>
          <strong>Lighting heat</strong>: Q = LPD·A_floor (effective LPD after daylight
          control)
        </li>
        <li>
          <strong>Ventilation</strong>: Q = ṁ·c_p·(T_out − T_in), ṁ = ρ·ACH·V/3600
        </li>
        <li>
          <strong>HVAC electricity</strong>: P = Q_cooling / COP; E = P · effective runtime
        </li>
        <li>
          <strong>Lighting electricity</strong>: E = effective LPD · A_floor · lighting
          hours (independent of HVAC hours)
        </li>
      </ul>

      <h3>Indoor temperature &amp; finite capacity</h3>
      <p>
        HVAC capacity is finite. If the load needed to hold the setpoint is within capacity,
        indoor temperature stays at the setpoint. If it exceeds capacity, we solve for the
        equilibrium indoor temperature where heat gains equal the maximum cooling the HVAC
        can deliver. Gain-reducing retrofits can therefore lower the equilibrium temperature
        in capacity-limited cases.
      </p>

      <h3>Hourly mode</h3>
      <p>
        The Hourly tab performs <strong>hourly quasi-steady-state scenario analysis</strong>:
        24 independent operating snapshots driven by hourly weather and a representative
        occupancy schedule. Indoor temperature is not carried forward between hours, so it is
        a sequence of steady-state snapshots rather than a transient thermal simulation.
      </p>

      <h3>Key limitations</h3>
      <ul>
        <li>Quasi-steady-state, single representative operating point per snapshot (no transient dynamics; hourly mode is 24 independent snapshots, not a thermal-mass model).</li>
        <li>Simplified orientation factor rather than hourly solar geometry.</li>
        <li>Sensible-only by default; indoor relative humidity is not predicted (outdoor RH is shown). Full latent-load modelling is future work.</li>
        <li>The fan improves the comfort proxy only; it does not lower room air temperature.</li>
        <li>Material/equipment values are illustrative engineering references, not NTU measurements.</li>
      </ul>

      <h3>What this tool answers</h3>
      <p>
        &ldquo;What changes, and why?&rdquo; — comparative correctness and transparency,
        rather than the exact real-world energy use of a specific NTU room.
      </p>
    </div>
  );
}
