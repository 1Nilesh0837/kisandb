import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { checkInventoryAlerts, saveAlerts } from "@/lib/alertEngine";
import { sendDailySummary } from "@/lib/smsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const { db } = await connectToDatabase();

        // Get all users/farmers with phone numbers
        // Checking both collections just in case
        const users = await db
            .collection("users")
            .find({ phone: { $exists: true, $ne: "" } })
            .toArray();

        const farmers = await db
            .collection("farmers")
            .find({ phone: { $exists: true, $ne: "" } })
            .toArray();

        // Combine and deduplicate if necessary (simplified here)
        const combined = [...users, ...farmers];
        const processedIds = new Set();
        let totalSent = 0;

        for (const farmer of combined) {
            const fid = farmer._id.toString();
            if (processedIds.has(fid)) continue;
            processedIds.add(fid);

            const alerts = await checkInventoryAlerts(fid);
            await saveAlerts(alerts);

            const phone = farmer.phone || farmer.phoneNumber;
            if (alerts.length > 0 && phone) {
                const sent = await sendDailySummary(
                    phone,
                    farmer.name || "Kisan",
                    alerts
                );
                if (sent) totalSent++;
            }

            // 2 sec delay between farmers to stay within Twilio limits/avoid spam
            await new Promise(r => setTimeout(r, 2000));
        }

        return NextResponse.json({
            success: true,
            totalProcessed: processedIds.size,
            smsSent: totalSent,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Daily summary error:", error);
        return NextResponse.json(
            { error: "Daily summary failed" },
            { status: 500 }
        );
    }
}
