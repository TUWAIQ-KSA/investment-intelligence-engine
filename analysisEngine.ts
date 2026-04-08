import { optimizeWeights, calculateWeightedScore } from "./learningEngine";
import { generateMarketContext, compareWithMarket } from "./marketDataService";

// LLM interface for AI analysis
interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  response_format?: {
    type: string;
    json_schema?: any;
  };
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

/**
 * Invokes the LLM for investment analysis
 * In production, this would connect to OpenAI or similar API
 */
async function invokeLLM(request: LLMRequest): Promise<LLMResponse> {
  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("[LLM] OpenAI API key not configured, returning mock response");
    // Return a mock response for development/testing
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            score: 65,
            summary: "تحليل تجريبي - يرجى تكوين مفتاح API للحصول على تحليل حقيقي",
            strengths: ["نقطة قوة تجريبية 1", "نقطة قوة تجريبية 2"],
            weaknesses: ["نقطة ضعف تجريبية 1"],
            details: {
              marketCondition: "مستقر",
              riskLevel: "متوسط",
              recommendation: "يُنصح بمراجعة التحليل مع خبير"
            }
          })
        }
      }]
    };
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: request.messages,
        response_format: request.response_format,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LLM] API error:", response.status, errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[LLM] Request timed out after 60 seconds");
      throw new Error("LLM request timed out");
    }
    console.error("[LLM] Request failed:", error);
    throw error;
  }
}

export interface AnalysisInput {
  title: string;
  assetType: "real_estate" | "vehicle" | "gold" | "stocks";
  investmentGoal: "investment" | "residence" | "daily_use" | "value_preservation";
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  inputData: Record<string, any>;
}

export interface EngineResult {
  score: number; // 0-100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  details: Record<string, any>;
}

export interface FinalReport {
  economicAnalysis: EngineResult;
  financialAnalysis: EngineResult;
  comparativeAnalysis: EngineResult;
  legalAnalysis: EngineResult;
  productivityAnalysis: EngineResult;
  finalDecision: "execute" | "do_not_execute" | "wait";
  confidenceScore: number;
  executiveSummary: string;
  // Learning enhancements
  learningApplied: boolean;
  weightAdjustments: Array<{
    engine: string;
    oldWeight: number;
    newWeight: number;
    reason: string;
  }>;
  marketContext: string;
  marketComparison?: {
    isFairPrice: boolean;
    marketPrice: number;
    userPrice: number;
    variance: number;
    recommendation: string;
  };
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "عقار",
  vehicle: "سيارة",
  gold: "ذهب",
  stocks: "أسهم",
};

const GOAL_LABELS: Record<string, string> = {
  investment: "استثمار",
  residence: "سكن",
  daily_use: "استخدام يومي",
  value_preservation: "حفظ قيمة",
};

// Default weights - will be optimized by learning engine
const DEFAULT_WEIGHTS = {
  economic: 0.20,
  financial: 0.30,
  comparative: 0.20,
  legal: 0.15,
  productivity: 0.15,
};

async function runEngine(
  systemPrompt: string,
  userPrompt: string,
  marketContext: string = ""
): Promise<EngineResult> {
  const fullPrompt = marketContext 
    ? `${userPrompt}\n\n${marketContext}`
    : userPrompt;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: fullPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "engine_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: { type: "number", description: "Score from 0 to 100" },
            summary: { type: "string", description: "Arabic summary paragraph" },
            strengths: { type: "array", items: { type: "string" }, description: "List of strengths in Arabic" },
            weaknesses: { type: "array", items: { type: "string" }, description: "List of weaknesses in Arabic" },
            details: {
              type: "object",
              properties: {
                marketCondition: { type: "string" },
                riskLevel: { type: "string" },
                recommendation: { type: "string" },
              },
              required: ["marketCondition", "riskLevel", "recommendation"],
              additionalProperties: false,
            },
          },
          required: ["score", "summary", "strengths", "weaknesses", "details"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

export async function runFullAnalysis(input: AnalysisInput): Promise<FinalReport> {
  const assetLabel = ASSET_TYPE_LABELS[input.assetType] || input.assetType;
  const goalLabel = GOAL_LABELS[input.investmentGoal] || input.investmentGoal;
  const budget = input.budgetMax
    ? `${input.budgetMin?.toLocaleString() ?? "غير محدد"} - ${input.budgetMax.toLocaleString()} ${input.currency ?? "SAR"}`
    : `${input.budgetMin?.toLocaleString() ?? "غير محدد"} ${input.currency ?? "SAR"}`;

  // 1. Fetch market data context
  const marketContext = await generateMarketContext(input.assetType, input.inputData);

  // 2. Compare with market prices
  const marketComparison = await compareWithMarket(input.assetType, input.inputData);

  // 3. Optimize weights using learning engine
  const learningResult = await optimizeWeights(input.assetType, input.investmentGoal, DEFAULT_WEIGHTS);
  const weights = learningResult.adjustedWeights;

  const baseContext = `
نوع الأصل: ${assetLabel}
الهدف من الاستثمار: ${goalLabel}
الميزانية: ${budget}
عنوان الفرصة: ${input.title}
البيانات التفصيلية: ${JSON.stringify(input.inputData, null, 2)}
`;

  const SYSTEM_BASE = `أنت محلل استثماري خبير متخصص في السوق السعودي. تحدث دائماً بالعربية الفصحى. قدّم تحليلاً دقيقاً ومبنياً على بيانات السوق الحالية. كن صريحاً في تحديد المخاطر والفرص. لا تتحيز للإيجابية أو السلبية، بل كن موضوعياً.`;

  // Run all 5 engines in parallel with market context
  const [economic, financial, comparative, legal, productivity] = await Promise.all([
    // Engine 1: Economic Analysis
    runEngine(
      `${SYSTEM_BASE} أنت متخصص في التحليل الاقتصادي الكلي والجزئي للسوق السعودي.`,
      `قم بتحليل اقتصادي شامل للفرصة الاستثمارية التالية:
${baseContext}
حلل: حالة السوق الحالية، دورة القطاع، اتجاهات العرض والطلب، تأثير التضخم وأسعار الفائدة، توقعات السوق خلال 3-5 سنوات في المملكة العربية السعودية. أعطِ درجة من 100 تعكس جاذبية الفرصة اقتصادياً.`,
      marketContext
    ),

    // Engine 2: Financial Analysis
    runEngine(
      `${SYSTEM_BASE} أنت متخصص في التحليل المالي والاستثماري وحساب مؤشرات العائد.`,
      `قم بتحليل مالي شامل للفرصة الاستثمارية التالية:
${baseContext}
احسب تقديرياً: العائد على الاستثمار (ROI)، معدل العائد الداخلي (IRR)، فترة الاسترداد، التدفقات النقدية المتوقعة، مقارنة التسعير بمتوسط السوق (هل مقومة بأقل أو أعلى من قيمتها؟). أعطِ درجة من 100 تعكس الجدوى المالية.`,
      marketContext + (marketComparison ? `\n\nمقارنة السعر بالسوق:\n${marketComparison.recommendation}` : "")
    ),

    // Engine 3: Comparative Analysis
    runEngine(
      `${SYSTEM_BASE} أنت متخصص في تحليل السوق ومقارنة الفرص الاستثمارية البديلة.`,
      `قم بتحليل مقارن للفرصة الاستثمارية التالية:
${baseContext}
ابحث عن أفضل 3 بدائل متاحة في السوق السعودي بنفس النطاق السعري والفئة. قارن المزايا والعيوب. هل هذه الفرصة هي الأفضل في سوقها؟ ما هي نقاط تميزها وضعفها مقارنة بالبدائل؟ أعطِ درجة من 100 تعكس تنافسية الفرصة.`,
      marketContext
    ),

    // Engine 4: Legal Analysis
    runEngine(
      `${SYSTEM_BASE} أنت متخصص في التحليل القانوني والتنظيمي للاستثمارات في المملكة العربية السعودية.`,
      `قم بتحليل قانوني وتنظيمي للفرصة الاستثمارية التالية:
${baseContext}
حلل: الوضع القانوني للأصل، المستندات المطلوبة، المخاطر التنظيمية، قيود الملكية، الضرائب والرسوم المتوقعة، التغييرات التنظيمية المحتملة في المملكة العربية السعودية. أعطِ درجة من 100 تعكس سلامة الوضع القانوني.`,
      ""
    ),

    // Engine 5: Productivity & End-Use Analysis
    runEngine(
      `${SYSTEM_BASE} أنت متخصص في تحليل إنتاجية الأصول وملاءمتها للاستخدام النهائي.`,
      `قم بتحليل إنتاجية واستخدام الفرصة الاستثمارية التالية:
${baseContext}
حلل: مدى ملاءمة الأصل للهدف المحدد، جودة الخدمات المحيطة (للعقار: مدارس، مستشفيات، طرق)، سهولة التسييل (Liquidity)، تكاليف الصيانة والتشغيل، القيمة الاستخدامية مقابل القيمة الاستثمارية. أعطِ درجة من 100 تعكس الإنتاجية والملاءمة.`,
      ""
    ),
  ]);

  // Calculate weighted final score using optimized weights
  const scores = {
    economic: economic.score,
    financial: financial.score,
    comparative: comparative.score,
    legal: legal.score,
    productivity: productivity.score,
  };

  const weightedScore = calculateWeightedScore(scores, weights);

  // Determine final decision
  let finalDecision: "execute" | "do_not_execute" | "wait";
  if (weightedScore >= 70) finalDecision = "execute";
  else if (weightedScore >= 45) finalDecision = "wait";
  else finalDecision = "do_not_execute";

  // Generate executive summary with learning insights
  const summaryResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `${SYSTEM_BASE} أنت تكتب ملخصاً تنفيذياً احترافياً لتقرير استثماري.`,
      },
      {
        role: "user",
        content: `بناءً على التحليل الشامل للفرصة الاستثمارية "${input.title}" (${assetLabel} - ${goalLabel}):

نتائج المحركات الخمسة:
- التحليل الاقتصادي: ${economic.score}/100 - ${economic.summary}
- التحليل المالي: ${financial.score}/100 - ${financial.summary}
- التحليل المقارن: ${comparative.score}/100 - ${comparative.summary}
- التحليل القانوني: ${legal.score}/100 - ${legal.summary}
- تحليل الإنتاجية: ${productivity.score}/100 - ${productivity.summary}

الدرجة المرجحة النهائية: ${weightedScore.toFixed(1)}/100
الأوزان المستخدمة: اقتصادي ${(weights.economic * 100).toFixed(0)}%، مالي ${(weights.financial * 100).toFixed(0)}%، مقارن ${(weights.comparative * 100).toFixed(0)}%، قانوني ${(weights.legal * 100).toFixed(0)}%، إنتاجية ${(weights.productivity * 100).toFixed(0)}%

مقارنة السعر بالسوق: ${marketComparison?.recommendation || "غير متوفر"}

القرار: ${finalDecision === "execute" ? "تنفيذ" : finalDecision === "do_not_execute" ? "عدم التنفيذ" : "تريث"}

اكتب ملخصاً تنفيذياً احترافياً بالعربية الفصحى في 3-4 جمل يلخص الفرصة وأبرز نقاط القوة والضعف والقرار النهائي مع مبرراته.`,
      },
    ],
  });

  const executiveSummary =
    typeof summaryResponse.choices[0].message.content === "string"
      ? summaryResponse.choices[0].message.content
      : "";

  return {
    economicAnalysis: economic,
    financialAnalysis: financial,
    comparativeAnalysis: comparative,
    legalAnalysis: legal,
    productivityAnalysis: productivity,
    finalDecision,
    confidenceScore: Math.round(weightedScore * 100) / 100,
    executiveSummary,
    // Learning enhancements
    learningApplied: learningResult.adjustments.length > 0,
    weightAdjustments: learningResult.adjustments,
    marketContext,
    marketComparison: marketComparison || undefined,
  };
}
