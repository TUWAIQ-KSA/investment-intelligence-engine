import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Building2, Car, Coins, TrendingUp, Plus, Search,
  BarChart3, Clock, CheckCircle2, AlertCircle, ChevronLeft,
  LogOut, User
} from "lucide-react";

const ASSET_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  real_estate: { label: "عقار", icon: <Building2 className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  vehicle: { label: "سيارة", icon: <Car className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
  gold: { label: "ذهب", icon: <Coins className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-700" },
  stocks: { label: "أسهم", icon: <TrendingUp className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
};

const DECISION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  execute: { label: "تنفيذ", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  do_not_execute: { label: "لا تنفذ", color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3" /> },
  wait: { label: "تريث", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "في الانتظار", color: "bg-gray-100 text-gray-600" },
  analyzing: { label: "جارٍ التحليل...", color: "bg-blue-100 text-blue-600" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
  failed: { label: "فشل", color: "bg-red-100 text-red-600" },
};

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: stats } = trpc.analysis.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: analyses, isLoading } = trpc.analysis.list.useQuery(
    {
      search: search || undefined,
      assetType: assetFilter !== "all" ? (assetFilter as any) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 50,
      offset: 0,
    },
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  const deleteMutation = trpc.analysis.delete.useMutation({
    onSuccess: () => { utils.analysis.list.invalidate(); utils.analysis.stats.invalidate(); },
  });
  const utils = trpc.useUtils();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">محرك التحليل الاستثماري</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            منصة ذكية لتقييم الفرص الاستثمارية في العقار، الذهب، السيارات، والأسهم
            عبر 5 محاور تحليلية شاملة مع توصية تنفيذية محكمة.
          </p>
          <Button size="lg" className="w-full text-base" onClick={() => window.location.href = getLoginUrl()}>
            تسجيل الدخول للبدء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">محرك التحليل الاستثماري</h1>
              <p className="text-xs text-muted-foreground">Investment Intelligence Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline mr-1">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">إجمالي التحليلات</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.completed ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">مكتملة</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.pending ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">قيد التحليل</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button className="sm:w-auto" onClick={() => navigate("/new")}>
            <Plus className="w-4 h-4 ml-2" />
            تحليل فرصة جديدة
          </Button>
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن تحليل..."
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="نوع الأصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="real_estate">عقار</SelectItem>
                <SelectItem value="vehicle">سيارة</SelectItem>
                <SelectItem value="gold">ذهب</SelectItem>
                <SelectItem value="stocks">أسهم</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="من تاريخ" />
            <Input type="date" className="w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} title="إلى تاريخ" />
          </div>
        </div>

        {/* Analyses List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !analyses?.length ? (
          <div className="text-center py-20">
            <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد تحليلات بعد</h3>
            <p className="text-sm text-muted-foreground mb-6">ابدأ بتحليل أول فرصة استثمارية</p>
            <Button onClick={() => navigate("/new")}>
              <Plus className="w-4 h-4 ml-2" />
              تحليل فرصة جديدة
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => {
              const asset = ASSET_LABELS[analysis.assetType];
              const decision = analysis.finalDecision ? DECISION_LABELS[analysis.finalDecision] : null;
              const status = STATUS_LABELS[analysis.status];
              return (
                <Card
                  key={analysis.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${asset.color}`}>
                          {asset.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{analysis.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className={`text-xs ${asset.color} border-0`}>
                              {asset.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {analysis.status === "completed" && decision ? (
                          <div className="text-left">
                            <Badge className={`${decision.color} border-0 flex items-center gap-1 text-xs`}>
                              {decision.icon}
                              {decision.label}
                            </Badge>
                            {analysis.confidenceScore && (
                              <div className="text-xs text-muted-foreground mt-1 text-center">
                                {parseFloat(analysis.confidenceScore).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                        )}
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
