import { StockAlert } from "./alertEngine";

const SID = process.env.TWILIO_ACCOUNT_SID!;
const TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const FROM = process.env.TWILIO_PHONE!;
const URL = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;

function buildSMS(alert: StockAlert): string {
    const crop = alert.cropName;
    const qty = alert.quantity;

    switch (alert.type) {
        case "high_stock":
            return `KisanDB: ${crop} stock zyada hai (${qty} qtl). ${alert.action_hi} -KisanDB`;
        case "aging":
            return `KisanDB: ${crop} bahut dino se pada hai. ${alert.action_hi} -KisanDB`;
        case "price_fall":
            return `KisanDB URGENT: ${crop} ka daam gir raha hai! ${alert.action_hi} -KisanDB`;
        case "hold":
            return `KisanDB: ${crop} ka daam badh raha hai. ${alert.action_hi} -KisanDB`;
        default:
            return `KisanDB Alert: ${alert.message_hi} -KisanDB`;
    }
}

export async function sendSMS(toPhone: string, alert: StockAlert): Promise<boolean> {
    if (!SID || !TOKEN || !FROM || !toPhone) return false;

    try {
        const body = buildSMS(alert);

        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                From: FROM,
                To: toPhone,
                Body: body,
            }).toString(),
        });

        const data = await res.json();
        return res.ok;
    } catch (err) {
        console.error("SMS failed:", err);
        return false;
    }
}

export async function sendDailySummary(toPhone: string, farmerName: string, alerts: StockAlert[]): Promise<boolean> {
    if (!SID || !TOKEN || !FROM || !toPhone || !alerts.length) return false;

    try {
        const urgent = alerts.filter(a => a.severity === "urgent").length;
        const warning = alerts.filter(a => a.severity === "warning").length;
        const crops = [...new Set(alerts.map(a => a.cropName))].join(", ");

        const body =
            `KisanDB Subah Ka Report 🌾\n` +
            `Namaste ${farmerName}!\n` +
            `Aaj ke alerts:\n` +
            `🚨 Urgent: ${urgent}\n` +
            `⚠️ Warning: ${warning}\n` +
            `Fasal: ${crops}\n` +
            `App kholein details ke liye.\n` +
            `-KisanDB`;

        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                From: FROM,
                To: toPhone,
                Body: body,
            }).toString(),
        });

        return res.ok;
    } catch (err) {
        console.error("Daily SMS failed:", err);
        return false;
    }
}
