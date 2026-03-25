import { store } from "../data/store.js";

export async function getSubscriptions(uid) {
  const items = await store.listSubscriptions(uid);
  return { items };
}

export async function saveSubscriptions(uid, items) {
  const saved = await store.replaceSubscriptions(uid, items);
  return { items: saved };
}
