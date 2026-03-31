const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** How many health points are lost per €1 over the monthly budget (when budgets exist). */
export const HEALTH_LOSS_PER_EUR_OVER_BUDGET = 1;

// Core pet-state algorithm.
// Tune constants below to rebalance gameplay without changing API contracts.
export function calculateBallimalState({
  currentHealth = 70,
  goalCompletionRate = 0,
  /** EUR spent above total monthly budget (0 if under budget or no budget set). */
  budgetOverageEur = 0,
}) {
  const goalBonus = goalCompletionRate * 20;
  const over = Math.max(0, Number(budgetOverageEur) || 0);
  const budgetPenalty = over * HEALTH_LOSS_PER_EUR_OVER_BUDGET;
  const nextHealth = clamp(Math.round(currentHealth + goalBonus - budgetPenalty), 0, 100);

  let mood = "neutral";
  if (nextHealth >= 85) mood = "happy";
  else if (nextHealth >= 60) mood = "content";
  else if (nextHealth >= 35) mood = "worried";
  else mood = "sad";

  return {
    health: nextHealth,
    mood,
  };
}

export function coinsFromGoal(goalType) {
  // Fixed rewards by cadence; adjust as product economy evolves.
  if (goalType === "daily") return 10;
  if (goalType === "weekly") return 30;
  return 60;
}
