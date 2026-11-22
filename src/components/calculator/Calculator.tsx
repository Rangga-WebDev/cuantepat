"use client";

import { useEffect } from "react";
import { analyzeRecipe } from "../../lib/math/hppEngine";
import { formatRupiah as rp } from "../../lib/utils";
import { useCalculatorStore } from "../../store/useCalculatorStore";
import QuickModeForm from "./QuickModeForm";
import ResultSummaryCard from "./ResultSummaryCard";
import ProTabs from "./ProTabs";

export default function Calculator() {
  const recipe = useCalculatorStore(s => s.recipe), notice = useCalculatorStore(s => s.notice);
  useEffect(() => {
    if (!useCalculatorStore.getState().recipe) void useCalculatorStore.persist.rehydrate();
  }, []);
  if (!recipe) return <p role="status" className="card">Membuka draf lokal…</p>;
  const result = analyzeRecipe(recipe, undefined, recipe.custom_selling_price);
  return <>
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm" role="status">
      <span className={`rounded-full border px-3 py-1 ${notice ? "border-warning-border bg-warning-bg text-warning" : "border-healthy-border bg-healthy-bg text-healthy"}`}>
        {notice ? "Belum tersimpan" : "Tersimpan di perangkat ini"}
      </span><span className="text-muted">{notice || "Satu draf aktif · Tanpa login"}</span>
    </div>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
      <QuickModeForm recipe={recipe} /><ResultSummaryCard result={result} name={recipe.name} /><ProTabs recipe={recipe} />
    </div>
    <a href="#ringkasan" className="fixed inset-x-0 bottom-0 z-10 flex min-h-16 items-center justify-between gap-2 border-t border-border bg-surface px-4 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-sm md:hidden" aria-label="Lihat detail ringkasan harga">
      <span className="min-w-0"><span className="hint block">HPP / porsi</span><b>{"error" in result ? "—" : rp(result.value.costs.perPortion)}</b></span>
      <span className="min-w-0"><span className="hint block">Saran jual</span><b>{"error" in result ? "—" : rp(result.value.suggested)}</b></span>
      <span aria-hidden="true" className="text-xl text-primary-hover">↑</span>
    </a>
  </>;
}
