import { describe, expect, it } from "vitest";
import { ingredientCost } from "../lib/math/hppEngine";
import { createCalculator, guestKey, newRow } from "./useCalculatorStore";

function memory() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
}
describe("Draf tamu", () => {
  it("memulihkan resep karton dan parameter Pro dari penyimpanan baru", async () => {
    const db = memory(), first = createCalculator(() => db);
    await first.persist.rehydrate();
    first.getState().edit({ ingredients: [{ ...newRow("Telur", 30_000, 1, "karton", "pcs"), pieces_per_carton: 30 }] });
    first.getState().simulate({ channel: "GrabFood", discount: 12 });
    const raw = JSON.parse(db.getItem(guestKey)!);
    expect(raw).toMatchObject({ synced: false, ingredients: [{ pieces_per_carton: 30 }] });
    expect(raw).not.toHaveProperty("state");
    const next = createCalculator(() => db);
    await next.persist.rehydrate();
    expect(ingredientCost(next.getState().recipe!.ingredients[0])).toEqual({ value: 1000 });
    expect(next.getState().scenario).toMatchObject({ channel: "GrabFood", discount: 12 });
  });
  it.each(["{", '{"ingredients":null}'])("tidak menimpa simpanan rusak: %s", async raw => {
    const db = memory(); db.setItem(guestKey, raw);
    const store = createCalculator(() => db);
    await store.persist.rehydrate(); store.getState().edit({ name: "Tetap bisa diedit" });
    expect(store.getState().notice).toMatch(/tidak ditimpa/);
    expect(db.getItem(guestKey)).toBe(raw);
  });
  it("menerima isi karton NULL pada bahan yang dibeli per kg", async () => {
    const db = memory(), first = createCalculator(() => db);
    await first.persist.rehydrate();
    const recipe = first.getState().recipe!;
    db.setItem(guestKey, JSON.stringify({ ...recipe, ingredients: [{ ...newRow("Beras", 15_000, 100), pieces_per_carton: null }] }));
    const next = createCalculator(() => db);
    await next.persist.rehydrate();
    expect(next.getState().notice).toBe("");
    expect(ingredientCost(next.getState().recipe!.ingredients[0])).toEqual({ value: 1_500 });
  });
  it("tetap bisa digunakan ketika penulisan ditolak atau tab lain lebih dulu menyimpan", async () => {
    const db = memory();
    const full = createCalculator(() => ({ ...db, setItem() { throw new DOMException("Penuh", "QuotaExceededError"); } }));
    await full.persist.rehydrate();
    expect(full.getState().notice).toMatch(/tidak tersimpan/);
    const first = createCalculator(() => db), next = createCalculator(() => db);
    await first.persist.rehydrate(); await next.persist.rehydrate();
    first.getState().edit({ name: "Draf terbaru" }); next.getState().edit({ name: "Tab lama" });
    expect(next.getState().notice).toMatch(/tab lain/);
    expect(JSON.parse(db.getItem(guestKey)!).name).toBe("Draf terbaru");
  });
});
