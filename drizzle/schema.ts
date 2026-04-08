import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Core identification
  title: varchar("title", { length: 255 }).notNull(),
  assetType: mysqlEnum("assetType", ["real_estate", "vehicle", "gold", "stocks"]).notNull(),
  investmentGoal: mysqlEnum("investmentGoal", ["investment", "residence", "daily_use", "value_preservation"]).notNull(),
  budgetMin: decimal("budgetMin", { precision: 15, scale: 2 }),
  budgetMax: decimal("budgetMax", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("SAR"),

  // Asset-specific input data (JSON)
  inputData: json("inputData").notNull(),

  // Analysis status
  status: mysqlEnum("status", ["pending", "analyzing", "completed", "failed"]).default("pending").notNull(),

  // The 5 analysis engines results (JSON)
  economicAnalysis: json("economicAnalysis"),
  financialAnalysis: json("financialAnalysis"),
  comparativeAnalysis: json("comparativeAnalysis"),
  legalAnalysis: json("legalAnalysis"),
  productivityAnalysis: json("productivityAnalysis"),

  // Final verdict
  finalDecision: mysqlEnum("finalDecision", ["execute", "do_not_execute", "wait"]),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  executiveSummary: text("executiveSummary"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;
