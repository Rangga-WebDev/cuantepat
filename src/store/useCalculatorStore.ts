import { create } from "zustand";
import { persist } from "zustand/middleware";
import { channelNames, recipeSchema, scenarioSchema, type Recipe, type Row, type Scenario } from "../types/calculator";

export const guestKey = "cuantepat_guest_state_v1";
const scenarioKey = `${guestKey}:simulasi`;
export const presets = ["Es Kopi Susu", "Ayam Geprek", "Resep baru"] as const;
const defaults: Scenario = { channel: "Offline", price: null, discount_kind: "percent", discount: 0, quantity: 1, monthly_fixed_cost: 0, days: 26, increase: 0 };

function id() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // randomUUID membutuhkan HTTPS; getRandomValues juga tersedia saat ponsel membuka server di LAN.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const hex = Array.from(b, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function newRow(name = "", buy_price = 0, use_qty = 0, buy_unit: Row["buy_unit"] = "kg", use_unit: Row["use_unit"] = "g"): Row {
  return { id: id(), name, buy_price, buy_qty: 1, buy_unit, use_qty, use_unit, waste_percent: 0 };
}
export function newRecipe(name: typeof presets[number]): Recipe {
  const ingredients = name === "Es Kopi Susu" ? [newRow("Kopi bubuk", 120_000, 60), newRow("Susu segar", 20_000, 500, "l", "ml")]
    : name === "Ayam Geprek" ? [newRow("Ayam", 40_000, 600), newRow("Beras", 16_000, 400)] : [newRow()];
  return {
    local_id: id(), synced: false, name, ingredients, batch_portions: name === "Resep baru" ? 1 : 4,
    packaging_cost_per_portion: name === "Resep baru" ? 0 : 1_000, overhead_cost_per_batch: 0, labor_cost_per_batch: 0,
    target_margin_percent: 35, custom_selling_price: null,
    channels: channelNames.map(channel_name => ({ channel_name, commission_percent: 20, fixed_fee: 1000 })),
  };
}

type Saved = { recipe: Recipe | null; scenario: Scenario };
type State = Saved & {
  notice: string;
  edit: (patch: Partial<Recipe>) => void;
  simulate: (patch: Partial<Scenario>) => void;
  replace: (name: typeof presets[number]) => void;
};
type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createCalculator(storage: () => StorageAccess = () => window.localStorage) {
  let writable = false, recipeBytes: string | null = null, scenarioBytes: string | null = null;
  let restored: Recipe | null = null;
  const store = create<State>()(persist<State, [], [], Saved>((set) => ({
    recipe: null, scenario: defaults, notice: "",
    edit: patch => set(s => s.recipe ? { recipe: { ...s.recipe, ...patch } } : {}),
    simulate: patch => set(s => ({ scenario: { ...s.scenario, ...patch } })),
    replace: name => set({ recipe: newRecipe(name), scenario: defaults }),
  }), {
    name: guestKey, skipHydration: true,
    partialize: ({ recipe, scenario }) => ({ recipe, scenario }),
    storage: {
      getItem(key) {
        writable = false;
        restored = null;
        const db = storage();
        recipeBytes = db.getItem(key);
        restored = recipeBytes === null ? null : recipeSchema.parse(JSON.parse(recipeBytes));
        scenarioBytes = db.getItem(scenarioKey);
        const scenario = scenarioBytes === null ? defaults : scenarioSchema.parse(JSON.parse(scenarioBytes));
        return { state: { recipe: restored, scenario } };
      },
      setItem(key, { state }) {
        if (!writable || !state.recipe) return;
        const recipe = JSON.stringify(state.recipe), scenario = JSON.stringify(state.scenario);
        try {
          const db = storage();
          if (db.getItem(key) !== recipeBytes || db.getItem(scenarioKey) !== scenarioBytes) {
            writable = false;
            store.setState({ notice: "Draf berubah di tab lain. Muat ulang untuk memakai simpanan terbaru; perubahan di sini tidak disimpan." });
            return;
          }
          if (recipe !== recipeBytes) { db.setItem(key, recipe); recipeBytes = recipe; }
          if (scenario !== scenarioBytes) { db.setItem(scenarioKey, scenario); scenarioBytes = scenario; }
        } catch {
          writable = false;
          store.setState({ notice: "Penyimpanan penuh atau diblokir. Hitungan tetap bisa dipakai, tetapi perubahan tidak tersimpan." });
        }
      },
      removeItem(key) { const db = storage(); db.removeItem(key); db.removeItem(scenarioKey); },
    },
    onRehydrateStorage: () => (state, error) => {
      // Jangan tulis ulang resep yang baru dibaca: urutan kunci JSON dapat berubah setelah validasi.
      writable = !error && restored === null;
      store.setState({
        recipe: state?.recipe ?? restored ?? newRecipe("Es Kopi Susu"),
        notice: error ? "Simpanan lokal tidak dapat dibaca. Data lama tidak ditimpa; sesi ini tidak disimpan." : "",
      });
      if (!error && restored !== null) writable = true;
    },
  }));
  return store;
}

export const useCalculatorStore = createCalculator();
