import { describe, expect, it } from "vitest";
import { analyzeRecipe, batchCosts, breakEven, hppPerPortion, ingredientCost, simulateSale, suggestedPrice, type Ingredient } from "./hppEngine";
import { showcasePrice } from "./priceRounding";
import { convertUnit, type Calculation } from "./unitConverter";

function value<T>(result: Calculation<T>): T {
  if ("error" in result) throw new Error(result.error);
  return result.value;
}
const rejected = { value: 0, error: expect.stringMatching(/\S/) };
const ayam: Ingredient = { buy_price: 30_000, buy_qty: 1, buy_unit: "kg", use_qty: 300, use_unit: "g", waste_percent: 25 };
const susu: Ingredient = { buy_price: 32_000, buy_qty: 2, buy_unit: "l", use_qty: 250, use_unit: "ml" };
const ojol = { commission_percent: 20, fixed_fee: 1_000 };

describe("Konversi satuan", () => {
  it.each([
    [1.25, "kg", "g", 1250], [250, "g", "kg", 0.25],
    [1.5, "l", "ml", 1500], [500, "ml", "l", 0.5], [2, "sdm", "sdt", 6],
    [2, "lusin", "pcs", 24], [6, "pcs", "lusin", 0.5],
    [2, "karton", "pcs", 48], [6, "pcs", "karton", 0.25], [1, "karton", "lusin", 2],
  ] as const)("%s %s ke %s", (qty, from, to, expected) => {
    expect(value(convertUnit(qty, from, to, 24))).toBe(expected);
  });

  it("tidak menebak isi karton atau menyamakan berat dengan volume", () => {
    expect(value(convertUnit(1, "karton", "pcs", 30))).toBe(30);
    expect(value(convertUnit(2, "karton", "karton"))).toBe(2);
    expect(convertUnit(1, "karton", "pcs")).toEqual(rejected);
    expect(convertUnit(1, "pcs", "karton", 0.5)).toEqual(rejected);
    expect(convertUnit(1, "g", "sdm")).toEqual(rejected);
    expect(convertUnit(1, "l", "pcs")).toEqual(rejected);
    expect(convertUnit(Infinity, "g", "g")).toEqual(rejected);
  });
});

describe("Biaya bahan dan HPP", () => {
  it("memakai hasil bersih 750 g dari 1 kg ayam, lalu membagi biaya batch sebelum menambah kemasan", () => {
    expect(value(ingredientCost(ayam))).toBe(12_000);
    expect(value(ingredientCost(susu))).toBe(4_000);
    expect(value(hppPerPortion({
      ingredients: [ayam, susu], batch_portions: 4,
      overhead_cost_per_batch: 6_000, labor_cost_per_batch: 2_000, packaging_cost_per_portion: 1_000,
    }))).toBe(7_000);
  });

  it("tidak membulatkan harga satuan dan memakai isi karton tiap bahan", () => {
    const telur: Ingredient = { buy_price: 100, buy_qty: 1, buy_unit: "karton", pieces_per_carton: 30, use_qty: 1, use_unit: "pcs" };
    expect(value(ingredientCost(telur))).toBeCloseTo(3.333333333333, 10);
    expect(value(hppPerPortion({ ingredients: [telur, telur, telur], batch_portions: 1 }))).toBeCloseTo(10, 10);
  });

  it.each([{ buy_qty: 0 }, { use_qty: -1 }, { waste_percent: 95 }, { waste_percent: -1 }, { buy_price: NaN }])(
    "menolak seluruh HPP, bukan melewatkan bahan bermasalah: %o", patch => {
      expect(hppPerPortion({ ingredients: [susu, { ...ayam, ...patch }], batch_portions: 2 })).toEqual(rejected);
    },
  );
  it("membedakan biaya nol yang sah dari masukan yang belum valid", () => {
    expect(hppPerPortion({ ingredients: [], batch_portions: 1 })).toEqual({ value: 0 });
    for (const batch_portions of [0, -1, 0.5, Infinity]) {
      expect(hppPerPortion({ ingredients: [ayam], batch_portions })).toEqual(rejected);
    }
    expect(hppPerPortion({ ingredients: [], batch_portions: 1, labor_cost_per_batch: -1 })).toEqual(rejected);
  });
});

describe("Harga dan margin kanal", () => {
  it("memisahkan saran harga, harga aktual, dan pilihan harga etalase", () => {
    const recipe = { ingredients: [ayam], batch_portions: 2, target_margin_percent: 35 };
    const result = analyzeRecipe(recipe, undefined, 5_000);
    if ("error" in result) throw new Error(result.error);
    expect(result.value).toMatchObject({ price: 5_000, suggested: 9_231, sale: { profit: -1000 } });
    expect([0, 18_350, 18_900, 18_901].map(showcasePrice)).toEqual([0, 18_900, 18_900, 19_900]);
  });
  it.each([
    ["Offline", 0, 0, 10_000], ["GoFood", 20, 1_000, 13_750],
    ["GrabFood", 25, 500, 14_000], ["ShopeeFood", 10, 800, 12_000],
  ] as const)("%s: laba rupiah tetap sama setelah potongan", (_, commission_percent, fixed_fee, expected) => {
    const channel = { commission_percent, fixed_fee };
    const price = value(suggestedPrice(7_000, 30, channel));
    expect(price).toBe(expected);
    const sale = value(simulateSale([{ price, hpp: 7_000, quantity: 1 }], undefined, channel));
    expect(sale.netReceipts).toBe(10_000);
    expect(sale.profit).toBe(3_000);
    expect(sale.marginPercent).toBeCloseTo(300_000 / expected);
    expect(value(breakEven(900_001, 26, sale.netReceipts, { total: 7_000, portions: 1 }))).toEqual({ monthly: 301, daily: 12 });
  });
  it("menolak pembagi nol, tarif negatif, dan angka tidak berhingga", () => {
    expect(suggestedPrice(100, 100)).toEqual(rejected);
    expect(suggestedPrice(100, 0, { ...ojol, commission_percent: 100 })).toEqual(rejected);
    expect(suggestedPrice(100, 0, { ...ojol, fixed_fee: -1 })).toEqual(rejected);
    expect(suggestedPrice(Infinity, 20)).toEqual(rejected);
  });
});

describe("Promo dan bundling", () => {
  const bundle = [{ price: 20_000, hpp: 12_000, quantity: 2 }, { price: 10_000, hpp: 4_000, quantity: 1 }];

  it("diskon 10% atau Rp5.000 setara; biaya layanan hanya sekali per pesanan", () => {
    const sale = value(simulateSale(bundle, { kind: "percent", value: 10 }, ojol));
    expect(value(simulateSale(bundle, { kind: "amount", value: 5_000 }, ojol))).toEqual(sale);
    expect(sale).toMatchObject({ paid: 45_000, netReceipts: 35_000, profit: 7_000, health: "warning", maxDiscount: 13_750 });
    expect(sale.marginPercent).toBeCloseTo(15.555556);
  });
  it("diskon tepat batas menghasilkan laba nol; lebih dari batas berarti rugi", () => {
    expect(value(simulateSale(bundle, { kind: "amount", value: 13_750 }, ojol)).profit).toBe(0);
    expect(value(simulateSale(bundle, { kind: "amount", value: 13_751 }, ojol)).profit).toBeCloseTo(-0.8);
    expect(value(simulateSale(bundle, { kind: "percent", value: 100 }, ojol))).toMatchObject({
      paid: 0, profit: -29_000, marginPercent: null, health: "danger",
    });
    expect(value(simulateSale([{ price: 8, hpp: 10, quantity: 1 }]))).toMatchObject({
      profit: -2, marginPercent: -25, health: "danger", maxDiscount: null,
    });
  });
  it.each([[8501, "danger"], [8500, "warning"], [7000, "warning"], [6999, "healthy"]] as const)(
    "menilai batas margin 15%% dan 30%%: HPP %s", (hpp, health) => {
      expect(value(simulateSale([{ price: 10_000, hpp, quantity: 1 }])).health).toBe(health);
    },
  );
  it("tidak memberi status bahaya untuk margin tepat 15% pada harga desimal", () => {
    expect(value(simulateSale([{ price: 8.2, hpp: 6.97, quantity: 1 }])).health).toBe("warning");
  });
  it("menolak pesanan kosong, jumlah porsi pecahan, dan diskon di luar harga", () => {
    expect(simulateSale([])).toEqual(rejected);
    expect(simulateSale([{ price: 10, hpp: 5, quantity: 1.5 }])).toEqual(rejected);
    expect(simulateSale(bundle, { kind: "amount", value: 50_001 })).toEqual(rejected);
    expect(simulateSale(bundle, { kind: "percent", value: -1 })).toEqual(rejected);
    expect(simulateSale(bundle, { kind: "percent", value: 101 })).toEqual(rejected);
  });
});

describe("BEP", () => {
  const onePortionNoCost = { total: 0, portions: 1 };
  it("tidak membulatkan HPP sepertiga batch sebelum menetapkan target", () => {
    const batch = value(batchCosts({ ingredients: [{ ...susu, buy_price: 20_000, use_qty: 2000 }], batch_portions: 3 }));
    const sale = value(simulateSale([{ hpp: batch.perPortion, price: 10_000, quantity: 1 }]));
    expect(value(breakEven(100_000, 30, sale.netReceipts, batch))).toEqual({ monthly: 30, daily: 1 });
    expect(value(breakEven(100_000.01, 30, sale.netReceipts, batch))).toEqual({ monthly: 31, daily: 2 });
  });
  it.each([[19_900, 19, 15_119], [12_900, 31, 7_901]])("laba nol, batas promo nol, BEP mustahil: %s", (price, rate, hpp) => {
    const channel = { commission_percent: rate, fixed_fee: 1_000 };
    expect(value(suggestedPrice(hpp, 0, channel))).toBe(price);
    const sale = value(simulateSale([{ price, hpp, quantity: 1 }], undefined, channel));
    expect(sale).toMatchObject({ profit: 0, maxDiscount: 0 });
    expect(value(breakEven(1_000_000, 26, sale.netReceipts, { total: hpp, portions: 1 }))).toBeNull();
  });
  it("kenaikan harga hanya memengaruhi bahan, bukan kemasan atau biaya operasional", () => {
    const recipe = { ingredients: [ayam], batch_portions: 4, overhead_cost_per_batch: 2_000, packaging_cost_per_portion: 500 };
    expect(value(batchCosts(recipe, 50))).toMatchObject({ ingredients: 18_000, overhead: 2_000, packaging: 2_000, perPortion: 5_500 });
    expect(value(batchCosts(recipe)).ingredients).toBe(12_000);
    expect(batchCosts(recipe, 51)).toEqual(rejected);
  });
  it("membulatkan porsi bulanan dan harian ke atas, tanpa menambah porsi pada kelipatan persis", () => {
    expect(value(breakEven(3_000_001, 25, 10_000, onePortionNoCost))).toEqual({ monthly: 301, daily: 13 });
    expect(value(breakEven(120_000.60, 12, 10_000.05, onePortionNoCost))).toEqual({ monthly: 12, daily: 1 });
    expect(value(breakEven(120_000.61, 12, 10_000.05, onePortionNoCost))).toEqual({ monthly: 13, daily: 2 });
    expect(value(breakEven(0.14, 5, 0.014, onePortionNoCost))).toEqual({ monthly: 10, daily: 2 });
  });
  it("membedakan BEP mustahil, tidak ada biaya tetap, dan masukan tidak valid", () => {
    expect(value(breakEven(1_000, 25, 0, onePortionNoCost))).toBeNull();
    expect(value(breakEven(1_000, 25, -10, onePortionNoCost))).toBeNull();
    expect(value(breakEven(0, 25, 0, onePortionNoCost))).toEqual({ monthly: 0, daily: 0 });
    expect(breakEven(1_000, 0, 100, onePortionNoCost)).toEqual(rejected);
    expect(breakEven(1_000, 25, NaN, onePortionNoCost)).toEqual(rejected);
  });
});
