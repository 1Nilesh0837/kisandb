import { NextRequest, NextResponse } from "next/server";
import { getAlerts, markRead } from "@/lib/alertEngine";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const alerts = await getAlerts(userId, true);
        return NextResponse.json({ alerts });
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { alertId } = await req.json();
        if (!alertId) {
            return NextResponse.json({ error: "alertId required" }, { status: 400 });
        }

        await markRead(alertId);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
    }
}
