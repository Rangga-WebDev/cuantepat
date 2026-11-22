const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
export const formatRupiah = (value: number) => rupiah.format(value);
export const formatPercent = (value: number | null) => value === null ? "—" : `${decimal.format(value)}%`;
