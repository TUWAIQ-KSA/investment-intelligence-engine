/**
 * Learning Engine - نظام التعلم من القرارات الاستثمارية
 * يحلل نتائج التحليلات السابقة ويُحسّن أوزان المحركات تلقائياً
 */

import { getDb } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";
import { analyses } from "../drizzle/schema";

interface WeightAdjustment {
  engine: string;
  oldWeight: number;
  newWeight: number;
  reason: string;
}

interface LearningResult {
  adjustedWeights: Record<string, number>;
  adjustments: WeightAdjustment[];
  confidence: number;
  pattern: string;
}

interface HistoricalPattern {
  assetType: string;
  investmentGoal: string;
  avgScore: number;
  successRate: number;
  dominantEngine: string;
  sampleSize: number;
}

// الأوزان الافتراضية
const DEFAULT_WEIGHTS = {
  economic: 0.20,
  financial: 0.30,
  comparative: 0.20,
  legal: 0.15,
  productivity: 0.15,
};

// الحد الأدنى والأقصى للأوزان
const WEIGHT_BOUNDS = {
  min: 0.10,
  max: 0.40,
};

/**
 * يحلل الأنماط التاريخية لكل نوع أصل وهدف استثماري
 */
export async function analyzeHistoricalPatterns(
  assetType: string,
  investmentGoal: string
): Promise<HistoricalPattern | null> {
  const db = await getDb();
  if (!db) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await db
    .select()
    .from(analyses)
    .where(
      and(
        eq(analyses.assetType, assetType as any),
        eq(analyses.investmentGoal, investmentGoal as any),
        eq(analyses.status, "completed"),
        gte(analyses.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(analyses.createdAt));

  if (results.length < 5) return null;

  const scores = results.map(r => parseFloat(r.confidenceScore || "0"));
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  const successCount = scores.filter(s => s >= 70).length;
  const successRate = (successCount / scores.length) * 100;

  const engineScores: Record<string, number[]> = {
    economic: [],
    financial: [],
    comparative: [],
    legal: [],
    productivity: [],
  };

  results.forEach(r => {
    if (r.economicAnalysis) engineScores.economic.push((r.economicAnalysis as any).score);
    if (r.financialAnalysis) engineScores.financial.push((r.financialAnalysis as any).score);
    if (r.comparativeAnalysis) engineScores.comparative.push((r.comparativeAnalysis as any).score);
    if (r.legalAnalysis) engineScores.legal.push((r.legalAnalysis as any).score);
    if (r.productivityAnalysis) engineScores.productivity.push((r.productivityAnalysis as any).score);
  });

  const avgEngineScores = Object.entries(engineScores).map(([engine, scores]) => ({
    engine,
    avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
  }));

  const dominantEngine = avgEngineScores.sort((a, b) => b.avg - a.avg)[0]?.engine || "financial";

  return {
    assetType,
    investmentGoal,
    avgScore,
    successRate,
    dominantEngine,
    sampleSize: results.length,
  };
}

/**
 * يُحسّن الأوزان بناءً على الأنماط التاريخية
 */
export async function optimizeWeights(
  assetType: string,
  investmentGoal: string,
  currentWeights: Record<string, number> = DEFAULT_WEIGHTS
): Promise<LearningResult> {
  const pattern = await analyzeHistoricalPatterns(assetType, investmentGoal);
  
  if (!pattern || pattern.sampleSize < 10) {
    return {
      adjustedWeights: currentWeights,
      adjustments: [],
      confidence: 0,
      pattern: "بيانات غير كافية للتعلم",
    };
  }

  const adjustments: WeightAdjustment[] = [];
  const newWeights = { ...currentWeights };

  // قاعدة 1: إذا كان المحرك المالي هو الأكثر تأثيراً في النجاحات، زد وزنه
  if (pattern.dominantEngine === "financial" && pattern.successRate > 60) {
    const increase = Math.min(0.05, WEIGHT_BOUNDS.max - newWeights.financial);
    if (increase > 0) {
      newWeights.financial += increase;
      const sorted = Object.entries(newWeights).sort((a, b) => a[1] - b[1]);
      const [weakestEngine, weakestWeight] = sorted[0];
      if (weakestWeight - increase >= WEIGHT_BOUNDS.min) {
        newWeights[weakestEngine] -= increase;
      }
      
      adjustments.push({
        engine: "financial",
        oldWeight: currentWeights.financial,
        newWeight: newWeights.financial,
        reason: `المحرك المالي الأكثر تأثيراً في ${pattern.successRate.toFixed(0)}% من النجاحات`,
      });
    }
  }

  // قاعدة 2: إذا كان معدل النجاح منخفضاً للعقارات، زد وزن التحليل القانوني
  if (assetType === "real_estate" && pattern.successRate < 50) {
    const increase = Math.min(0.03, WEIGHT_BOUNDS.max - newWeights.legal);
    if (increase > 0) {
      newWeights.legal += increase;
      const sorted = Object.entries(newWeights).sort((a, b) => a[1] - b[1]);
      const [weakestEngine, weakestWeight] = sorted[0];
      if (weakestEngine !== "legal" && weakestWeight - increase >= WEIGHT_BOUNDS.min) {
        newWeights[weakestEngine] -= increase;
      }
      
      adjustments.push({
        engine: "legal",
        oldWeight: currentWeights.legal,
        newWeight: newWeights.legal,
        reason: "معدل نجاح منخفض في العقارات يتطلب تحليل قانوني أعمق",
      });
    }
  }

  // قاعدة 3: للاستثمار طويل الأجل، زد وزن التحليل الاقتصادي
  if (investmentGoal === "investment") {
    const increase = Math.min(0.02, WEIGHT_BOUNDS.max - newWeights.economic);
    if (increase > 0) {
      newWeights.economic += increase;
      const sorted = Object.entries(newWeights).sort((a, b) => a[1] - b[1]);
      const [weakestEngine, weakestWeight] = sorted[0];
      if (weakestEngine !== "economic" && weakestWeight - increase >= WEIGHT_BOUNDS.min) {
        newWeights[weakestEngine] -= increase;
      }
      
      adjustments.push({
        engine: "economic",
        oldWeight: currentWeights.economic,
        newWeight: newWeights.economic,
        reason: "الاستثمار يتطلب نظرة اقتصادية طويلة المدى",
      });
    }
  }

  // قاعدة 4: للاستخدام اليومي (سيارات)، زد وزن الإنتاجية
  if (assetType === "vehicle" && investmentGoal === "daily_use") {
    const increase = Math.min(0.04, WEIGHT_BOUNDS.max - newWeights.productivity);
    if (increase > 0) {
      newWeights.productivity += increase;
      const sorted = Object.entries(newWeights).sort((a, b) => a[1] - b[1]);
      const [weakestEngine, weakestWeight] = sorted[0];
      if (weakestEngine !== "productivity" && weakestWeight - increase >= WEIGHT_BOUNDS.min) {
        newWeights[weakestEngine] -= increase;
      }
      
      adjustments.push({
        engine: "productivity",
        oldWeight: currentWeights.productivity,
        newWeight: newWeights.productivity,
        reason: "الاستخدام اليومي للسيارات يتطلب تقييم إنتاجية عالي",
      });
    }
  }

  // تطبيع الأوزان لتصبح مجموعها 1.0
  const totalWeight = Object.values(newWeights).reduce((a, b) => a + b, 0);
  const normalizedWeights: Record<string, number> = {};
  Object.entries(newWeights).forEach(([key, value]) => {
    normalizedWeights[key] = Math.round((value / totalWeight) * 100) / 100;
  });

  const confidence = Math.min(100, pattern.sampleSize * 5 + pattern.successRate * 0.5);

  return {
    adjustedWeights: normalizedWeights,
    adjustments,
    confidence,
    pattern: `نمط مكتشف: ${pattern.dominantEngine} هو المحرك الأكثر تأثيراً في ${pattern.assetType} للـ ${pattern.investmentGoal}`,
  };
}

/**
 * يحسب الدرجة المرجحة باستخدام الأوزن المُحسّنة
 */
export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  Object.entries(scores).forEach(([engine, score]) => {
    weightedSum += score * (weights[engine] || DEFAULT_WEIGHTS[engine as keyof typeof DEFAULT_WEIGHTS]);
  });
  return Math.round(weightedSum * 100) / 100;
}

/**
 * يسجل نتيجة قرار سابق للتعلم المستقبلي
 */
export async function recordOutcome(
  analysisId: number,
  actualOutcome: "profitable" | "break_even" | "loss",
  userFeedback?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(analyses)
    .set({
      executiveSummary: `${userFeedback || ""} [Outcome: ${actualOutcome}]`,
    } as any)
    .where(eq(analyses.id, analysisId));
}

/**
 * يولد تقرير أداء المحركات
 */
export async function generateEnginePerformanceReport(): Promise<{
  engine: string;
  avgScore: number;
  impact: number;
  trend: "up" | "down" | "stable";
}[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(analyses)
    .where(eq(analyses.status, "completed"))
    .orderBy(desc(analyses.createdAt))
    .limit(100);

  const engineStats: Record<string, { scores: number[]; finalScores: number[] }> = {
    economic: { scores: [], finalScores: [] },
    financial: { scores: [], finalScores: [] },
    comparative: { scores: [], finalScores: [] },
    legal: { scores: [], finalScores: [] },
    productivity: { scores: [], finalScores: [] },
  };

  results.forEach(r => {
    const finalScore = parseFloat(r.confidenceScore || "0");
    if (r.economicAnalysis) {
      engineStats.economic.scores.push((r.economicAnalysis as any).score);
      engineStats.economic.finalScores.push(finalScore);
    }
    if (r.financialAnalysis) {
      engineStats.financial.scores.push((r.financialAnalysis as any).score);
      engineStats.financial.finalScores.push(finalScore);
    }
    if (r.comparativeAnalysis) {
      engineStats.comparative.scores.push((r.comparativeAnalysis as any).score);
      engineStats.comparative.finalScores.push(finalScore);
    }
    if (r.legalAnalysis) {
      engineStats.legal.scores.push((r.legalAnalysis as any).score);
      engineStats.legal.finalScores.push(finalScore);
    }
    if (r.productivityAnalysis) {
      engineStats.productivity.scores.push((r.productivityAnalysis as any).score);
      engineStats.productivity.finalScores.push(finalScore);
    }
  });

  return Object.entries(engineStats).map(([engine, data]) => {
    const avgScore = data.scores.length > 0 
      ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
      : 0;
    
    const impact = data.finalScores.length > 0
      ? Math.abs(avgScore - (data.finalScores.reduce((a, b) => a + b, 0) / data.finalScores.length))
      : 0;

    return {
      engine,
      avgScore: Math.round(avgScore * 100) / 100,
      impact: Math.round(impact * 100) / 100,
      trend: avgScore > 70 ? "up" : avgScore < 50 ? "down" : "stable",
    };
  });
}
