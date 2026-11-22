import { compatible } from "../../lib/math/unitConverter";
import { newRow, presets, useCalculatorStore } from "../../store/useCalculatorStore";
import { buyUnits, useUnits, type Recipe, type Row } from "../../types/calculator";
import { Choice, Numeric } from "./Fields";

export default function QuickModeForm({ recipe }: { recipe: Recipe }) {
  const edit = useCalculatorStore(s => s.edit), replace = useCalculatorStore(s => s.replace);
  function row(id: string, patch: Partial<Row>) {
    edit({ ingredients: recipe.ingredients.map(r => r.id === id ? { ...r, ...patch } : r) });
  }
  return <section className="card space-y-5" aria-labelledby="quick-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="eyebrow">01 / Resep</p><h2 id="quick-title">Mode Cepat</h2></div>
      <select className="control !w-auto" aria-label="Pilih contoh resep atau mulai baru" value="" onChange={e => {
        const chosen = presets[e.currentTarget.selectedIndex - 1];
        if (chosen && window.confirm(`Ganti draf saat ini dengan "${chosen}"?`)) replace(chosen);
      }}><option value="" disabled>Contoh / resep baru</option>{presets.map(p => <option key={p}>{p}</option>)}</select>
    </div>
    <label className="field">Nama resep<input className="control" value={recipe.name} placeholder="Misal: Ayam geprek"
      onChange={e => edit({ name: e.target.value })} /></label>
    <div className="flex items-baseline justify-between"><h3>Bahan baku</h3><span className="hint">{recipe.ingredients.length} bahan</span></div>
    {recipe.ingredients.map((r, i) => <fieldset className="rounded-xl border border-border p-3 sm:p-4" key={r.id}>
      <legend className="eyebrow px-1">Bahan {String(i + 1).padStart(2, "0")}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <label className="field">Nama bahan<input className="control" value={r.name} placeholder="Misal: tepung"
          onChange={e => row(r.id, { name: e.target.value })} /></label>
        <button className="quiet" aria-label={`Hapus bahan ${i + 1}: ${r.name}`} onClick={() => edit({ ingredients: recipe.ingredients.filter(x => x.id !== r.id) })}>Hapus</button>
      </div>
      <div className="grid gap-3 pt-3 sm:grid-cols-2">
        <Numeric label="Harga beli" unit="Rp" value={r.buy_price} change={buy_price => row(r.id, { buy_price })} />
        <div className="grid grid-cols-2 gap-2">
          <Numeric label="Jumlah beli" unit={r.buy_unit} value={r.buy_qty} change={buy_qty => row(r.id, { buy_qty })} />
          <Choice label="Satuan beli" value={r.buy_unit} options={buyUnits} change={buy_unit => row(r.id, {
            buy_unit, use_unit: compatible(buy_unit, r.use_unit) ? r.use_unit : useUnits.find(u => compatible(buy_unit, u))!,
          })} />
        </div>
        <Numeric label="Jumlah dipakai" unit={r.use_unit} value={r.use_qty} change={use_qty => row(r.id, { use_qty })} />
        <Choice label="Satuan pakai" value={r.use_unit} options={useUnits.filter(u => compatible(r.buy_unit, u))} change={use_unit => row(r.id, { use_unit })} />
        {r.buy_unit === "karton" && <Numeric label="Isi per karton" unit="pcs" integer value={r.pieces_per_carton ?? 0} change={pieces_per_carton => row(r.id, { pieces_per_carton })} />}
      </div>
      <details className="mt-2"><summary>Susut bahan ({r.waste_percent}%)</summary>
        <Numeric label="Bagian terbuang" unit="%" max={94.99} value={r.waste_percent} change={waste_percent => row(r.id, { waste_percent })} />
      </details>
    </fieldset>)}
    <button className="secondary w-full" onClick={() => edit({ ingredients: [...recipe.ingredients, newRow()] })}>+ Tambah bahan</button>
    <div className="grid gap-3 sm:grid-cols-2">
      <Numeric label="Hasil satu resep" unit="porsi" min={1} integer value={recipe.batch_portions} change={batch_portions => edit({ batch_portions })} />
      <Numeric label="Kemasan per porsi" unit="Rp" value={recipe.packaging_cost_per_portion} change={packaging_cost_per_portion => edit({ packaging_cost_per_portion })} />
    </div>
    <details className="section-fold"><summary>Biaya operasional dan upah</summary>
      <div className="grid gap-3 sm:grid-cols-2">
        <Numeric label="Gas, listrik, dll. per resep" unit="Rp" value={recipe.overhead_cost_per_batch} change={overhead_cost_per_batch => edit({ overhead_cost_per_batch })} />
        <Numeric label="Upah per resep" unit="Rp" value={recipe.labor_cost_per_batch} change={labor_cost_per_batch => edit({ labor_cost_per_batch })} />
      </div>
    </details>
    <details className="section-fold"><summary>Target margin dan harga jual saya</summary>
      <div className="grid gap-3 sm:grid-cols-2">
        <Numeric label="Target margin" unit="%" max={99.99} value={recipe.target_margin_percent} change={target_margin_percent => edit({ target_margin_percent })} />
        <Numeric label="Harga jual saya" unit="Rp" value={recipe.custom_selling_price} placeholder="Pakai saran"
          clear={() => edit({ custom_selling_price: null })} change={custom_selling_price => edit({ custom_selling_price })} />
      </div>
    </details>
  </section>;
}
