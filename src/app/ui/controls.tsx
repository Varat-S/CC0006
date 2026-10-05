/**
 * controls.tsx — small reusable UI primitives (slider, toggle, select) with tooltips.
 */

import type { ReactNode } from 'react';

interface LabelProps {
  label: string;
  tooltip?: string;
  children?: ReactNode;
}

function FieldLabel({ label, tooltip, children }: LabelProps) {
  return (
    <div className="field-label">
      <span>
        {label}
        {tooltip && (
          <span className="tooltip" title={tooltip} aria-label={tooltip}>
            {' '}ⓘ
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

interface SliderProps {
  label: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function Slider({ label, tooltip, value, min, max, step = 1, unit, onChange }: SliderProps) {
  return (
    <div className="control">
      <FieldLabel label={label} tooltip={tooltip}>
        <span className="value">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </FieldLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, tooltip, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {tooltip && (
          <span className="tooltip" title={tooltip} aria-label={tooltip}>
            {' '}ⓘ
          </span>
        )}
      </span>
    </label>
  );
}

interface SelectProps<T extends string> {
  label: string;
  tooltip?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Select<T extends string>({ label, tooltip, value, options, onChange }: SelectProps<T>) {
  return (
    <div className="control">
      <FieldLabel label={label} tooltip={tooltip} />
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
