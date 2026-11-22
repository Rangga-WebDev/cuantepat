import { z } from "zod";

export const buyUnits = ["kg", "g", "l", "ml", "pcs", "lusin", "karton"] as const;
export const useUnits = ["g", "ml", "pcs", "sdm", "sdt"] as const;
export const channelNames = ["GoFood", "GrabFood", "ShopeeFood", "Marketplace"] as const;
const n = z.number();
const ingredient = z.looseObject({
  id: z.uuid(), name: z.string(), buy_price: n, buy_qty: n, buy_unit: z.enum(buyUnits),
  use_qty: n, use_unit: z.enum(useUnits), waste_percent: n, pieces_per_carton: n.nullable().transform(v => v ?? undefined).optional(),
});
export const recipeSchema = z.looseObject({
  local_id: z.uuid(), synced: z.literal(false), name: z.string(), batch_portions: n,
  packaging_cost_per_portion: n, overhead_cost_per_batch: n, labor_cost_per_batch: n,
  target_margin_percent: n, custom_selling_price: n.nullable(), ingredients: z.array(ingredient),
  channels: z.array(z.looseObject({ channel_name: z.enum(channelNames), commission_percent: n, fixed_fee: n })),
});
export const scenarioSchema = z.object({
  channel: z.enum(["Offline", ...channelNames]), price: n.nullable(), discount_kind: z.enum(["amount", "percent"]),
  discount: n, quantity: n, monthly_fixed_cost: n, days: n, increase: n.min(0).max(50),
});
export type Recipe = z.infer<typeof recipeSchema>;
export type Row = z.infer<typeof ingredient>;
export type Scenario = z.infer<typeof scenarioSchema>;
