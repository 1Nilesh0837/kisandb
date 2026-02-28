import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                language: user.language
            }
        });

    } catch (error: any) {
        console.error("Auth/me Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
