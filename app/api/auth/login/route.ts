import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const token = signToken(user._id.toString());

        return NextResponse.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                language: user.language
            }
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
