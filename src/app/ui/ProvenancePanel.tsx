/**
 * ProvenancePanel.tsx — Data & Assumptions view (Requirement 9).
 *
 * Lists every parameter with its current value and full provenance record, answering both
 * "what kind of source?" and "where exactly did it come from?".
 */

import { PARAMETER_PROVENANCE, type Provenance } from '../../data/provenance';
import { GLAZING_PRESETS, ROOF_PRESETS } from '../../data/materials';
import type { Scenario } from '../../model/types';

function valueFor(path: string, scenario: Scenario): string {
  const [group, key] = path.split('.');
  if (group === 'constants') return '(model constant)';
  const section = (scenario as unknown as Record<string, Record<string, unknown>>)[group];
  const v = section?.[key];
  return v === undefined ? '—' : String(v);
}

function SourceTag({ p }: { p: Provenance }) {
  return (
    <span className={`source-tag source-${p.sourceClass}`}>
      {p.sourceClass.replace(/_/g, ' ')} · {p.confidence}
    </span>
  );
}

export function ProvenancePanel({ scenario }: { scenario: Scenario }) {
  return (
    <div className="provenance">
      <p className="disclaimer">
        Values are illustrative engineering references or transparent assumptions unless
        otherwise noted. This prototype does not use unpublished NTU-specific engineering
        parameters.
      </p>

      <h3>Parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Source</th>
            <th>Where / note</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(PARAMETER_PROVENANCE).map(([path, p]) => (
            <tr key={path}>
              <td>{path}</td>
              <td className="num">{valueFor(path, scenario)}</td>
              <td>
                <SourceTag p={p} />
              </td>
              <td>
                {p.sourceTitle}
                {p.sourceUrl && (
                  <>
                    {' '}
                    <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                      link
                    </a>
                  </>
                )}
                {p.accessedDate ? ` (accessed ${p.accessedDate})` : ''}
                {p.note ? ` — ${p.note}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Material presets</h3>
      <table>
        <thead>
          <tr>
            <th>Preset</th>
            <th>Values</th>
            <th>Source</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GLAZING_PRESETS).map((g) => (
            <tr key={g.label}>
              <td>{g.label}</td>
              <td className="num">
                U {g.u_value}, SHGC {g.shgc}
              </td>
              <td>
                <SourceTag p={g.provenance} />
              </td>
              <td>{g.provenance.note}</td>
            </tr>
          ))}
          {Object.values(ROOF_PRESETS).map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="num">
                U {r.u_value}, α {r.absorptance}
              </td>
              <td>
                <SourceTag p={r.provenance} />
              </td>
              <td>{r.provenance.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
