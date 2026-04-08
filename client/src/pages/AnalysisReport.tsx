import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight, BarChart3, CheckCircle2, AlertCircle, Clock,
  TrendingUp, Scale, Lightbulb, Building2, Car, Coins,
  RefreshCw, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface EngineResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  details: {
    marketCondition: string;
    riskLevel: string;
    recommendation: string;
  };
}

const ASSET_LABELS: Record<string, string> = {
  real_estate: "عقار",
  vehicle: "سيارة",
  gold: "ذهب",
  stocks: "أسهم",
};

const GOAL_LABELS: Record<string, string> = {
  investment: "استثمار وتأجير",
  residence: "سكن شخصي",
  daily_use: "استخدام يومي",
  value_preservation: "حفظ قيمة",
};

const ENGINES = [
  {
    key: "economicAnalysis",
    title: "التحليل الاقتصادي",
    subtitle: "الاقتصاد الكلي والجزئي",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
    weight: "20%",
  },
  {
    key: "financialAnalysis",
    title: "التحليل المالي",
    subtitle: "ROI، IRR، التدفقات النقدية",
    icon: BarChart3,
    color: "text-green-600",
    bg: "bg-green-50",
    weight: "30%",
  },
  {
    key: "comparativeAnalysis",
    title: "التحليل المقارن",
    subtitle: "أفضل 3 بدائل في السوق",
    icon: Scale,
    color: "text-purple-600",
    bg: "bg-purple-50",
    weight: "20%",
  },
  {
    key: "legalAnalysis",
    title: "التحليل القانوني",
    subtitle: "الوضع التنظيمي والمستندات",
    icon: Scale,
    color: "text-orange-600",
    bg: "bg-orange-50",
    weight: "15%",
  },
  {
    key: "productivityAnalysis",
    title: "تحليل الإنتاجية",
    subtitle: "الملاءمة والتسييل",
    icon: Lightbulb,
    color: "text-teal-600",
    bg: "bg-teal-50",
    weight: "15%",
  },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-600" : "text-red-600";
  const bgColor = score >= 70 ? "bg-green-100" : score >= 45 ? "bg-yellow-100" : "bg-red-100";
  const strokeColor = score >= 70 ? "#16a34a" : score >= 45 ? "#ca8a04" : "#dc2626";
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`${bgColor} rounded-2xl p-4 flex flex-col items-center`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="50" y="55" textAnchor="middle" className="font-bold" style={{ fontSize: "18px", fill: strokeColor, fontFamily: "IBM Plex Sans Arabic" }}>
          {score.toFixed(0)}
        </text>
      </svg>
      <span className={`text-sm font-semibold ${color}`}>من 100</span>
    </div>
  );
}

function EngineCard({ engine, result }: { engine: typeof ENGINES[0]; result: EngineResult }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = engine.icon;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl ${engine.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${engine.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{engine.title}</h3>
                <p className="text-xs text-muted-foreground">{engine.subtitle} — وزن {engine.weight}</p>
              </div>
              <div className="text-left">
                <div className={`text-xl font-bold ${result.score >= 70 ? "text-green-600" : result.score >= 45 ? "text-yellow-600" : "text-red-600"}`}>
                  {result.score.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mb-3">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${result.score >= 70 ? "bg-green-500" : result.score >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{result.summary}</p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {result.strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 mb-1.5">نقاط القوة</h4>
                    <ul className="space-y-1">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-700 mb-1.5">نقاط الضعف</h4>
                    <ul className="space-y-1">
                      {result.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">حالة السوق:</span>
                    <span className="font-medium">{result.details.marketCondition}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">مستوى المخاطرة:</span>
                    <span className="font-medium">{result.details.riskLevel}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">التوصية:</span>
                    <span className="font-medium">{result.details.recommendation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisReport() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id ?? "0");

  const { data: analysis, isLoading, refetch } = trpc.analysis.byId.useQuery(
    { id },
    { refetchInterval: 5000 }
  );

  const deleteMutation = trpc.analysis.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف التحليل"); navigate("/"); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card h-16 flex items-center px-4">
          <Skeleton className="h-8 w-32" />
        </header>
        <main className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </main>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">التحليل غير موجود</p>
          <Button className="mt-4" onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const isAnalyzing = analysis.status === "analyzing" || analysis.status === "pending";
  const isCompleted = analysis.status === "completed";
  const isFailed = analysis.status === "failed";

  const DECISION_CONFIG = {
    execute: {
      label: "تنفيذ الصفقة",
      desc: "الفرصة مجدية استثمارياً وتستحق المضي قدماً",
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    },
    do_not_execute: {
      label: "لا تنفذ الصفقة",
      desc: "الفرصة غير مجدية في الوقت الحالي",
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    wait: {
      label: "تريث وأعد التقييم",
      desc: "الفرصة متوسطة وتحتاج مراجعة إضافية",
      icon: Clock,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
    },
  };

  const decisionConfig = analysis.finalDecision ? DECISION_CONFIG[analysis.finalDecision] : null;
  const score = analysis.confidenceScore ? parseFloat(analysis.confidenceScore) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowRight className="w-4 h-4 ml-1" />
              رجوع
            </Button>
            <div className="w-px h-5 bg-border" />
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-sm truncate">{analysis.title}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{ASSET_LABELS[analysis.assetType]}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{GOAL_LABELS[analysis.investmentGoal]}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => { if (confirm("هل تريد حذف هذا التحليل؟")) deleteMutation.mutate({ id }); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">

        {/* Analyzing State */}
        {isAnalyzing && (
          <Card className="border-0 shadow-sm mb-6 overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">جارٍ التحليل الاستثماري الشامل</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                يعمل النظام الآن على تشغيل المحركات الخمسة في آنٍ واحد:
                التحليل الاقتصادي، المالي، المقارن، القانوني، وتحليل الإنتاجية.
              </p>
              <div className="space-y-2 text-right">
                {ENGINES.map((e, i) => (
                  <div key={e.key} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary animate-pulse" : "bg-muted"}`} />
                    <span className="text-sm text-muted-foreground">{e.title}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/30 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-5">ستُحدَّث الصفحة تلقائياً عند اكتمال التحليل...</p>
            </CardContent>
          </Card>
        )}

        {/* Failed State */}
        {isFailed && (
          <Card className="border-0 shadow-sm border-red-200 mb-6">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="font-bold text-foreground mb-2">فشل التحليل</h2>
              <p className="text-sm text-muted-foreground mb-4">حدث خطأ أثناء تحليل الفرصة الاستثمارية.</p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Report */}
        {isCompleted && decisionConfig && (
          <>
            {/* Executive Decision Card */}
            <Card className={`border-2 ${decisionConfig.border} ${decisionConfig.bg} shadow-sm mb-6`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <ScoreGauge score={score} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${decisionConfig.badge} border-0 text-sm px-3 py-1`}>
                        {decisionConfig.label}
                      </Badge>
                    </div>
                    <p className={`text-sm ${decisionConfig.text} font-medium mb-3`}>{decisionConfig.desc}</p>
                    <div className={`text-xs ${decisionConfig.text} leading-relaxed`}>
                      <strong>نسبة الترجيح المرجحة: {score.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
                {analysis.executiveSummary && (
                  <div className="mt-4 pt-4 border-t border-current/10">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">الملخص التنفيذي</h3>
                    <p className="text-sm text-foreground leading-relaxed">{analysis.executiveSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">توزيع الدرجات بالأوزان</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {ENGINES.map((engine) => {
                    const result = (analysis as any)[engine.key] as EngineResult | null;
                    if (!result) return null;
                    return (
                      <div key={engine.key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{engine.title}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${result.score >= 70 ? "bg-green-500" : result.score >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8 text-left">{result.score.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground w-8">{engine.weight}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 5 Engine Cards */}
            <h2 className="font-bold text-foreground mb-4">تفاصيل المحركات التحليلية الخمسة</h2>
            <div className="space-y-4">
              {ENGINES.map((engine) => {
                const result = (analysis as any)[engine.key] as EngineResult | null;
                if (!result) return null;
                return <EngineCard key={engine.key} engine={engine} result={result} />;
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground">
                تم إصدار هذا التقرير بواسطة محرك التحليل الاستثماري الذكي
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(analysis.completedAt ?? analysis.createdAt).toLocaleString("ar-SA")}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                © 2025 Faisal Alqasim – All Rights Reserved
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
