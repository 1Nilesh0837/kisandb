import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Crop from "@/lib/models/Crop";
import { getUserIdFromRequest } from "@/lib/auth";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        // Only update if the crop belongs to this user
        const updatedCrop = await Crop.findOneAndUpdate(
            { _id: id, userId },
            body,
            { new: true }
        );
        if (!updatedCrop) return NextResponse.json({ error: "Crop not found" }, { status: 404 });
        return NextResponse.json(updatedCrop);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        // Only delete if the crop belongs to this user
        await Crop.findOneAndDelete({ _id: id, userId });
        return NextResponse.json({ message: "Deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
