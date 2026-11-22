import { convertUnit, finiteValue, invalid, type Calculation, type Unit } from "./unitConverter";

export type Ingredient = {
  buy_price: number; buy_qty: number; buy_unit: Unit;
  use_qty: number; use_unit: Unit;
  waste_percent?: number; pieces_per_carton?: number;
};

export type Batch = {
  ingredients: readonly Ingredient[]; batch_portions: number;
  overhead_cost_per_batch?: number; labor_cost_per_batch?: number; packaging_cost_per_portion?: number;
};
type BatchCosts = { ingredients: number; overhead: number; packaging: number; total: number; portions: number; perPortion: number };
type Channel = { commission_percent: number; fixed_fee: number };
type SaleItem = { price: number; hpp: number; quantity: number };
type Discount = { kind: "amount" | "percent"; value: number };
type Sale = {
  paid: number; netReceipts: number; profit: number; marginPercent: number | null;
  health: "danger" | "warning" | "healthy"; maxDiscount: number | null;
};

const offline: Channel = { commission_percent: 0, fixed_fee: 0 };
const nonNegative = (n: number) => Number.isFinite(n) && n >= 0;
const positiveInteger = (n: number) => Number.isSafeInteger(n) && n > 0;
const retainedShare = (percent: number) => (100 - percent) / 100;
const validRate = (percent: number) => Number.isFinite(percent) && percent >= 0 && percent < 100;
const validChannel = (c: Channel) => validRate(c.commission_percent) && nonNegative(c.fixed_fee);

export function ingredientCost({
  buy_price, buy_qty, buy_unit, use_qty, use_unit, waste_percent = 0, pieces_per_carton,
}: Ingredient): Calculation<number> {
  if (!nonNegative(buy_price)) return invalid("Harga beli tidak boleh negatif atau kosong.");
  if (![buy_qty, use_qty].every(qty => Number.isFinite(qty) && qty > 0)) {
    return invalid("Jumlah beli dan pakai harus lebih dari 0.");
  }
  if (!(waste_percent >= 0 && waste_percent < 95)) return invalid("Susut bahan harus dari 0% sampai kurang dari 95%.");
  const bought = convertUnit(buy_qty, buy_unit, use_unit, pieces_per_carton);
  if ("error" in bought) return bought;
  return finiteValue(buy_price * (use_qty / (bought.value * retainedShare(waste_percent))));
}

export function batchCosts({
  ingredients, batch_portions, overhead_cost_per_batch = 0, labor_cost_per_batch = 0, packaging_cost_per_portion = 0,
}: Batch, increasePercent = 0): Calculation<BatchCosts> {
  if (!positiveInteger(batch_portions)) return invalid("Jumlah porsi harus bilangan bulat di atas 0.");
  if (!(increasePercent >= 0 && increasePercent <= 50)) return invalid("Kenaikan harga bahan harus antara 0% dan 50%.");
  if (![overhead_cost_per_batch, labor_cost_per_batch, packaging_cost_per_portion].every(nonNegative)) {
    return invalid("Biaya operasional, upah, dan kemasan harus berupa angka nol atau lebih.");
  }
  let materials = 0;
  for (const item of ingredients) {
    const cost = ingredientCost(item);
    if ("error" in cost) return cost;
    materials += cost.value;
  }
  materials *= 1 + increasePercent / 100;
  const overhead = overhead_cost_per_batch + labor_cost_per_batch;
  const packaging = packaging_cost_per_portion * batch_portions;
  const total = materials + overhead + packaging;
  if (!Number.isFinite(total)) return invalid("Total biaya terlalu besar untuk dihitung.");
  return { value: { ingredients: materials, overhead, packaging, total, portions: batch_portions, perPortion: total / batch_portions } };
}

export function hppPerPortion(batch: Batch): Calculation<number> {
  const costs = batchCosts(batch);
  return "error" in costs ? costs : { value: costs.value.perPortion };
}

export function suggestedPrice(hpp: number, targetMarginPercent: number, channel = offline): Calculation<number> {
  if (!nonNegative(hpp)) return invalid("HPP harus berupa angka nol atau lebih.");
  if (!validRate(targetMarginPercent)) return invalid("Target margin harus dari 0% sampai kurang dari 100%.");
  if (!validChannel(channel)) return invalid("Periksa biaya layanan dan komisi (0% sampai kurang dari 100%).");
  const offlinePrice = hpp * 100 / (100 - targetMarginPercent);
  return finiteValue((offlinePrice + channel.fixed_fee) * 100 / (100 - channel.commission_percent));
}

export function simulateSale(
  items: readonly SaleItem[], discount: Discount = { kind: "amount", value: 0 }, channel = offline,
): Calculation<Sale> {
  if (!items.length) return invalid("Tambahkan minimal satu produk ke pesanan.");
  let subtotal = 0;
  let cost = 0;
  for (const { price, hpp, quantity } of items) {
    if (!nonNegative(price) || !nonNegative(hpp) || !positiveInteger(quantity)) {
      return invalid("Cek harga, HPP, dan jumlah porsi tiap produk.");
    }
    subtotal += price * quantity;
    cost += hpp * quantity;
  }
  if (!validChannel(channel)) return invalid("Periksa biaya layanan dan komisi (0% sampai kurang dari 100%).");
  if (!Number.isFinite(subtotal) || !Number.isFinite(cost)) return invalid("Total pesanan terlalu besar.");
  if (!nonNegative(discount.value) || discount.value > (discount.kind === "percent" ? 100 : subtotal)) {
    return invalid("Diskon tidak boleh negatif atau melebihi harga pesanan.");
  }
  // Diskon ditanggung penjual; komisi dihitung setelah diskon, biaya tetap sekali per pesanan.
  const keptPercent = 100 - channel.commission_percent;
  const receipts = (gross: number) => gross * keptPercent / 100 - channel.fixed_fee;
  const paid = discount.kind === "percent" ? subtotal * (100 - discount.value) / 100 : subtotal - discount.value;
  const netReceipts = receipts(paid);
  const profit = netReceipts - cost;
  const beforeDiscount = receipts(subtotal) - cost;
  if (!Number.isFinite(profit) || !Number.isFinite(beforeDiscount)) return invalid("Laba di luar jangkauan angka.");
  const marginPercent = paid === 0 ? null : profit / paid * 100;
  if (marginPercent !== null && !Number.isFinite(marginPercent)) return invalid("Margin di luar jangkauan angka.");
  // Selisih presisi di batas persentase tidak boleh mengubah warna indikator.
  const noise = 100 * Number.EPSILON;
  const health = marginPercent === null || marginPercent < 15 - noise ? "danger"
    : marginPercent > 30 + noise ? "healthy" : "warning";
  const maxDiscount = beforeDiscount < 0 ? null : Math.min(subtotal, beforeDiscount * 100 / keptPercent);
  return { value: { paid, netReceipts, profit, marginPercent, health, maxDiscount } };
}

function decimalParts(value: number) {
  const [digits, exponent] = value.toExponential().replace(".", "").split("e");
  return { units: BigInt(digits), power: Number(exponent) + 1 - digits.length };
}

export function analyzeRecipe(
  recipe: Batch & { target_margin_percent: number }, channel = offline, actualPrice: number | null = null, increase = 0,
) {
  const costs = batchCosts(recipe, increase);
  if ("error" in costs) return costs;
  const quote = suggestedPrice(costs.value.perPortion, recipe.target_margin_percent, channel);
  if ("error" in quote) return quote;
  const suggested = Math.ceil(quote.value);
  const price = actualPrice ?? suggested;
  const sale = simulateSale([{ price, hpp: costs.value.perPortion, quantity: 1 }], undefined, channel);
  if ("error" in sale) return sale;
  return { value: { costs: costs.value, suggested, price, sale: sale.value } };
}
export type Analysis = ReturnType<typeof analyzeRecipe>;

// Untuk resep, gunakan penerimaan per porsi dan biaya satu batch utuh; jangan masukkan HPP hasil pembagian.
export function breakEven(
  monthlyFixedCost: number, operatingDays: number, netPerPortion: number,
  batch: Pick<BatchCosts, "total" | "portions">,
): Calculation<{ monthly: number; daily: number } | null> {
  if (!nonNegative(monthlyFixedCost) || !Number.isFinite(netPerPortion) || !nonNegative(batch.total) || !positiveInteger(batch.portions)) {
    return invalid("Cek biaya tetap, biaya batch, penerimaan, dan jumlah porsi.");
  }
  if (!positiveInteger(operatingDays) || operatingDays > 31) return invalid("Isi hari kerja antara 1 dan 31.");
  if (monthlyFixedCost === 0) return { value: { monthly: 0, daily: 0 } };
  if (netPerPortion <= 0) return { value: null };
  const parts = [monthlyFixedCost, netPerPortion, batch.total].map(decimalParts);
  const power = Math.min(...parts.map(p => p.power));
  const [fixed, net, cost] = parts.map(p => p.units * BigInt(10) ** BigInt(p.power - power));
  const portions = BigInt(batch.portions);
  const numerator = fixed * portions;
  const denominator = net * portions - cost;
  if (denominator <= 0) return { value: null };
  const monthly = Number((numerator + denominator - BigInt(1)) / denominator);
  if (!Number.isSafeInteger(monthly)) return invalid("Target porsi terlalu besar untuk dihitung.");
  return { value: { monthly, daily: Math.ceil(monthly / operatingDays) } };
}
