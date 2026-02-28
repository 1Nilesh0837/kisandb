import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Sale from "@/lib/models/Sale";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const sales = await Sale.find({ userId }).sort({ date: -1 });
        return NextResponse.json(sales);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        const newSale = await Sale.create({ ...body, userId });
        return NextResponse.json(newSale);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
