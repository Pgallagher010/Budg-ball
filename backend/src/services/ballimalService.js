const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Core pet-state algorithm.
// Tune constants below to rebalance gameplay without changing API contracts.
export function calculateBallimalState({
  currentHealth = 70,
  goalCompletionRate = 0,
  budgetPressure = 0,
}) {
  const goalBonus = goalCompletionRate * 20;
  const budgetPenalty = budgetPressure * 25;
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
