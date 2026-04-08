import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, Building2, Car, Coins, TrendingUp, Loader2, BarChart3 } from "lucide-react";

type AssetType = "real_estate" | "vehicle" | "gold" | "stocks";
type GoalType = "investment" | "residence" | "daily_use" | "value_preservation";

const ASSET_OPTIONS = [
  { value: "real_estate", label: "عقار", icon: Building2, desc: "شقة، فيلا، أرض، مكتب" },
  { value: "vehicle", label: "سيارة", icon: Car, desc: "سيارة جديدة أو مستعملة" },
  { value: "gold", label: "ذهب", icon: Coins, desc: "سبائك، مسكوكات، مجوهرات" },
  { value: "stocks", label: "أسهم", icon: TrendingUp, desc: "أسهم محلية أو دولية" },
];

const GOAL_OPTIONS = [
  { value: "investment", label: "استثمار وتأجير" },
  { value: "residence", label: "سكن شخصي" },
  { value: "daily_use", label: "استخدام يومي" },
  { value: "value_preservation", label: "حفظ قيمة" },
];

// Dynamic fields per asset type
function RealEstateFields({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>الموقع / الحي</Label>
        <Input placeholder="مثال: حي النخيل، الرياض" value={data.location ?? ""} onChange={e => set("location", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>نوع العقار</Label>
        <Select value={data.propertyType ?? ""} onValueChange={v => set("propertyType", v)}>
          <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">شقة</SelectItem>
            <SelectItem value="villa">فيلا</SelectItem>
            <SelectItem value="land">أرض</SelectItem>
            <SelectItem value="commercial">تجاري</SelectItem>
            <SelectItem value="office">مكتب</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>المساحة (م²)</Label>
        <Input type="number" placeholder="150" value={data.area ?? ""} onChange={e => set("area", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>عمر البناء (سنوات)</Label>
        <Input type="number" placeholder="5" value={data.buildingAge ?? ""} onChange={e => set("buildingAge", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>عدد الغرف</Label>
        <Input type="number" placeholder="3" value={data.rooms ?? ""} onChange={e => set("rooms", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>الطابق</Label>
        <Input placeholder="الثالث" value={data.floor ?? ""} onChange={e => set("floor", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>الإيجار الشهري المتوقع (ريال)</Label>
        <Input type="number" placeholder="3000" value={data.expectedRent ?? ""} onChange={e => set("expectedRent", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>رسوم الخدمات الشهرية (ريال)</Label>
        <Input type="number" placeholder="500" value={data.serviceCharges ?? ""} onChange={e => set("serviceCharges", e.target.value)} />
      </div>
      <div className="col-span-full space-y-1.5">
        <Label>ملاحظات إضافية عن العقار</Label>
        <Textarea placeholder="وصف الحالة، المميزات، العيوب الملحوظة..." value={data.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={3} />
      </div>
    </div>
  );
}

function VehicleFields({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>الماركة والموديل</Label>
        <Input placeholder="مثال: تويوتا كامري 2023" value={data.makeModel ?? ""} onChange={e => set("makeModel", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>سنة الصنع</Label>
        <Input type="number" placeholder="2023" value={data.year ?? ""} onChange={e => set("year", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>المسافة المقطوعة (كم)</Label>
        <Input type="number" placeholder="50000" value={data.mileage ?? ""} onChange={e => set("mileage", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>نوع الوقود</Label>
        <Select value={data.fuelType ?? ""} onValueChange={v => set("fuelType", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="petrol">بنزين</SelectItem>
            <SelectItem value="diesel">ديزل</SelectItem>
            <SelectItem value="hybrid">هجين</SelectItem>
            <SelectItem value="electric">كهربائي</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>ناقل الحركة</Label>
        <Select value={data.transmission ?? ""} onValueChange={v => set("transmission", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="automatic">أوتوماتيك</SelectItem>
            <SelectItem value="manual">عادي</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>حالة السيارة</Label>
        <Select value={data.condition ?? ""} onValueChange={v => set("condition", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">جديدة</SelectItem>
            <SelectItem value="excellent">ممتازة</SelectItem>
            <SelectItem value="good">جيدة</SelectItem>
            <SelectItem value="fair">مقبولة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-full space-y-1.5">
        <Label>ملاحظات إضافية</Label>
        <Textarea placeholder="تاريخ الصيانة، حوادث سابقة، ملاحظات..." value={data.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={3} />
      </div>
    </div>
  );
}

function GoldFields({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>نوع الذهب</Label>
        <Select value={data.goldType ?? ""} onValueChange={v => set("goldType", v)}>
          <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bullion">سبائك</SelectItem>
            <SelectItem value="coins">مسكوكات</SelectItem>
            <SelectItem value="jewelry">مجوهرات</SelectItem>
            <SelectItem value="etf">صناديق ذهب ETF</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>العيار</Label>
        <Select value={data.karat ?? ""} onValueChange={v => set("karat", v)}>
          <SelectTrigger><SelectValue placeholder="اختر العيار" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24 قيراط (999)</SelectItem>
            <SelectItem value="22">22 قيراط (916)</SelectItem>
            <SelectItem value="21">21 قيراط (875)</SelectItem>
            <SelectItem value="18">18 قيراط (750)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>الوزن (غرام)</Label>
        <Input type="number" placeholder="100" value={data.weight ?? ""} onChange={e => set("weight", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>سعر الشراء المطلوب (ريال/غرام)</Label>
        <Input type="number" placeholder="220" value={data.pricePerGram ?? ""} onChange={e => set("pricePerGram", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>مصدر الشراء</Label>
        <Select value={data.source ?? ""} onValueChange={v => set("source", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bank">بنك</SelectItem>
            <SelectItem value="jeweler">محل مجوهرات</SelectItem>
            <SelectItem value="exchange">صرافة</SelectItem>
            <SelectItem value="online">منصة إلكترونية</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>مدة الاحتفاظ المتوقعة</Label>
        <Select value={data.holdingPeriod ?? ""} onValueChange={v => set("holdingPeriod", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="short">أقل من سنة</SelectItem>
            <SelectItem value="medium">1-3 سنوات</SelectItem>
            <SelectItem value="long">أكثر من 3 سنوات</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StocksFields({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>اسم الشركة أو رمز السهم</Label>
        <Input placeholder="مثال: أرامكو / 2222" value={data.stockSymbol ?? ""} onChange={e => set("stockSymbol", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>السوق</Label>
        <Select value={data.market ?? ""} onValueChange={v => set("market", v)}>
          <SelectTrigger><SelectValue placeholder="اختر السوق" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tadawul">تداول (السعودي)</SelectItem>
            <SelectItem value="nasdaq">ناسداك</SelectItem>
            <SelectItem value="nyse">نيويورك</SelectItem>
            <SelectItem value="other">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>سعر السهم الحالي (ريال)</Label>
        <Input type="number" placeholder="35.50" value={data.currentPrice ?? ""} onChange={e => set("currentPrice", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>عدد الأسهم المراد شراؤها</Label>
        <Input type="number" placeholder="1000" value={data.quantity ?? ""} onChange={e => set("quantity", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>القطاع</Label>
        <Select value={data.sector ?? ""} onValueChange={v => set("sector", v)}>
          <SelectTrigger><SelectValue placeholder="اختر القطاع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="energy">طاقة</SelectItem>
            <SelectItem value="banking">مصارف</SelectItem>
            <SelectItem value="telecom">اتصالات</SelectItem>
            <SelectItem value="real_estate">عقارات</SelectItem>
            <SelectItem value="healthcare">رعاية صحية</SelectItem>
            <SelectItem value="tech">تقنية</SelectItem>
            <SelectItem value="materials">مواد أساسية</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>مدة الاستثمار المتوقعة</Label>
        <Select value={data.investmentPeriod ?? ""} onValueChange={v => set("investmentPeriod", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="short">أقل من 6 أشهر</SelectItem>
            <SelectItem value="medium">6 أشهر - 2 سنة</SelectItem>
            <SelectItem value="long">أكثر من 2 سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-full space-y-1.5">
        <Label>سبب الاهتمام بهذا السهم</Label>
        <Textarea placeholder="ما الذي جذبك لهذا السهم؟ أخبار، توصيات، تحليل شخصي..." value={data.reason ?? ""} onChange={e => set("reason", e.target.value)} rows={3} />
      </div>
    </div>
  );
}

export default function NewAnalysis() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [assetType, setAssetType] = useState<AssetType | "">("");
  const [goal, setGoal] = useState<GoalType | "">("");
  const [title, setTitle] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [assetData, setAssetData] = useState<Record<string, any>>({});

  const createMutation = trpc.analysis.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إطلاق التحليل الاستثماري بنجاح!");
      navigate(`/analysis/${data.id}`);
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء إنشاء التحليل");
    },
  });

  const handleSubmit = () => {
    if (!assetType || !goal || !title) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate({
      title,
      assetType,
      investmentGoal: goal,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      currency,
      inputData: assetData,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowRight className="w-4 h-4 ml-1" />
            رجوع
          </Button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-foreground">تحليل فرصة استثمارية جديدة</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 1: Asset Type */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">١</span>
              نوع الأصل الاستثماري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {ASSET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAssetType(opt.value as AssetType)}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      assetType === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${assetType === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Basic Info */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">٢</span>
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>عنوان الفرصة الاستثمارية <span className="text-destructive">*</span></Label>
              <Input
                placeholder="مثال: شقة 3 غرف في حي النخيل - الرياض"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الهدف من الاستثمار <span className="text-destructive">*</span></Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الهدف" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>الميزانية الدنيا</Label>
                <Input type="number" placeholder="500,000" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>الميزانية القصوى</Label>
                <Input type="number" placeholder="700,000" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>العملة</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال</SelectItem>
                    <SelectItem value="USD">دولار</SelectItem>
                    <SelectItem value="EUR">يورو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Asset-specific fields */}
        {assetType && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">٣</span>
                تفاصيل {ASSET_OPTIONS.find(a => a.value === assetType)?.label}
              </CardTitle>
              <CardDescription>كلما أضفت تفاصيل أكثر، كان التحليل أدق</CardDescription>
            </CardHeader>
            <CardContent>
              {assetType === "real_estate" && <RealEstateFields data={assetData} onChange={setAssetData} />}
              {assetType === "vehicle" && <VehicleFields data={assetData} onChange={setAssetData} />}
              {assetType === "gold" && <GoldFields data={assetData} onChange={setAssetData} />}
              {assetType === "stocks" && <StocksFields data={assetData} onChange={setAssetData} />}
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <Button
          className="w-full h-12 text-base"
          onClick={handleSubmit}
          disabled={!assetType || !goal || !title || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جارٍ إطلاق التحليل...
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5 ml-2" />
              إطلاق التحليل الاستثماري الشامل
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          سيقوم النظام بتحليل الفرصة عبر 5 محاور شاملة وإصدار تقرير تنفيذي خلال دقيقة واحدة
        </p>
      </main>
    </div>
  );
}
