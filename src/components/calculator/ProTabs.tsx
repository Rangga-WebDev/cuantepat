import { useState, type KeyboardEvent } from "react";
import { analyzeRecipe, breakEven, simulateSale } from "../../lib/math/hppEngine";
import { showcasePrice } from "../../lib/math/priceRounding";
import { formatPercent, formatRupiah as rp } from "../../lib/utils";
import { useCalculatorStore } from "../../store/useCalculatorStore";
import type { Recipe, Scenario } from "../../types/calculator";
import { Choice, Numeric } from "./Fields";

const tabs = ["Harga Ojol", "Cek Promo", "Target BEP", "Simulasi Naik Harga"] as const;

function Panels({ recipe }: { recipe: Recipe }) {
  const [tab, setTab] = useState(0), [copied, setCopied] = useState("");
  const { scenario: s, simulate, edit } = useCalculatorStore();
  const channel = recipe.channels.find(c => c.channel_name === s.channel);
  const actual = s.price ?? (s.channel === "Offline" ? recipe.custom_selling_price : null);
  const base = analyzeRecipe(recipe, channel, actual);
  function navigate(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const next = e.key === "ArrowLeft" ? (i + 3) % 4 : e.key === "ArrowRight" ? (i + 1) % 4
      : e.key === "Home" ? 0 : e.key === "End" ? 3 : -1;
    if (next < 0) return;
    e.preventDefault(); setTab(next);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
  }
  function output() {
    if (s.channel !== "Offline" && !channel) return <p className="alert">Kanal ini tidak ada di resep. Pilih kanal lain.</p>;
    if ("error" in base) return <p className="alert" role="status">{base.error}</p>;
    const { costs, price, suggested, sale } = base.value;
    if (tab === 0) return <>
      <div className="metric"><span>Saran untuk {s.channel}</span><strong>{rp(suggested)}</strong></div>
      <div className="metric"><span>Penerimaan setelah biaya</span><strong>{rp(sale.netReceipts)}</strong></div>
      <div className="metric"><span>Laba per porsi</span><strong>{rp(sale.profit)} · {formatPercent(sale.marginPercent)}</strong></div>
      {sale.profit < 0 && <p className="alert">Awas boncos! Rugi {rp(-sale.profit)} per porsi.</p>}
      <p className="hint">Pilihan harga etalase (akhiran 900): {rp(showcasePrice(suggested))}</p>
      <button className="secondary" onClick={async () => {
        try { await navigator.clipboard.writeText(String(price)); setCopied(`Harga ${rp(price)} tersalin.`); }
        catch { setCopied(`Tidak dapat menyalin otomatis. Harga: ${rp(price)}.`); }
      }}>Salin harga yang dipakai</button> <span role="status" className="hint">{copied}</span>
    </>;
    if (tab === 1) {
      const promo = simulateSale([{ price, hpp: costs.perPortion, quantity: s.quantity }], { kind: s.discount_kind, value: s.discount }, channel);
      return <>
        <div className="grid gap-3 sm:grid-cols-3">
          <Numeric label="Isi paket" value={s.quantity} unit="porsi" min={1} integer change={quantity => simulate({ quantity })} />
          <Choice label="Jenis diskon" options={["Persen", "Rupiah"]} value={s.discount_kind === "percent" ? "Persen" : "Rupiah"}
            change={v => simulate({ discount_kind: v === "Persen" ? "percent" : "amount", discount: 0 })} />
          <Numeric label="Diskon per pesanan" value={s.discount} unit={s.discount_kind === "percent" ? "%" : "Rp"} change={discount => simulate({ discount })} />
        </div>
        {"error" in promo ? <p className="alert">{promo.error}</p> : <div aria-live="polite" className="space-y-2">
          <div className="metric"><span>Dibayar pembeli</span><strong>{rp(promo.value.paid)}</strong></div>
          <div className="metric"><span>Laba per paket</span><strong>{rp(promo.value.profit)} · {formatPercent(promo.value.marginPercent)}</strong></div>
          <p className="hint">Batas diskon tanpa rugi: {promo.value.maxDiscount === null ? "Sudah rugi tanpa diskon" : rp(Math.floor(promo.value.maxDiscount))}.</p>
          {promo.value.profit < 0 && <p className="alert">Awas boncos! Rugi {rp(-promo.value.profit)} per pesanan.</p>}
        </div>}
      </>;
    }
    if (tab === 2) {
      const bep = breakEven(s.monthly_fixed_cost, s.days, sale.netReceipts, costs);
      return <>
        <div className="grid gap-3 sm:grid-cols-2">
          <Numeric label="Biaya tetap bulanan" value={s.monthly_fixed_cost} unit="Rp" change={monthly_fixed_cost => simulate({ monthly_fixed_cost })} />
          <Numeric label="Hari kerja per bulan" value={s.days} unit="hari" integer min={1} max={31} change={days => simulate({ days })} />
        </div>
        <p className="hint">Di luar promo. Biaya kanal berlaku untuk pesanan satu porsi.</p>
        <p className={"error" in bep || bep.value === null ? "alert" : "result-line"} aria-live="polite">
          {"error" in bep ? bep.error : bep.value === null ? "Belum bisa balik modal: laba per porsi nol atau negatif."
            : `${bep.value.daily} porsi per hari · ${bep.value.monthly} porsi per bulan`}
        </p>
      </>;
    }
    const raised = analyzeRecipe(recipe, channel, price, s.increase);
    return <>
      <label className="field">Kenaikan harga bahan: {s.increase}%
        <input type="range" min={0} max={50} value={s.increase} onChange={e => simulate({ increase: Number(e.target.value) })} />
      </label><p className="hint">Harga jual, kemasan, dan biaya operasional tidak berubah.</p>
      {"error" in raised ? <p className="alert">{raised.error}</p> : <div className="space-y-2" aria-live="polite">
        <div className="metric"><span>HPP baru per porsi</span><strong>{rp(raised.value.costs.perPortion)}</strong></div>
        <div className="metric"><span>Laba dan margin baru</span><strong>{rp(raised.value.sale.profit)} · {formatPercent(raised.value.sale.marginPercent)}</strong></div>
        {raised.value.sale.profit < 0 && <p className="alert">Awas boncos! Rugi {rp(-raised.value.sale.profit)} per porsi.</p>}
      </div>}
    </>;
  }
  return <>
    <div className="tab-strip" role="tablist" aria-label="Analisis Mode Pro">{tabs.map((label, i) =>
      <button key={label} role="tab" id={`tab-${i}`} aria-selected={tab === i} tabIndex={tab === i ? 0 : -1}
        aria-controls={`panel-${i}`} onKeyDown={e => navigate(e, i)} onClick={() => setTab(i)}>{label}</button>)}</div>
    <div className="my-4 grid gap-3 sm:grid-cols-2">
      <Choice<Scenario["channel"]> label="Kanal penjualan" value={s.channel} options={["Offline", ...recipe.channels.map(c => c.channel_name)]}
        change={v => { simulate({ channel: v, price: null }); setCopied(""); }} />
      <Numeric label="Harga jual untuk simulasi" unit="Rp" value={s.price} placeholder={"error" in base ? "Pakai saran" : rp(base.value.price)}
        clear={() => simulate({ price: null })} change={price => simulate({ price })} />
    </div>
    {tab === 0 && channel && <div className="mb-4 space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <Numeric label="Komisi kanal" unit="%" value={channel.commission_percent} max={99.99}
          change={commission_percent => edit({ channels: recipe.channels.map(c => c === channel ? { ...c, commission_percent } : c) })} />
        <Numeric label="Biaya layanan per pesanan" unit="Rp" value={channel.fixed_fee}
          change={fixed_fee => edit({ channels: recipe.channels.map(c => c === channel ? { ...c, fixed_fee } : c) })} />
      </div><p className="hint">Tarif awal hanya contoh. Sesuaikan dengan kontrak tokomu.</p>
    </div>}
    {tabs.map((label, i) => <div key={label} role="tabpanel" id={`panel-${i}`} aria-labelledby={`tab-${i}`} hidden={tab !== i}
      tabIndex={0} className="space-y-3">{tab === i && output()}</div>)}
  </>;
}

export default function ProTabs({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  return <details className="card min-w-0 lg:col-start-1" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary className="pro-summary"><span><span className="eyebrow block">03 / Analisis lanjutan</span>
      <span className="block text-lg font-semibold text-ink">Mode Pro</span>
      <span className="hint block">Cek harga ojol, promo, target balik modal, dan kenaikan bahan.</span></span></summary>
    {open && <Panels recipe={recipe} />}
  </details>;
}
