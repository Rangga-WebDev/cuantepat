import type { Analysis } from "../../lib/math/hppEngine";
import { formatPercent, formatRupiah as rp } from "../../lib/utils";

const badges = {
  healthy: ["Sehat", "bg-healthy-bg text-healthy border-healthy-border"],
  warning: ["Waspada", "bg-warning-bg text-warning border-warning-border"],
  danger: ["Rawan boncos", "bg-danger-bg text-danger border-danger-border"],
};
export default function ResultSummaryCard({ result, name }: { result: Analysis; name: string }) {
  return <aside id="ringkasan" aria-labelledby="summary-title" className="card min-w-0 scroll-mt-4 self-start lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
    <p className="eyebrow">02 / Hasil per porsi</p><h2 id="summary-title">Ringkasan harga</h2>
    <p className="hint mt-1 break-words">{name || "Resep tanpa nama"} · Penjualan langsung</p>
    {"error" in result ? <p className="alert mt-4" role="status">{result.error}</p> : (() => {
      const { costs, suggested, price, sale } = result.value;
      const parts = [["Bahan", costs.ingredients, "bg-primary"], ["Kemasan", costs.packaging, "bg-accent"], ["Operasional & upah", costs.overhead, "bg-muted"]] as const;
      const [badge, color] = badges[sale.health];
      return <>
        <div className="my-5 rounded-xl bg-healthy-bg px-4 py-5 text-healthy">
          <p className="text-sm font-semibold">HPP per porsi</p><p className="amount">{rp(costs.perPortion)}</p>
        </div>
        <p className="hint">Saran harga jual</p><p className="amount">{rp(suggested)}</p>
        <dl className="my-4 space-y-2 border-y border-border py-4">
          <div className="metric"><dt>Harga yang dipakai</dt><dd>{rp(price)}</dd></div>
          <div className="metric"><dt>Estimasi laba bersih</dt><dd>{rp(sale.profit)}</dd></div>
          <div className="metric"><dt>Margin</dt><dd className={`rounded-full border px-2 py-1 text-xs ${color}`}>{badge} · {formatPercent(sale.marginPercent)}</dd></div>
        </dl>
        {sale.profit < 0 && <p className="alert mb-3">Awas boncos! Rugi {rp(-sale.profit)} per porsi.</p>}
        <h3>Komposisi modal</h3><p className="hint">Satu resep · {costs.portions} porsi</p>
        <div aria-hidden="true" className="my-3 flex h-2 overflow-hidden rounded-full bg-border">
          {parts.map(([label, amount, fill]) => <span key={label} className={fill} style={{ flex: amount }} />)}
        </div>
        <dl className="space-y-1">{parts.map(([label, amount]) => <div className="metric" key={label}><dt>{label}</dt><dd>{rp(amount)}</dd></div>)}</dl>
      </>;
    })()}
  </aside>;
}
