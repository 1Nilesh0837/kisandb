import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

if (JWT_SECRET === "your_jwt_secret_here" || JWT_SECRET.length < 32) {
    console.warn("WARNING: JWT_SECRET is insecure. Please use a random string of at least 32 characters.");
}

export function signToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded;
    } catch {
        return null;
    }
}

// Extract userId from Authorization header
export function getUserIdFromRequest(req: NextRequest): string | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}
