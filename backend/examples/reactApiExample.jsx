import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function fetchDashboardSummary() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be signed in.");
  const token = await currentUser.getIdToken();

  const response = await fetch("http://localhost:4000/api/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message || "Failed to fetch dashboard summary.");
  }
  return payload.data;
}

export async function checkSecureRoute() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be signed in.");
  const token = await currentUser.getIdToken();

  const response = await fetch("http://localhost:4000/api/secure/ping", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message || "Secure API check failed.");
  }
  return payload.data;
}
