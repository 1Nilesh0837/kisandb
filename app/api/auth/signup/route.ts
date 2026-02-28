import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, email, password, language } = await req.json();

        // Validate
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check duplicate
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        // Create user (password is hashed by pre-save hook)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            language: language || "en"
        });

        const token = signToken(user._id.toString());

        return NextResponse.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                language: user.language
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Signup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
