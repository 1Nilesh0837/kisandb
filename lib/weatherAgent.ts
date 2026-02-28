import { getForecast, getCurrentWeather } from "./weatherService";
import { generateResponse } from "./ai";
import dbConnect from "./db";
import mongoose from "mongoose";
import { predictCropPrices } from "./prediction";

// Time keywords detection
function detectTimeIntent(query: string): "today" | "tomorrow" | "week" | "general" {
    const q = query.toLowerCase();
    if (q.includes("kal") || q.includes("tomorrow") || q.includes("agle din")) return "tomorrow";
    if (q.includes("aaj") || q.includes("today") || q.includes("abhi")) return "today";
    if (q.includes("hafte") || q.includes("week") || q.includes("7 din")) return "week";
    return "general";
}

// Crop keywords detection
function detectCropIntent(query: string): string | null {
    const crops: Record<string, string[]> = {
        "Wheat": ["gehu", "wheat", "gehun"],
        "Rice": ["dhan", "rice", "chawal"],
        "Maize": ["makka", "corn", "maize"],
        "Mustard": ["sarson", "mustard"],
        "Gram": ["chana", "gram", "chickpea"],
        "Onion": ["pyaaz", "onion"],
        "Tomato": ["tamatar", "tomato"],
    };
    const q = query.toLowerCase();
    for (const [crop, keywords] of Object.entries(crops)) {
        if (keywords.some(k => q.includes(k))) return crop;
    }
    return null;
}

/**
 * FIX 3: Get Crop Price from MongoDB
 */
export async function getCropPrice(cropQuery: string, farmerState: string): Promise<string> {
    const cropName = detectCropIntent(cropQuery) || "Wheat";
    const englishCrop = cropName;

    try {
        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");

        const priceRecord = await db.collection("prices").findOne(
            {
                $or: [
                    { crop: englishCrop },
                    { commodity: englishCrop },
                    { Commodity: englishCrop },
                    { cropName: englishCrop },
                ],
                // state: farmerState // Simplified for better matches
            },
            {
                sort: {
                    date: -1,
                    Date: -1,
                    price_date: -1,
                    "Price Date": -1,
                }
            }
        );

        const modalPrice =
            priceRecord?.modal_price ||
            priceRecord?.["Modal Price"] ||
            priceRecord?.modalPrice ||
            priceRecord?.modal ||
            priceRecord?.price ||
            null;

        const minPrice =
            priceRecord?.min_price ||
            priceRecord?.["Min Price"] ||
            priceRecord?.minPrice ||
            null;

        const maxPrice =
            priceRecord?.max_price ||
            priceRecord?.["Max Price"] ||
            priceRecord?.maxPrice ||
            null;

        const mandi = priceRecord?.mandi || priceRecord?.Market || priceRecord?.market || "N/A";
        const date = priceRecord?.date || priceRecord?.Date || priceRecord?.price_date || "N/A";

        if (priceRecord && modalPrice) {
            const advice = modalPrice > 2400
                ? "✅ Daam accha hai — bechne ka sahi waqt!"
                : "⏳ Daam thoda kam hai — ruko ya local mandi check karo.";

            return `
${cropName} ka aaj ka daam 🌾

💰 Modal Price: ₹${modalPrice}/quintal
📉 Min Price: ₹${minPrice || "N/A"}/quintal
📈 Max Price: ₹${maxPrice || "N/A"}/quintal
🏪 Mandi: ${mandi}
📅 Date: ${date}

${advice}
`.trim();
        } else {
            return `${cropName} का भाव अभी डेटाबेस में नहीं मिला। अपनी लोकल मंडी से संपर्क करें। 📞`;
        }
    } catch (error) {
        console.error("Price fetch error:", error);
        return "Price fetch karne mein error aaya. Thodi der mein try karein. 🔄";
    }
}

/**
 * NEW: Handle ML Prediction Request
 */
export async function handleMLPrediction(query: string, farmerCrops: string[]): Promise<any> {
    const cropName = detectCropIntent(query) || (farmerCrops?.[0]) || "Wheat";

    try {
        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");

        // Fetch historical data for this crop
        const historicalData = await db.collection("prices")
            .find({
                $or: [
                    { crop: cropName },
                    { commodity: cropName },
                    { Commodity: cropName },
                    { cropName: cropName }
                ]
            })
            .sort({ date: -1, price_date: -1, Date: -1 })
            .limit(30)
            .toArray();

        if (historicalData.length < 3) {
            return {
                success: true,
                intent: "price_prediction",
                advice: `${cropName} ke liye prediction karne ke liye kaafi data nahi mila. Mandi ke bhav check karte rahein! 📊`,
                translation: query
            };
        }

        // Map to format required by predictCropPrices
        const formattedData = historicalData.map(d => ({
            date: new Date(d.date || d.price_date || d.Date),
            modalPrice: Number(d.modal_price || d["Modal Price"] || d.modalPrice || d.modal || d.price || 0)
        })).filter(d => !isNaN(d.date.getTime()) && d.modalPrice > 0);

        if (formattedData.length < 3) {
            return {
                success: true,
                intent: "price_prediction",
                advice: `${cropName} data processing mein issue aaya. Kripya baad mein check karein.`,
                translation: query
            };
        }

        const summary = predictCropPrices(cropName, formattedData, 7);

        return {
            success: true,
            intent: "price_prediction",
            prediction: summary,
            advice: `Agle 7 dinon mein ${cropName} ka bhav ₹${summary.bestSellPrice} tak ja sakta hai. Prediction confidence ${summary.confidence}% hai. 📈`,
            translation: query
        };
    } catch (error) {
        console.error("ML Prediction Error:", error);
        return {
            success: false,
            error: "Prediction error"
        };
    }
}

/**
 * FIX 4: Get Farmer Stock (Inventory)
 */
export async function getFarmerStock(userId: string): Promise<string> {
    try {
        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");

        const crops = await db.collection("crops").find({ userId: new mongoose.Types.ObjectId(userId) }).toArray();

        if (!crops || crops.length === 0) {
            return "Aapka koi stock record nahi mila. Dashboard mein jaake stock add karein! 📦";
        }

        let response = "📦 Aapka Current Stock:\n\n";
        let totalValue = 0;

        crops.forEach((item: any) => {
            const value = (item.quantity || 0) * (item.pricePerQuintal || 0);
            totalValue += value;
            response += `🌾 ${item.cropName}\n`;
            response += `   Quantity: ${item.quantity} Quintal\n`;
            response += `   Price: ₹${item.pricePerQuintal}/qtl\n`;
            response += `   Value: ₹${value.toLocaleString()}\n\n`;
        });

        response += `💰 Total Stock Value: ₹${totalValue.toLocaleString()}`;
        return response;
    } catch (error) {
        console.error("Stock fetch error:", error);
        return "Stock fetch karne mein problem aayi. 🔄";
    }
}

/**
 * FIX 6: Get Farmer Sales Summary
 */
export async function getFarmerSales(userId: string): Promise<string> {
    try {
        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");

        const sales = await db.collection("sales").find({ userId: new mongoose.Types.ObjectId(userId) }).toArray();

        if (!sales || sales.length === 0) {
            return "Aapki koi sales record nahi mili. 📈";
        }

        let response = "💰 Aapki Kul Bikri (Sales):\n\n";
        let totalEarnings = 0;
        let totalProfit = 0;

        sales.forEach((sale: any) => {
            totalEarnings += (sale.totalAmount || 0);
            totalProfit += (sale.profit || 0);
            response += `✅ ${sale.cropName}: ₹${(sale.totalAmount || 0).toLocaleString()} (${sale.quantity} qtl)\n`;
        });

        response += `\n💵 Total Revenue: ₹${totalEarnings.toLocaleString()}`;
        response += `\n📈 Total Profit: ₹${totalProfit.toLocaleString()}`;
        return response;
    } catch (error) {
        console.error("Sales fetch error:", error);
        return "Sales data fetch karne mein problem aayi. 🔄";
    }
}

// Main agent function
export async function weatherAgent(
    userQuery: string,
    city: string = "Lucknow",
    farmerCrops: string[] = ["Gehu", "Sarson"]
): Promise<string> {
    try {
        // Step 1: Detect what user wants
        const timeIntent = detectTimeIntent(userQuery);
        const cropIntent = detectCropIntent(userQuery);

        // Step 2: Fetch real weather data
        const [forecast, current] = await Promise.all([
            getForecast(city),
            getCurrentWeather(city),
        ]);

        // Step 3: Pick relevant weather data
        let relevantWeather: any;
        let timeLabel = "";

        if (timeIntent === "today") {
            relevantWeather = forecast[0];
            timeLabel = "Aaj";
        } else if (timeIntent === "tomorrow") {
            relevantWeather = forecast[1];
            timeLabel = "Kal";
        } else if (timeIntent === "week") {
            relevantWeather = forecast;
            timeLabel = "Agle 7 Din";
        } else {
            relevantWeather = forecast.slice(0, 3);
            timeLabel = "Aane Wale Dinon Mein";
        }

        // Step 4: Build context for AI
        const weatherContext = JSON.stringify(relevantWeather, null, 2);

        const cropContext = cropIntent
            ? `Farmer is asking specifically about ${cropIntent} crop.`
            : `Farmer grows: ${farmerCrops.join(", ")}`;

        // Step 5: Call AI with weather data
        const prompt = `
You are KisanDB — an expert Indian farming assistant that speaks Hindi and English.

A farmer in ${city} asked: "${userQuery}"

REAL WEATHER DATA FOR ${timeLabel.toUpperCase()}:
${weatherContext}

${cropContext}
Location: ${city}, India
Current temperature: ${current.main?.temp}°C
Current condition: ${current.weather?.[0]?.description}

YOUR JOB:
1. Answer the farmer's question DIRECTLY
2. Give the actual weather prediction with real numbers from the data above
3. Give specific crop advice based on the weather
4. Keep answer SHORT — max 3-4 sentences
5. Use emojis to make it visual
6. Mix Hindi + English naturally
7. NEVER say "mausam vibhag ki website par jaao" — you ARE the weather expert!
8. Be conversational and friendly

EXAMPLE GOOD ANSWERS:
Q: "Kal mausam kaisa rahega?"
A: "Kal ${city} mein halki baarish hogi 🌧️ Temperature 18-22°C rahega. Humidity zyada hogi isliye Gehu ki kaataai kal mat karna — parso karo! ✅"

Q: "Kya aaj Gehu kaat sakta hoon?"
A: "Aaj mausam bilkul sahi hai Gehu kaatne ke liye! ☀️ Temperature 26°C, koi baarish nahi. Subah 6-10 baje best time rahega. 🌾"
`;

        // Internal AI call
        const aiResponse = await generateResponse(prompt, "Hindi + English");

        if (aiResponse) {
            return aiResponse;
        }

        return generateFallbackAnswer(userQuery, timeIntent, relevantWeather, cropIntent, city, timeLabel);

    } catch (error) {
        console.error("Weather Agent Error:", error);
        return "Weather data fetch mein problem aayi. Thodi der mein try karein! 🔄";
    }
}

// Smart fallback WITHOUT AI call
function generateFallbackAnswer(
    query: string,
    timeIntent: string,
    weather: any,
    crop: string | null,
    city: string,
    timeLabel: string
): string {
    const q = query.toLowerCase();
    const isBestDayQuery = q.includes("acha din") || q.includes("best din") || q.includes("sahi din") || q.includes("fasal ke liye");
    const cropName = crop || "fasal";

    if (isBestDayQuery && Array.isArray(weather)) {
        let bestDay = null;
        for (const day of weather) {
            const temp = day.temp || 25;
            const rain = day.rain_mm || 0;
            const wind = day.wind_speed || 10;

            if (temp >= 20 && temp <= 32 && rain < 5 && wind < 25) {
                bestDay = day;
                break;
            }
        }

        if (bestDay) {
            return `${cropName} ke liye BEST din hai — ${bestDay.date}! 🌟\n` +
                `Temperature: ${bestDay.temp.toFixed(0)}°C ✅\n` +
                `Baarish: Nahi ✅\n` +
                `Hawa: Halki ✅\n` +
                `${cropName} ki kaataai/bowaai ke liye ekdum perfect! 🌾`;
        } else {
            const sortedByRain = [...weather].sort((a, b) => (a.rain_mm || 0) - (b.rain_mm || 0));
            const bestAvailable = sortedByRain[0];
            return `Agle 7 dinon mein mausam thoda mushkil hai. ${bestAvailable.date} ko try karein — sabse better din yahi hai. ⚠️`;
        }
    }

    if (!weather || (Array.isArray(weather) && weather.length === 0)) {
        return "Mausam data load ho raha hai... 🔄";
    }

    const w = Array.isArray(weather) ? weather[0] : weather;
    const rain = w.rain_mm || 0;
    const temp = w.temp || 24;

    let answer = `${timeLabel} ${city} mein `;

    if (rain > 20) {
        answer += `bhari baarish hogi ⛈️ (${rain.toFixed(0)}mm). `;
    } else if (rain > 8) {
        answer += `halki baarish hogi 🌧️ (${rain.toFixed(0)}mm). `;
    } else if (temp > 38) {
        answer += `bahut garmi hogi 🔥 (${temp}°C). `;
    } else if (temp < 8) {
        answer += `bahut thandi hogi 🥶 (${temp}°C). `;
    } else {
        answer += `mausam theek rahega ⛅ (${temp}°C). `;
    }

    if (rain > 8) {
        answer += `${cropName} ki kaataai MAT karna — baarish mein fasal kharab ho sakti hai! 🚫`;
    } else if (temp > 38) {
        answer += `${cropName} ko subah-shaam paani dena — dopahar mein garmi se bachao! 🌡️`;
    } else {
        answer += `${cropName} ke liye mausam accha hai! Kaam karein. ✅`;
    }

    return answer;
}
