import { store } from "../data/store.js";

// Friend service centralizes request/accept rules so they are reusable.
export async function searchFriends(uid, query) {
  return store.searchUsers(query, uid);
}

export async function createFriendRequest(fromUid, toUid) {
  // Basic guardrails; for high concurrency consider transactional dedupe in Firestore.
  if (fromUid === toUid) return { error: "You cannot add yourself." };

  const existing = await store.listFriendRequests(toUid);
  const duplicate = existing.find((r) => r.fromUid === fromUid && r.toUid === toUid);
  if (duplicate) return { error: "Friend request already pending." };

  const request = await store.createFriendRequest(fromUid, toUid);
  return { request };
}

export async function listIncomingFriendRequests(uid) {
  return store.listFriendRequests(uid);
}

export async function acceptFriendRequest(uid, requestId) {
  return store.acceptFriendRequest(uid, requestId);
}

export async function listFriends(uid) {
  return store.listFriends(uid);
}
