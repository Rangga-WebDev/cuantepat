type NumericProps = {
  label: string; unit: string; value: number | null; change: (value: number) => void;
  clear?: () => void; placeholder?: string; integer?: boolean; min?: number; max?: number;
};
export function Numeric({ label, unit, value, change, clear, placeholder, integer, min = 0, max }: NumericProps) {
  return <label className="field">{label}
    <span className="number-box">
      {unit === "Rp" && <span>Rp</span>}
      <input type="number" aria-label={label} inputMode={integer ? "numeric" : "decimal"} step={integer ? 1 : "any"}
        min={min} max={max} value={value === 0 && !clear ? "" : value ?? ""} placeholder={placeholder ?? "0"}
        onFocus={e => e.currentTarget.select()} onChange={e => {
          const input = e.currentTarget;
          if (input.value === "") { if (clear) clear(); else change(0); }
          else if (Number.isFinite(input.valueAsNumber)) change(input.valueAsNumber);
        }} />
      {unit !== "Rp" && <span>{unit}</span>}
    </span>
  </label>;
}
export function Choice<T extends string>({ label, value, options, change }: {
  label: string; value: T; options: readonly T[]; change: (v: T) => void;
}) {
  return <label className="field">{label}
    <select className="control" value={value} onChange={e => change(options[e.currentTarget.selectedIndex])}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </label>;
}
