import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { generateMongoQuery, generateResponse } from '@/lib/ai';
import { getUserIdFromRequest } from '@/lib/auth';
import Price from '@/lib/models/Price';
import mongoose from 'mongoose';
import { weatherAgent, getCropPrice, getFarmerStock, getFarmerSales, handleMLPrediction } from '@/lib/weatherAgent';
import Crop from '@/lib/models/Crop';
import User from '@/lib/models/User';

const PREDICTION_PHRASES = [
    "agle 7 din",
    "agle 7 dino",
    "next 7 days",
    "7 din mein kitna",
    "agle hafte kitna",
    "predict",
    "prediction",
    "kitna ho sakta hai",
    "kitna hoga",
    "future price",
    "aane wala daam",
    "badhega",
    "girega",
    "forecast price",
    "price forecast",
    "daam badhega",
    "daam girega",
    "agle din ka daam",
];

const INTENT_PATTERNS = {
    weather: [
        "mausam", "weather", "barish", "baarish", "rain", "garmi", "thand", "sardi",
        "temperature", "temp", "tapman", "dhoop", "sunny", "badal", "cloud",
        "hawa", "wind", "toofan", "storm", "humidity", "nami", "kohra", "fog",
        "ola", "bijli", "thunder", "acha din", "accha din", "best din",
        "sahi din", "sahi waqt", "sahi time", "kab karein", "kab karna",
        "fasal ke liye", "kheti ke liye", "kaataai kab", "bowaai kab",
        "kal kaisa", "aaj kaisa", "is hafte", "agle hafte", "7 din",
    ],
    price: [
        "daam", "bhav", "price", "rate", "mol", "kya bik raha", "kitne mein bik",
        "mandi mein", "market mein", "gehu ka daam", "dhan ka daam",
        "kitne ka", "kya rate", "bhav kya hai", "daam kya hai",
    ],
    stock: [
        "stock", "inventory", "kitna bacha", "kitna hai", "mera stock", "mera mal",
        "godown", "bhandaran", "kitna stored", "kitna rakha", "mere paas kitna",
        "total stock", "kya bacha",
    ],
    sales: [
        "bikri", "sales", "kitna becha", "pichle mahine", "is mahine",
        "total bikri", "revenue", "income", "kitna kamaya", "profit", "munafa",
    ],
};

function detectIntent(query: string): string {
    const q = query.toLowerCase();

    // PRIORITY 1: Prediction (check first!)
    if (PREDICTION_PHRASES.some(p => q.includes(p))) {
        return "prediction";
    }

    // PRIORITY 2: Weather combos
    const weatherCombos = [
        "fasal ke liye", "kheti ke liye", "acha din", "accha din", "best din",
        "sahi din", "kab karein", "kab kaatunga", "kaataai kab", "bowaai kab",
    ];
    if (weatherCombos.some(w => q.includes(w))) {
        return "weather";
    }

    // PRIORITY 3: Price (only if asking about CURRENT price or generic price)
    const currentPriceWords = [
        "aaj ka daam", "abhi ka daam", "current price", "aaj kitna",
        "abhi kitna", "kya chal raha", "bhav kya hai", "daam kya hai"
    ];
    // If it contains "daam" or "bhav" but NOT prediction words, it falls through to scoring

    // Score each intent
    const scores: Record<string, number> = {};
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
        scores[intent] = patterns.filter(p => q.includes(p)).length;
    }

    // Find highest score
    const topIntent = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    if (topIntent && topIntent[1] > 0) {
        return topIntent[0];
    }

    return "general";
}

export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { query } = await req.json();
        await dbConnect();

        // 1. Fetch Farmer Profile
        const user = await User.findById(userId);
        const userCrops = await Crop.find({ userId }).distinct("cropName");

        const farmerProfile = {
            _id: userId,
            name: user?.name || "Farmer",
            city: user?.city || null,
            state: user?.state || "Madhya Pradesh",
            crops: userCrops.length > 0 ? userCrops : ["Wheat", "Rice"]
        };

        // 2. Detect Intent
        const intent = detectIntent(query);
        console.log("Intent detected:", intent, "for query:", query);

        // 3. Route to specialized handlers
        switch (intent) {
            case "weather":
                if (!farmerProfile.city) {
                    return NextResponse.json({
                        success: true,
                        intent: "weather_query",
                        query: query,
                        advice: "Mausam batane ke liye aapki location chahiye! 📍 Aap kaunse shehar ya district mein hain? Batayein toh sahi mausam bataunga! 🌤️",
                        translation: query
                    });
                }
                const weatherAnswer = await weatherAgent(query, farmerProfile.city, farmerProfile.crops);
                return NextResponse.json({ success: true, intent: "weather_query", query, advice: weatherAnswer, translation: query });

            case "prediction":
                const predictionData = await handleMLPrediction(query, farmerProfile.crops);
                return NextResponse.json(predictionData);

            case "price":
                const priceAnswer = await getCropPrice(query, farmerProfile.state);
                return NextResponse.json({ success: true, intent: "price_query", query, advice: priceAnswer, translation: query });

            case "stock":
                const stockAnswer = await getFarmerStock(userId);
                return NextResponse.json({ success: true, intent: "stock_query", query, advice: stockAnswer, translation: query });

            case "sales":
                const salesAnswer = await getFarmerSales(userId);
                return NextResponse.json({ success: true, intent: "sales_query", query, advice: salesAnswer, translation: query });
        }

        // 4. Default: General AI with rich context
        const currentSeason = new Date().getMonth() > 5 && new Date().getMonth() < 10 ? "Kharif" : "Rabi";

        const contextString = `
You are KisanDB AI assistant for farmer ${farmerProfile.name} from ${farmerProfile.city || "Unknown Location"}, ${farmerProfile.state}.
They grow: ${farmerProfile.crops.join(', ')}.
Current Season: ${currentSeason}.
Current Location provided: ${farmerProfile.city || "Not Set"}.

YOUR JOB:
1. Answer directly based on farmer's context provided.
2. Mix Hindi + English naturally.
3. NEVER say 'dashboard par jao' or 'khud track karo'. 
4. Be helpful, professional and friendly.
5. If they ask about mandi or prices and my specialized router missed it, you have access to their crop list to give generic advice.
`;

        const aiResponse = await generateResponse(query, contextString);
        return NextResponse.json({
            success: true,
            intent: "general_ai",
            query: query,
            advice: aiResponse,
            translation: query
        });

    } catch (error: any) {
        console.error("Query API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
