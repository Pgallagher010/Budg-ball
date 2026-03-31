import { z } from "zod";

// Centralized request schemas.
// If API contracts change, update this file first and route validation follows automatically.
export const userSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  displayName: z.string().min(1).max(60),
});

export const goalSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly"]),
  targetAmount: z.number().positive(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const goalUpdateSchema = z.object({
  targetAmount: z.number().positive().optional(),
  progressAmount: z.number().nonnegative().optional(),
  status: z.enum(["active", "completed", "failed"]).optional(),
});

export const budgetSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  // Keep categories aligned with frontend chart/grouping options.
  category: z.enum([
    "food",
    "transport",
    "entertainment",
    "books",
    "subscriptions",
    "other",
  ]),
  limitAmount: z.number().positive(),
});

export const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum([
    "food",
    "transport",
    "entertainment",
    "books",
    "subscriptions",
    "other",
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(200).optional(),
});

export const friendRequestSchema = z.object({
  toUid: z.string().min(1),
});

export const subscriptionBulkSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        monthlyAmount: z.number().positive(),
      })
    )
    .max(50),
});

export const userPreferencesSchema = z.object({
  species: z.enum(["cat", "fox", "panda", "monkey"]),
  colorTheme: z.enum(["sand", "orange", "pink", "mint", "lavender", "slate"]),
  weeklyBudget: z.number().nonnegative(),
});

export const shopPurchaseSchema = z.object({
  sku: z.string().min(1).max(64),
});

// Dev-only utilities (used for local testing)
export const devSetCoinsSchema = z.object({
  coins: z.number().int().nonnegative(),
});
