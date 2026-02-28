import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { checkInventoryAlerts, saveAlerts } from "@/lib/alertEngine";
import { sendSMS } from "@/lib/smsService";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { db } = await connectToDatabase();
        const userObjectId = new ObjectId(userId);

        // Get farmer details for phone number
        const farmer = await db
            .collection("users")
            .findOne({ _id: userObjectId }) ||
            await db.collection("farmers").findOne({ _id: userObjectId });

        // Generate fresh alerts
        const alerts = await checkInventoryAlerts(userId);

        // Save to MongoDB
        await saveAlerts(alerts);

        // Send SMS only for urgent alerts that haven't been SMS'd yet
        const phone = farmer?.phone || farmer?.phoneNumber;
        if (phone && alerts.length > 0) {
            const urgentUnsent = alerts.filter(
                a => a.severity === "urgent" && !a.smsSent
            );

            for (const alert of urgentUnsent) {
                const sent = await sendSMS(phone, alert);
                if (sent) {
                    // Mark SMS as sent locally in this loop
                    alert.smsSent = true;
                    // Update DB for this specific alert
                    await db.collection("alerts").updateOne(
                        { id: alert.id },
                        { $set: { smsSent: true, updatedAt: new Date() } }
                    );
                }
                // 1 sec delay between SMS attempts
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        return NextResponse.json({
            success: true,
            total: alerts.length,
            urgent: alerts.filter(a => a.severity === "urgent").length,
            smsSent: alerts.filter(a => a.smsSent).length,
        });

    } catch (error) {
        console.error("Alert check error:", error);
        return NextResponse.json(
            { error: "Alert check failed" },
            { status: 500 }
        );
    }
}
