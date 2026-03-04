import mongoose from "mongoose";

const REQUIRED_ENV_VARS = [
    "MONGODB_URI",
    "GROQ_API_KEY",
    "JWT_SECRET",
];

for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
        throw new Error(`Please define the ${envVar} environment variable inside .env.local`);
    }
}

if (!process.env.WEATHER_API_KEY) {
    console.warn("⚠️ WEATHER_API_KEY not set — weather features will be disabled");
}

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
