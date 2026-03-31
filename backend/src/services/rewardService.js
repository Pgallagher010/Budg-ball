import { store } from "../data/store.js";

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weekBoundsIso(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const start = monday.toISOString().slice(0, 10);
  const end = sunday.toISOString().slice(0, 10);
  return { start, end, key: isoWeekKey(monday) };
}

export async function claimWeeklyCoins(uid) {
  const user = await store.getUser(uid);
  if (!user) return { error: "User profile not found" };

  const weeklyLimit = Number(user?.preferences?.weeklyBudget || 0);
  if (!weeklyLimit || weeklyLimit <= 0) return { error: "Weekly spend goal not set" };

  const { start, end, key } = weekBoundsIso(new Date());
  const last = user?.rewards?.lastWeeklyClaimWeek || "";
  if (last === key) {
    return { claimed: false, weekKey: key, message: "Already claimed this week", user };
  }

  const expenses = await store.listExpensesByDateRange(uid, start, end);
  const spent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const met = spent <= weeklyLimit;

  const rewardCoins = met ? 60 : 0;
  const nextCoins = (user?.ballimal?.coins || 0) + rewardCoins;

  const updated = await store.upsertUser(uid, {
    ballimal: { coins: nextCoins },
    rewards: { lastWeeklyClaimWeek: key },
  });

  return {
    claimed: true,
    met,
    weekKey: key,
    start,
    end,
    spent,
    limit: weeklyLimit,
    rewardCoins,
    user: updated,
  };
}

