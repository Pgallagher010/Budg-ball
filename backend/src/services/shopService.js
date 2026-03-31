import { store } from "../data/store.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const SHOP_ITEMS = [
  { sku: "species:fox", type: "species", value: "fox", name: "Fox Ballimal", cost: 120 },
  { sku: "species:panda", type: "species", value: "panda", name: "Panda Ballimal", cost: 140 },
  { sku: "species:monkey", type: "species", value: "monkey", name: "Monkey Ballimal", cost: 100 },

  { sku: "color:orange", type: "colorTheme", value: "orange", name: "Orange background", cost: 40 },
  { sku: "color:pink", type: "colorTheme", value: "pink", name: "Pink background", cost: 40 },
  { sku: "color:mint", type: "colorTheme", value: "mint", name: "Green background", cost: 40 },
  { sku: "color:lavender", type: "colorTheme", value: "lavender", name: "Purple background", cost: 40 },
  { sku: "color:slate", type: "colorTheme", value: "slate", name: "Grey background", cost: 40 },

  // Consumables (repeat-purchasable) to refill ballimal stats
  { sku: "food:snack", type: "consumable", value: "hunger", delta: 20, name: "Snack", cost: 15 },
  { sku: "food:meal", type: "consumable", value: "hunger", delta: 45, name: "Meal", cost: 30 },
  { sku: "toy:ball", type: "consumable", value: "happiness", delta: 25, name: "Toy ball", cost: 20 },
  { sku: "toy:plush", type: "consumable", value: "happiness", delta: 45, name: "Plush toy", cost: 35 },
  { sku: "clean:brush", type: "consumable", value: "cleanliness", delta: 30, name: "Brush", cost: 18 },
  { sku: "clean:bath", type: "consumable", value: "cleanliness", delta: 60, name: "Bath", cost: 32 },
];

export async function listShop(uid) {
  const user = await store.getUser(uid);
  const coins = user?.ballimal?.coins || 0;
  const unlocks = user?.unlocks || { species: ["cat"], colorThemes: ["sand"] };

  return {
    coins,
    unlocks,
    items: SHOP_ITEMS.map((it) => ({
      ...it,
      owned:
        it.type === "species"
          ? unlocks.species?.includes(it.value)
          : it.type === "colorTheme"
            ? unlocks.colorThemes?.includes(it.value)
            : false,
    })),
  };
}

export async function purchaseShopItem(uid, sku) {
  const user = await store.getUser(uid);
  if (!user) return { error: "User profile not found" };

  const item = SHOP_ITEMS.find((x) => x.sku === sku);
  if (!item) return { error: "Item not found" };

  const coins = user?.ballimal?.coins || 0;
  const unlocks = user?.unlocks || { species: ["cat"], colorThemes: ["sand"] };

  const alreadyOwned =
    item.type === "species"
      ? unlocks.species?.includes(item.value)
      : item.type === "colorTheme"
        ? unlocks.colorThemes?.includes(item.value)
        : false;
  if (alreadyOwned) return { user, purchased: false, message: "Already owned" };

  if (coins < item.cost) return { error: "Not enough coins" };

  // Consumables: apply stat refill and deduct coins (repeatable)
  if (item.type === "consumable") {
    const ballimal = user?.ballimal || {};
    const key = item.value; // hunger | happiness | cleanliness
    const current = Number(ballimal[key] ?? 70);
    const next = clamp(current + Number(item.delta || 0), 0, 100);
    const nextCoins = coins - item.cost;
    const updated = await store.upsertUser(uid, {
      ballimal: { ...ballimal, coins: nextCoins, [key]: next },
    });
    return { user: updated, purchased: true, item };
  }

  const nextUnlocks = {
    species: Array.from(new Set([...(unlocks.species || ["cat"]), ...(item.type === "species" ? [item.value] : [])])),
    colorThemes: Array.from(
      new Set([...(unlocks.colorThemes || ["sand"]), ...(item.type === "colorTheme" ? [item.value] : [])])
    ),
  };

  const nextCoins = coins - item.cost;
  const updated = await store.upsertUser(uid, {
    unlocks: nextUnlocks,
    ballimal: { coins: nextCoins },
  });

  return { user: updated, purchased: true, item };
}

