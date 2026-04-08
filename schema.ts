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

// Market Data Cache - for caching live market prices
export const marketDataCache = mysqlTable("market_data_cache", {
  id: int("id").autoincrement().primaryKey(),
  assetType: mysqlEnum("assetType", ["real_estate", "vehicle", "gold", "stocks"]).notNull(),
  assetIdentifier: varchar("assetIdentifier", { length: 100 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }),
  priceChange24h: decimal("priceChange24h", { precision: 15, scale: 2 }),
  priceChangePercent24h: decimal("priceChangePercent24h", { precision: 8, scale: 4 }),
  metadata: json("metadata"),
  source: varchar("source", { length: 100 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type MarketDataCache = typeof marketDataCache.$inferSelect;
export type InsertMarketDataCache = typeof marketDataCache.$inferInsert;

// Price Alerts - user price alerts
export const priceAlerts = mysqlTable("price_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assetType: mysqlEnum("assetType", ["real_estate", "vehicle", "gold", "stocks"]).notNull(),
  assetIdentifier: varchar("assetIdentifier", { length: 100 }).notNull(),
  alertType: mysqlEnum("alertType", ["price_above", "price_below", "percent_change"]).notNull(),
  targetValue: decimal("targetValue", { precision: 15, scale: 2 }).notNull(),
  currentPriceWhenSet: decimal("currentPriceWhenSet", { precision: 15, scale: 2 }),
  notes: text("notes"),
  isActive: int("isActive").default(1).notNull(),
  triggerCount: int("triggerCount").default(0),
  triggeredAt: timestamp("triggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

// Notifications - user notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isRead: int("isRead").default(0).notNull(),
  relatedAlertId: int("relatedAlertId"),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
