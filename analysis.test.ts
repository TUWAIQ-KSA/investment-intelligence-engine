import { describe, expect, it } from "vitest";
import { User } from "./schema";

// Define the TrpcContext type locally for tests
interface TrpcContext {
  user: User | null;
  req: { protocol: string; headers: Record<string, any> };
  res: { clearCookie: (name: string, options?: any) => void };
}

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => {} },
  };

  return { ctx };
}

describe("analysis router", () => {
  it("schema exports required tables", () => {
    // Test that the schema exports all required tables
    const schema = require("./schema");
    expect(schema.users).toBeDefined();
    expect(schema.analyses).toBeDefined();
    expect(schema.marketDataCache).toBeDefined();
    expect(schema.priceAlerts).toBeDefined();
    expect(schema.notifications).toBeDefined();
  });

  it("notification module exports notifyOwner", () => {
    const notification = require("./notification");
    expect(typeof notification.notifyOwner).toBe("function");
  });

  it("learningEngine exports required functions", () => {
    const learningEngine = require("./learningEngine");
    expect(typeof learningEngine.optimizeWeights).toBe("function");
    expect(typeof learningEngine.calculateWeightedScore).toBe("function");
  });

  it("marketDataService exports required functions", () => {
    const marketDataService = require("./marketDataService");
    expect(typeof marketDataService.fetchGoldPrices).toBe("function");
    expect(typeof marketDataService.fetchStockPrice).toBe("function");
    expect(typeof marketDataService.fetchRealEstateIndex).toBe("function");
  });

  it("priceAlertService exports required functions", () => {
    const priceAlertService = require("./priceAlertService");
    expect(typeof priceAlertService.checkAllAlerts).toBe("function");
    expect(typeof priceAlertService.createPriceAlert).toBe("function");
  });

  it("analysisEngine exports runFullAnalysis", () => {
    const analysisEngine = require("./analysisEngine");
    expect(typeof analysisEngine.runFullAnalysis).toBe("function");
  });
});
