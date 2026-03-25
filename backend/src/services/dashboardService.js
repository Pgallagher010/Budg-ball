import { store } from "../data/store.js";

// Dashboard service returns an aggregate DTO to minimize client-side joins.
export async function getDashboardSummary(uid, monthKey) {
  const summary = await store.buildMonthlySummary(uid, monthKey);
  return { monthKey, ...summary };
}
