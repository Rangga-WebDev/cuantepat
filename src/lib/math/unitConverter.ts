const units = {
  g: ["massa", 1], kg: ["massa", 1000],
  ml: ["volume", 1], l: ["volume", 1000], sdt: ["volume", 5], sdm: ["volume", 15],
  pcs: ["jumlah", 1], lusin: ["jumlah", 12], karton: ["jumlah", null],
} as const;

export type Unit = keyof typeof units;
export const compatible = (from: Unit, to: Unit) => units[from][0] === units[to][0];
export type Calculation<T> = { value: T } | { value: 0; error: string };
export const invalid = (error: string) => ({ value: 0, error } as const);

export function finiteValue(value: number): Calculation<number> {
  return Number.isFinite(value) ? { value } : invalid("Hasil di luar jangkauan angka.");
}

export function convertUnit(qty: number, from: Unit, to: Unit, piecesPerCarton = 0): Calculation<number> {
  if (!Number.isFinite(qty) || qty < 0) return invalid("Jumlah harus berupa angka nol atau lebih.");
  if (!Object.hasOwn(units, from) || !Object.hasOwn(units, to)) return invalid("Satuan belum dikenal.");
  const [family, source] = units[from];
  const [targetFamily, target] = units[to];
  if (family !== targetFamily) return invalid(`Satuan ${from} tidak bisa diubah ke ${to}.`);
  if (from === to) return { value: qty };
  if ((source === null || target === null) && (!Number.isSafeInteger(piecesPerCarton) || piecesPerCarton <= 0)) {
    return invalid("Isi dulu jumlah pcs per karton sesuai kemasan.");
  }
  return finiteValue(qty * ((source ?? piecesPerCarton) / (target ?? piecesPerCarton)));
}
