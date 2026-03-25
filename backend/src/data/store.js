import { firestore, firebaseReady } from "../config/firebase.js";
import { calculateBallimalState } from "../services/ballimalService.js";

// Repository abstraction used by services.
// It supports Firestore (production) and in-memory Maps (local/dev/tests).
const monthKeyFromDate = (isoDate) => isoDate.slice(0, 7);
const nowIso = () => new Date().toISOString();

// In-memory backing store. Data resets whenever the process restarts.
const memory = {
  users: new Map(),
  goals: new Map(),
  budgets: new Map(),
  expenses: new Map(),
  friendRequests: new Map(),
  friendships: new Map(),
};

function uidKey(uid, key) {
  return `${uid}:${key}`;
}

function sortedFriendKey(a, b) {
  return [a, b].sort().join("_");
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getUser(uid) {
  // Keep return shape stable regardless of backing store.
  if (firebaseReady) {
    const snap = await firestore.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    return { uid, ...snap.data() };
  }
  return memory.users.get(uid) || null;
}

async function upsertUser(uid, userPatch) {
  // Upsert semantics allow React clients to call POST /users/me repeatedly.
  const existing = (await getUser(uid)) || {
    uid,
    username: "",
    displayName: "",
    createdAt: nowIso(),
    ballimal: { health: 70, mood: "content", coins: 0 },
  };

  const merged = {
    ...existing,
    ...userPatch,
    updatedAt: nowIso(),
    ballimal: {
      ...existing.ballimal,
      ...(userPatch.ballimal || {}),
    },
  };

  if (firebaseReady) {
    await firestore.collection("users").doc(uid).set(merged, { merge: true });
  } else {
    memory.users.set(uid, merged);
  }
  return merged;
}

async function searchUsers(query, excludeUid) {
  const normalized = (query || "").toLowerCase();
  if (!normalized) return [];

  if (firebaseReady) {
    const snap = await firestore
      .collection("users")
      .where("username", ">=", normalized)
      .where("username", "<=", `${normalized}\uf8ff`)
      .limit(10)
      .get();

    return snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((u) => u.uid !== excludeUid);
  }

  return Array.from(memory.users.values())
    .filter(
      (u) =>
        u.uid !== excludeUid &&
        ((u.username || "").toLowerCase().includes(normalized) ||
          (u.displayName || "").toLowerCase().includes(normalized))
    )
    .slice(0, 10);
}

async function listGoals(uid) {
  if (firebaseReady) {
    const snap = await firestore
      .collection("users")
      .doc(uid)
      .collection("goals")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memory.goals.values())
    .filter((g) => g.uid === uid)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function createGoal(uid, data) {
  // ownerUid supports future Firestore security rules and auditing.
  const goal = {
    uid,
    ownerUid: uid,
    type: data.type,
    targetAmount: data.targetAmount,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    progressAmount: data.progressAmount || 0,
    rewardCoins: data.rewardCoins,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (firebaseReady) {
    const ref = await firestore.collection("users").doc(uid).collection("goals").add(goal);
    return { id: ref.id, ...goal };
  }

  const id = randomId("goal");
  memory.goals.set(id, { id, ...goal });
  return memory.goals.get(id);
}

async function getGoal(uid, goalId) {
  if (firebaseReady) {
    const snap = await firestore.collection("users").doc(uid).collection("goals").doc(goalId).get();
    if (!snap.exists) return null;
    return { id: goalId, ...snap.data() };
  }
  const goal = memory.goals.get(goalId);
  return goal && goal.uid === uid ? goal : null;
}

async function updateGoal(uid, goalId, patch) {
  const goal = await getGoal(uid, goalId);
  if (!goal) return null;
  const merged = { ...goal, ...patch, updatedAt: nowIso() };

  if (firebaseReady) {
    await firestore.collection("users").doc(uid).collection("goals").doc(goalId).set(merged, { merge: true });
  } else {
    memory.goals.set(goalId, merged);
  }
  return merged;
}

async function listBudgets(uid, monthKey) {
  if (firebaseReady) {
    const snap = await firestore
      .collection("users")
      .doc(uid)
      .collection("budgets")
      .where("monthKey", "==", monthKey)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memory.budgets.values()).filter((b) => b.uid === uid && b.monthKey === monthKey);
}

async function setBudget(uid, budget) {
  const id = `${budget.monthKey}_${budget.category}`;
  const payload = {
    uid,
    ownerUid: uid,
    monthKey: budget.monthKey,
    category: budget.category,
    limitAmount: budget.limitAmount,
    usedAmount: budget.usedAmount ?? 0,
    updatedAt: nowIso(),
  };

  if (firebaseReady) {
    await firestore.collection("users").doc(uid).collection("budgets").doc(id).set(payload, { merge: true });
    return { id, ...payload };
  }

  memory.budgets.set(uidKey(uid, id), { id, ...payload });
  return memory.budgets.get(uidKey(uid, id));
}

async function addExpense(uid, expense) {
  const payload = {
    uid,
    ownerUid: uid,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    description: expense.description || "",
    createdAt: nowIso(),
  };

  if (firebaseReady) {
    const ref = await firestore.collection("users").doc(uid).collection("expenses").add(payload);
    return { id: ref.id, ...payload };
  }

  const id = randomId("exp");
  memory.expenses.set(id, { id, ...payload });
  return memory.expenses.get(id);
}

async function listExpenses(uid, monthKey) {
  if (firebaseReady) {
    const [start, end] = [`${monthKey}-01`, `${monthKey}-31`];
    const snap = await firestore
      .collection("users")
      .doc(uid)
      .collection("expenses")
      .where("date", ">=", start)
      .where("date", "<=", end)
      .orderBy("date", "desc")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memory.expenses.values())
    .filter((e) => e.uid === uid && monthKeyFromDate(e.date) === monthKey)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function createFriendRequest(fromUid, toUid) {
  const payload = {
    fromUid,
    toUid,
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (firebaseReady) {
    const ref = await firestore.collection("friendRequests").add(payload);
    return { id: ref.id, ...payload };
  }

  const id = randomId("fr");
  memory.friendRequests.set(id, { id, ...payload });
  return memory.friendRequests.get(id);
}

async function listFriendRequests(uid) {
  if (firebaseReady) {
    const snap = await firestore
      .collection("friendRequests")
      .where("toUid", "==", uid)
      .where("status", "==", "pending")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memory.friendRequests.values()).filter(
    (r) => r.toUid === uid && r.status === "pending"
  );
}

async function acceptFriendRequest(uid, requestId) {
  // Ownership check: only the request recipient can accept.
  let request = null;
  if (firebaseReady) {
    const ref = firestore.collection("friendRequests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    request = { id: requestId, ...snap.data() };
    if (request.toUid !== uid || request.status !== "pending") return null;
    await ref.set({ status: "accepted", updatedAt: nowIso() }, { merge: true });
  } else {
    request = memory.friendRequests.get(requestId);
    if (!request || request.toUid !== uid || request.status !== "pending") return null;
    memory.friendRequests.set(requestId, { ...request, status: "accepted", updatedAt: nowIso() });
  }

  const friendshipId = sortedFriendKey(request.fromUid, request.toUid);
  const friendship = {
    users: [request.fromUid, request.toUid].sort(),
    createdAt: nowIso(),
  };

  if (firebaseReady) {
    await firestore.collection("friendships").doc(friendshipId).set(friendship, { merge: true });
  } else {
    memory.friendships.set(friendshipId, { id: friendshipId, ...friendship });
  }

  return { id: friendshipId, ...friendship };
}

async function listFriends(uid) {
  if (firebaseReady) {
    const snap = await firestore.collection("friendships").where("users", "array-contains", uid).get();
    const friendIds = snap.docs.flatMap((d) => d.data().users.filter((x) => x !== uid));
    const userDocs = await Promise.all(friendIds.map((fid) => firestore.collection("users").doc(fid).get()));
    return userDocs.filter((d) => d.exists).map((d) => ({ uid: d.id, ...d.data() }));
  }

  const ids = Array.from(memory.friendships.values())
    .filter((f) => f.users.includes(uid))
    .flatMap((f) => f.users.filter((id) => id !== uid));
  return ids.map((id) => memory.users.get(id)).filter(Boolean);
}

async function buildMonthlySummary(uid, monthKey) {
  // Aggregate queries in parallel to keep endpoint latency predictable.
  const [expenses, budgets, goals, user] = await Promise.all([
    listExpenses(uid, monthKey),
    listBudgets(uid, monthKey),
    listGoals(uid),
    getUser(uid),
  ]);

  const spentThisMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalGoalTarget = goals
    .filter((g) => g.status !== "failed" && g.periodStart.startsWith(monthKey))
    .reduce((s, g) => s + g.targetAmount, 0);
  const totalProgress = goals
    .filter((g) => g.status !== "failed" && g.periodStart.startsWith(monthKey))
    .reduce((s, g) => s + g.progressAmount, 0);

  const goalCompletionRate = totalGoalTarget > 0 ? totalProgress / totalGoalTarget : 0;
  const budgetPressure = totalBudget > 0 ? Math.max(0, (spentThisMonth - totalBudget) / totalBudget) : 0;
  const currentHealth = user?.ballimal?.health ?? 70;
  const nextState = calculateBallimalState({ currentHealth, goalCompletionRate, budgetPressure });

  return {
    spentThisMonth,
    totalBudget,
    remainingBudget: totalBudget - spentThisMonth,
    goalCompletionRate: Number(goalCompletionRate.toFixed(2)),
    ballimal: { ...(user?.ballimal || {}), ...nextState },
  };
}

export const store = {
  getUser,
  upsertUser,
  searchUsers,
  listGoals,
  createGoal,
  getGoal,
  updateGoal,
  listBudgets,
  setBudget,
  addExpense,
  listExpenses,
  createFriendRequest,
  listFriendRequests,
  acceptFriendRequest,
  listFriends,
  buildMonthlySummary,
  monthKeyFromDate,
};
