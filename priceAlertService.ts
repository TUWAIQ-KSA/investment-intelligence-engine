/**
 * Price Alert Service - نظام التنبيهات الذكي
 * يراقب الأسعار ويرسل إشعارات عند تحقق الشروط
 */

import { getDb } from "./db";
import { eq, and, isNull, lte, gte } from "drizzle-orm";
import { priceAlerts, notifications, type PriceAlert } from "./schema";
import { fetchGoldPrices, fetchStockPrice, fetchRealEstateIndex } from "./marketDataService";

interface AlertTrigger {
  alert: PriceAlert;
  currentPrice: number;
  triggerReason: string;
}

/**
* فحص جميع التنبيهات النشطة
*/
export async function checkAllAlerts(): Promise<AlertTrigger[]> {
  const db = await getDb();
  if (!db) return [];

  // جلب التنبيهات النشطة
  const activeAlerts = await db
    .select()
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.isActive, 1),
        isNull(priceAlerts.triggeredAt)
      )
    );

  const triggered: AlertTrigger[] = [];

  for (const alert of activeAlerts) {
    const currentPrice = await getCurrentPrice(alert.assetType, alert.assetIdentifier);
    if (!currentPrice) continue;

    const shouldTrigger = checkAlertCondition(alert, currentPrice);
    
    if (shouldTrigger) {
      triggered.push({
        alert,
        currentPrice,
        triggerReason: generateTriggerReason(alert, currentPrice),
      });

      // تحديث حالة التنبيه
      await db.update(priceAlerts)
        .set({
          triggeredAt: new Date(),
          triggerCount: (alert.triggerCount || 0) + 1,
        })
        .where(eq(priceAlerts.id, alert.id));

      // إنشاء إشعار
      await createNotification(alert, currentPrice);
    }
  }

  return triggered;
}

/**
* جلب السعر الحالي لأي نوع أصل
*/
async function getCurrentPrice(assetType: string, identifier: string): Promise<number | null> {
  switch (assetType) {
    case "gold": {
      const prices = await fetchGoldPrices();
      if (!prices) return null;
      // identifier يكون مثل "24", "22", "21", "18"
      const karatMap: Record<string, number> = {
        "24": prices.karat24,
        "22": prices.karat22,
        "21": prices.karat21,
        "18": prices.karat18,
      };
      return karatMap[identifier] || prices.karat24;
    }
    
    case "stocks": {
      const stock = await fetchStockPrice(identifier);
      return stock?.price || null;
    }
    
    case "real_estate": {
      const index = await fetchRealEstateIndex(identifier);
      return index?.avgPricePerSqm || null;
    }
    
    default:
      return null;
  }
}

/**
* التحقق من تحقق شرط التنبيه
*/
function checkAlertCondition(alert: PriceAlert, currentPrice: number): boolean {
  const targetValue = parseFloat(alert.targetValue.toString());

  switch (alert.alertType) {
    case "price_above":
      return currentPrice >= targetValue;
    
    case "price_below":
      return currentPrice <= targetValue;
    
    case "percent_change": {
      const basePrice = alert.currentPriceWhenSet 
        ? parseFloat(alert.currentPriceWhenSet.toString())
        : currentPrice;
      const changePercent = ((currentPrice - basePrice) / basePrice) * 100;
      return Math.abs(changePercent) >= targetValue;
    }
    
    default:
      return false;
  }
}

/**
* توليد سبب التنبيه
*/
function generateTriggerReason(alert: PriceAlert, currentPrice: number): string {
  const targetValue = parseFloat(alert.targetValue.toString());
  
  switch (alert.alertType) {
    case "price_above":
      return `السعر وصل إلى ${currentPrice} وهو أعلى من الهدف ${targetValue}`;
    
    case "price_below":
      return `السعر وصل إلى ${currentPrice} وهو أقل من الهدف ${targetValue}`;
    
    case "percent_change": {
      const basePrice = alert.currentPriceWhenSet 
        ? parseFloat(alert.currentPriceWhenSet.toString())
        : currentPrice;
      const changePercent = ((currentPrice - basePrice) / basePrice) * 100;
      return `تغير السعر بنسبة ${changePercent.toFixed(2)}% (الهدف: ${targetValue}%)`;
    }
    
    default:
      return "تم تحقق شرط التنبيه";
  }
}

/**
* إنشاء إشعار للمستخدم
*/
async function createNotification(alert: PriceAlert, currentPrice: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const assetTypeLabels: Record<string, string> = {
    gold: "الذهب",
    stocks: "الأسهم",
    real_estate: "العقار",
    vehicle: "السيارات",
  };

  const alertTypeLabels: Record<string, string> = {
    price_above: "ارتفاع السعر",
    price_below: "انخفاض السعر",
    percent_change: "تغير بنسبة",
  };

  const assetLabel = assetTypeLabels[alert.assetType] || alert.assetType;
  const alertLabel = alertTypeLabels[alert.alertType] || alert.alertType;

  let title = "";
  let content = "";

  if (alert.alertType === "price_above") {
    title = `🚀 ${assetLabel}: ارتفاع السعر!`;
    content = `وصل سعر ${alert.assetIdentifier} إلى ${currentPrice} ريال، وهو أعلى من هدفك ${alert.targetValue} ريال.`;
  } else if (alert.alertType === "price_below") {
    title = `📉 ${assetLabel}: انخفاض السعر!`;
    content = `وصل سعر ${alert.assetIdentifier} إلى ${currentPrice} ريال، وهو أقل من هدفك ${alert.targetValue} ريال. قد تكون فرصة شراء.`;
  } else {
    title = `📊 ${assetLabel}: تغير كبير في السعر`;
    content = `حدث تغير كبير في سعر ${alert.assetIdentifier} (السعر الحالي: ${currentPrice} ريال).`;
  }

  if (alert.notes) {
    content += `\nملاحظاتك: ${alert.notes}`;
  }

  await db.insert(notifications).values({
    userId: alert.userId,
    type: "price_alert",
    title,
    content,
    relatedAlertId: alert.id,
    actionUrl: `/alerts/${alert.id}`,
  });
}

/**
* إنشاء تنبيه جديد
*/
export async function createPriceAlert(data: {
  userId: number;
  assetType: string;
  assetIdentifier: string;
  alertType: string;
  targetValue: number;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // جلب السعر الحالي
  const currentPrice = await getCurrentPrice(data.assetType, data.assetIdentifier);

  const result = await db.insert(priceAlerts).values({
    userId: data.userId,
    assetType: data.assetType as any,
    assetIdentifier: data.assetIdentifier,
    alertType: data.alertType as any,
    targetValue: data.targetValue.toString(),
    currentPriceWhenSet: currentPrice?.toString(),
    notes: data.notes,
    isActive: true,
    triggerCount: 0,
  });

  return (result[0] as any).insertId as number;
}

/**
* إلغاء تنبيه
*/
export async function deactivateAlert(alertId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(priceAlerts)
    .set({ isActive: false })
    .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, userId)));
}

/**
* جلب تنبيهات المستخدم
*/
export async function getUserAlerts(userId: number): Promise<PriceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.userId, userId))
    .orderBy(priceAlerts.createdAt);
}

/**
* إعادة تنشيط تنبيه بعد التحقق
*/
export async function reactivateAlert(alertId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // جلب السعر الحالي الجديد
  const alert = await db
    .select()
    .from(priceAlerts)
    .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, userId)))
    .limit(1);

  if (!alert[0]) return;

  const currentPrice = await getCurrentPrice(alert[0].assetType, alert[0].assetIdentifier);

  await db.update(priceAlerts)
    .set({
      isActive: true,
      triggeredAt: null,
      currentPriceWhenSet: currentPrice?.toString(),
    })
    .where(eq(priceAlerts.id, alertId));
}

/**
* فحص دوري للتنبيهات (للاستخدام مع cron job)
*/
export async function runAlertCheckJob(): Promise<{
  checked: number;
  triggered: number;
}> {
  const db = await getDb();
  if (!db) return { checked: 0, triggered: 0 };

  const activeAlerts = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.isActive, 1));

  const triggered = await checkAllAlerts();

  return {
    checked: activeAlerts.length,
    triggered: triggered.length,
  };
}
