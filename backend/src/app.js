import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";
import goalsRoutes from "./routes/goals.js";
import budgetsRoutes from "./routes/budgets.js";
import expensesRoutes from "./routes/expenses.js";
import friendsRoutes from "./routes/friends.js";
import dashboardRoutes from "./routes/dashboard.js";
import secureRoutes from "./routes/secure.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import shopRoutes from "./routes/shop.js";
import rewardsRoutes from "./routes/rewards.js";
import devRoutes from "./routes/dev.js";

// Central app wiring: middleware first, then public routes, then protected routes.
const app = express();

// CORS is kept strict to a single frontend origin for safer browser usage.
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Health stays public so uptime checks never require authentication.
app.use("/health", healthRoutes);

// All /api routes are authenticated by default.
app.use("/api", requireAuth);
app.use("/api/users", usersRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/secure", secureRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
