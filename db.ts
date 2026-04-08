import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, analyses, InsertAnalysis, Analysis } from "./schema";

// Environment interface
interface Environment {
  ownerOpenId?: string;
}

const ENV: Environment = {
  ownerOpenId: process.env.OWNER_OPEN_ID,
};

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Analysis helpers ----

export async function createAnalysis(data: InsertAnalysis): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analyses).values(data);
  return (result[0] as any).insertId as number;
}

export async function getAnalysesByUser(
  userId: number,
  filters?: { assetType?: string; search?: string; dateFrom?: Date; dateTo?: Date; limit?: number; offset?: number }
): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(analyses.userId, userId)];
  if (filters?.assetType) {
    conditions.push(eq(analyses.assetType, filters.assetType as any));
  }
  if (filters?.search) {
    conditions.push(like(analyses.title, `%${filters.search}%`));
  }
  if (filters?.dateFrom) {
    conditions.push(sql`${analyses.createdAt} >= ${filters.dateFrom}`);
  }
  if (filters?.dateTo) {
    conditions.push(sql`${analyses.createdAt} <= ${filters.dateTo}`);
  }

  return db
    .select()
    .from(analyses)
    .where(and(...conditions))
    .orderBy(desc(analyses.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
}

export async function getAnalysisById(id: number, userId: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateAnalysis(id: number, data: Partial<InsertAnalysis>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(analyses).set(data).where(eq(analyses.id, id));
}

export async function deleteAnalysis(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(analyses).where(and(eq(analyses.id, id), eq(analyses.userId, userId)));
}

export async function getAnalysisStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, pending: 0 };
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN status IN ('pending','analyzing') THEN 1 ELSE 0 END)`,
    })
    .from(analyses)
    .where(eq(analyses.userId, userId));
  return result[0] ?? { total: 0, completed: 0, pending: 0 };
}
