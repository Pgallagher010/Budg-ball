import { store } from "../data/store.js";

// Budget read model computes totals for direct dashboard consumption.
export async function listBudgets(uid, monthKey) {
  const budgets = await store.listBudgets(uid, monthKey);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalUsed = budgets.reduce((sum, b) => sum + (b.usedAmount || 0), 0);
  return {
    monthKey,
    budgets,
    totalBudget,
    totalUsed,
    remainingBudget: totalBudget - totalUsed,
  };
}

export async function setBudget(uid, payload) {
  // Category and validation constraints are enforced by the request schema.
  return store.setBudget(uid, payload);
}
