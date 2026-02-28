import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Crop from "@/lib/models/Crop";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const crops = await Crop.find({ userId }).sort({ updatedAt: -1 });
        return NextResponse.json(crops);
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
        const newCrop = await Crop.create({ ...body, userId });
        return NextResponse.json(newCrop);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
