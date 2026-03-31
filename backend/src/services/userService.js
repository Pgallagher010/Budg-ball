import { store } from "../data/store.js";

// User service keeps route handlers unaware of persistence details.
export async function getMyProfile(uid) {
  return store.getUser(uid);
}

export async function upsertMyProfile(uid, payload) {
  // Normalize username casing once so all consumers get consistent values.
  return store.upsertUser(uid, {
    username: payload.username.toLowerCase(),
    displayName: payload.displayName,
  });
}

export async function updateMyPreferences(uid, payload) {
  return store.upsertUser(uid, {
    preferences: {
      species: payload.species,
      colorTheme: payload.colorTheme,
      weeklyBudget: payload.weeklyBudget,
    },
  });
}

export async function setMyCoins(uid, coins) {
  return store.upsertUser(uid, {
    ballimal: { coins },
  });
}
