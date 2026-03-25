import { store } from "../data/store.js";

// Expense service is responsible for cascading updates:
// expense -> budget usage -> dashboard summary -> ballimal state.
export async function listExpenses(uid, monthKey) {
  const expenses = await store.listExpenses(uid, monthKey);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  return { monthKey, totalSpent, expenses };
}

export async function createExpense(uid, payload) {
  const expense = await store.addExpense(uid, payload);
  const monthKey = payload.date.slice(0, 7);
  const budgets = await store.listBudgets(uid, monthKey);
  const categoryBudget = budgets.find((b) => b.category === payload.category);

  // Update category budget usage for the same month, if a budget exists.
  if (categoryBudget) {
    await store.setBudget(uid, {
      ...categoryBudget,
      usedAmount: (categoryBudget.usedAmount || 0) + payload.amount,
    });
  }

  // Recompute summary after each expense so frontend always reads fresh state.
  const summary = await store.buildMonthlySummary(uid, monthKey);
  await store.upsertUser(uid, { ballimal: summary.ballimal });

  const warnings = [];
  if (categoryBudget) {
    const ratio =
      ((categoryBudget.usedAmount || 0) + payload.amount) / categoryBudget.limitAmount;
    if (ratio >= 0.8 && ratio < 1) warnings.push(`Category ${categoryBudget.category} is over 80% used.`);
    if (ratio >= 1) warnings.push(`Category ${categoryBudget.category} exceeded budget.`);
  }

  return {
    expense,
    warnings,
    ballimal: summary.ballimal,
  };
}
