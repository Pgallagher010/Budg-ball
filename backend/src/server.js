import app from "./app.js";
import { env } from "./config/env.js";
import { firebaseReady } from "./config/firebase.js";

// Thin bootstrap file so app wiring can be imported directly in tests.
app.listen(env.port, () => {
  const dbMode = firebaseReady ? "Firebase" : "Memory DB";
  console.log(`Budg'Ball backend listening on port ${env.port} (${dbMode})`);
});
