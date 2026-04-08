import { z } from "zod";
import {
  createAnalysis,
  getAnalysesByUser,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  getAnalysisStats,
} from "./db";
import { runFullAnalysis } from "./analysisEngine";
import { notifyOwner } from "./notification";

// Simple stub implementations for missing modules
const COOKIE_NAME = "investment_engine_session";

function getSessionCookieOptions(req: any) {
  const isSecure = req?.protocol === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

// Placeholder router and procedure definitions
const router = (routes: any) => routes;
const publicProcedure = {
  query: (fn: any) => fn,
  mutation: (fn: any) => fn,
};
const protectedProcedure = {
  input: (schema: any) => ({
    query: (fn: any) => fn,
    mutation: (fn: any) => fn,
  }),
  query: (fn: any) => fn,
  mutation: (fn: any) => fn,
};

const systemRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),
});

const inputDataSchema = z.record(z.string(), z.any());

const createAnalysisInput = z.object({
  title: z.string().min(1),
  assetType: z.enum(["real_estate", "vehicle", "gold", "stocks"]),
  investmentGoal: z.enum(["investment", "residence", "daily_use", "value_preservation"]),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  currency: z.string().default("SAR"),
  inputData: inputDataSchema,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  analysis: router({
    // Create a new analysis and trigger the AI engines
    create: protectedProcedure
      .input(createAnalysisInput)
      .mutation(async ({ ctx, input }) => {
        const id = await createAnalysis({
          userId: ctx.user.id,
          title: input.title,
          assetType: input.assetType,
          investmentGoal: input.investmentGoal,
          budgetMin: input.budgetMin?.toString(),
          budgetMax: input.budgetMax?.toString(),
          currency: input.currency,
          inputData: input.inputData,
          status: "analyzing",
        });

        // Run analysis asynchronously
        runFullAnalysis({
          title: input.title,
          assetType: input.assetType,
          investmentGoal: input.investmentGoal,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          currency: input.currency,
          inputData: input.inputData,
        })
          .then(async (report) => {
            await updateAnalysis(id, {
              status: "completed",
              economicAnalysis: report.economicAnalysis,
              financialAnalysis: report.financialAnalysis,
              comparativeAnalysis: report.comparativeAnalysis,
              legalAnalysis: report.legalAnalysis,
              productivityAnalysis: report.productivityAnalysis,
              finalDecision: report.finalDecision,
              confidenceScore: report.confidenceScore.toString(),
              executiveSummary: report.executiveSummary,
              completedAt: new Date(),
            });

            // Notify owner
            const decisionLabel =
              report.finalDecision === "execute"
                ? "تنفيذ"
                : report.finalDecision === "do_not_execute"
                ? "عدم التنفيذ"
                : "تريث";
            await notifyOwner({
              title: `Investment Analysis Complete: ${input.title}`,
              content: `Analysis for "${input.title}" (${input.assetType}) completed. Decision: ${decisionLabel}. Score: ${report.confidenceScore.toFixed(1)}%.`,
            });
          })
          .catch(async (err) => {
            console.error("[Analysis] Failed:", err);
            await updateAnalysis(id, { status: "failed" });
          });

        return { id, status: "analyzing" };
      }),

    // List analyses for current user
    list: protectedProcedure
      .input(
        z.object({
          assetType: z.enum(["real_estate", "vehicle", "gold", "stocks"]).optional(),
          search: z.string().optional(),
          dateFrom: z.string().optional(), // ISO date string
          dateTo: z.string().optional(),   // ISO date string
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getAnalysesByUser(ctx.user.id, {
          ...input,
          dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
          dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
        });
      }),

    // Get single analysis by ID
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.id, ctx.user.id);
        if (!analysis) throw new Error("Analysis not found");
        return analysis;
      }),

    // Delete analysis
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAnalysis(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get dashboard stats
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getAnalysisStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
