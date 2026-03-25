import { store } from "../data/store.js";
import { coinsFromGoal } from "./ballimalService.js";

// Goal service encapsulates reward rules and goal completion side effects.
export async function listGoals(uid) {
  return store.listGoals(uid);
}

export async function createGoal(uid, payload) {
  // Reward is derived server-side to prevent client tampering.
  return store.createGoal(uid, {
    ...payload,
    rewardCoins: coinsFromGoal(payload.type),
  });
}

export async function updateGoal(uid, goalId, payload) {
  return store.updateGoal(uid, goalId, payload);
}

export async function completeGoal(uid, goalId) {
  const goal = await store.getGoal(uid, goalId);
  if (!goal) return null;

  // Completing a goal updates both the goal document and the user's ballimal.
  const updatedGoal = await store.updateGoal(uid, goalId, {
    status: "completed",
    progressAmount: goal.targetAmount,
  });

  const user = await store.getUser(uid);
  const currentCoins = user?.ballimal?.coins || 0;
  const currentHealth = user?.ballimal?.health ?? 70;

  await store.upsertUser(uid, {
    ballimal: {
      coins: currentCoins + (goal.rewardCoins || 0),
      health: Math.min(currentHealth + 5, 100),
    },
  });

  return {
    goal: updatedGoal,
    rewardCoins: goal.rewardCoins || 0,
  };
}
