import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type AlertSeverity = "urgent" | "warning" | "info";
// ... (rest of types)
export type AlertType = "high_stock" | "aging" | "price_fall" | "hold" | "perfect_day";

export interface StockAlert {
    id: string;
    userId: string;
    type: AlertType;
    severity: AlertSeverity;
    cropName: string;
    cropHindi: string;
    quantity: number;
    message_hi: string;
    message_en: string;
    action_hi: string;
    action_en: string;
    isRead: boolean;
    smsSent: boolean;
    createdAt: Date;
}

const CROP_HINDI: Record<string, string> = {
    "Wheat": "गेहूं (Gehu)",
    "Rice": "धान (Dhan)",
    "Maize": "मक्का (Makka)",
    "Mustard": "सरसों (Sarson)",
    "Gram": "चना (Chana)",
    "Onion": "प्याज (Pyaaz)",
};

const THRESHOLDS: Record<string, number> = {
    "Wheat": 300,
    "Rice": 200,
    "Maize": 150,
    "Mustard": 100,
    "Gram": 80,
    "default": 100,
};

const MAX_AGE_DAYS = 15;

export async function checkInventoryAlerts(userId: string): Promise<StockAlert[]> {
    const { db } = await connectToDatabase();
    const alerts: StockAlert[] = [];
    const today = new Date();

    try {
        const userObjectId = new ObjectId(userId);
        // Get user's crops (confirmed schema uses userId, cropName, quantity, updatedAt)
        const inventory = await db
            .collection("crops")
            .find({ userId: userObjectId })
            .toArray();

        if (!inventory.length) return [];

        for (const item of inventory) {
            const crop = item.cropName;
            const qty = Number(item.quantity) || 0;
            const hindi = CROP_HINDI[crop] || crop;
            const limit = THRESHOLDS[crop] || THRESHOLDS.default;

            const updatedDate = new Date(item.updatedAt || today);
            const ageDays = Math.floor((today.getTime() - updatedDate.getTime()) / 86400000);

            // ── HIGH STOCK ALERT ────────────────
            if (qty > limit) {
                const isVeryHigh = qty > limit * 1.5;
                alerts.push({
                    id: `high_${crop}_${userId}_${today.getTime()}`,
                    userId,
                    type: "high_stock",
                    severity: isVeryHigh ? "urgent" : "warning",
                    cropName: crop,
                    cropHindi: hindi,
                    quantity: qty,
                    message_hi: `⚠️ ${hindi} ka stock bahut zyada hai!\nAapke paas ${qty} quintal hai, limit ${limit} qtl hai.`,
                    message_en: `${crop} stock too high! You have ${qty} qtl, threshold is ${limit} qtl.`,
                    action_hi: isVeryHigh
                        ? "🚨 JALDI becho — mandi mein acche daam hain!"
                        : "Bechne ke baare mein sochein. Daam theek hain.",
                    action_en: isVeryHigh
                        ? "Sell urgently — good market prices now!"
                        : "Consider selling. Market prices are decent.",
                    isRead: false,
                    smsSent: false,
                    createdAt: today,
                });
            }

            // ── AGING STOCK ALERT ───────────────
            if (ageDays > MAX_AGE_DAYS) {
                const isOld = ageDays > 25;
                alerts.push({
                    id: `aging_${crop}_${userId}_${today.getTime()}`,
                    userId,
                    type: "aging",
                    severity: isOld ? "urgent" : "warning",
                    cropName: crop,
                    cropHindi: hindi,
                    quantity: qty,
                    message_hi: `⏰ ${hindi} ${ageDays} din se pichli baar update hua tha!\nZyada dino baad quality kharab ho sakti hai.`,
                    message_en: `${crop} hasn't been updated for ${ageDays} days. Quality may decline soon.`,
                    action_hi: isOld
                        ? `🚨 2-3 din mein becho — quality kharab hone wali hai!`
                        : `Agle 5-7 din mein bechne ki koshish karein.`,
                    action_en: isOld
                        ? "Sell in 2-3 days — quality declining!"
                        : "Try to sell within 5-7 days.",
                    isRead: false,
                    smsSent: false,
                    createdAt: today,
                });
            }

            // ── PRICE TREND ALERT ───────────────
            try {
                const prices = await db
                    .collection("prices")
                    .find({
                        $or: [
                            { crop },
                            { commodity: crop },
                            { Commodity: crop },
                            { cropName: crop }
                        ]
                    })
                    .sort({ date: -1, price_date: -1 })
                    .limit(5)
                    .toArray();

                if (prices.length >= 3) {
                    const getP = (r: any) =>
                        r.modalPrice || r.modal_price || r["Modal Price"] || 0;

                    const latest = getP(prices[0]);
                    const oldest = getP(prices[prices.length - 1]);
                    const pct = oldest > 0 ? ((latest - oldest) / oldest) * 100 : 0;

                    if (pct < -3 && qty > 50) {
                        alerts.push({
                            id: `drop_${crop}_${userId}_${today.getTime()}`,
                            userId,
                            type: "price_fall",
                            severity: "urgent",
                            cropName: crop,
                            cropHindi: hindi,
                            quantity: qty,
                            message_hi: `📉 ${hindi} ka daam ${Math.abs(pct).toFixed(1)}% gir gaya!\nAbhi ka rate: ₹${latest}/quintal.`,
                            message_en: `${crop} price fell ${Math.abs(pct).toFixed(1)}%. Now ₹${latest}/qtl.`,
                            action_hi: "Aur girne se pehle BECHO! Har din intezaar mein nuksaan hai. 💸",
                            action_en: "Sell now before price drops further!",
                            isRead: false,
                            smsSent: false,
                            createdAt: today,
                        });
                    }

                    if (pct > 5 && qty > 50) {
                        alerts.push({
                            id: `rise_${crop}_${userId}_${today.getTime()}`,
                            userId,
                            type: "hold",
                            severity: "info",
                            cropName: crop,
                            cropHindi: hindi,
                            quantity: qty,
                            message_hi: `📈 ${hindi} ka daam ${pct.toFixed(1)}% badh raha hai!\nAbhi ₹${latest}/quintal chal raha hai.`,
                            message_en: `${crop} price rising ${pct.toFixed(1)}%. Now ₹${latest}/qtl.`,
                            action_hi: "2-3 din aur ruko — daam aur badhega! 💰",
                            action_en: "Hold 2-3 more days — price still rising!",
                            isRead: false,
                            smsSent: false,
                            createdAt: today,
                        });
                    }
                }
            } catch { /* silent price trend check failure */ }
        }
    } catch (err) {
        console.error("Error in checkInventoryAlerts:", err);
        return [];
    }

    return alerts.sort((a, b) => {
        const o = { urgent: 0, warning: 1, info: 2 };
        return o[a.severity] - o[b.severity];
    });
}

export async function saveAlerts(alerts: StockAlert[]) {
    if (!alerts.length) return;
    const { db } = await connectToDatabase();
    try {
        for (const alert of alerts) {
            await db.collection("alerts").updateOne(
                { id: alert.id },
                { $set: { ...alert, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (err) {
        console.error("Error saving alerts:", err);
    }
}

export async function getAlerts(userId: string, onlyUnread = false): Promise<StockAlert[]> {
    const { db } = await connectToDatabase();
    try {
        const query: any = { userId };
        if (onlyUnread) query.isRead = false;
        return db
            .collection("alerts")
            .find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray() as any;
    } catch (err) {
        console.error("Error getting alerts:", err);
        return [];
    }
}

export async function markRead(alertId: string) {
    const { db } = await connectToDatabase();
    try {
        await db.collection("alerts").updateOne(
            { id: alertId },
            { $set: { isRead: true } }
        );
    } catch (err) {
        console.error("Error marking alert as read:", err);
    }
}
