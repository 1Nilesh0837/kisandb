import { NextResponse } from "next/server";

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "";
    const commodity = searchParams.get("commodity") || "Wheat";
    const limit = searchParams.get("limit") || "50";

    try {
        const params = new URLSearchParams({
            "api-key": API_KEY!,
            "format": "json",
            "limit": limit,
            "filters[commodity]": commodity,
        });

        if (state) {
            params.set("filters[state]", state);
        }

        const res = await fetch(
            `${BASE_URL}?${params}`,
            {
                next: { revalidate: 3600 },
                // Cache for 1 hour
            }
        );

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const records = data.records || [];

        // Clean and normalize records
        const cleaned = records
            .map((r: any) => ({
                mandi: r.market || r.Market || "",
                district: r.district || r.District || "",
                state: r.state || r.State || "",
                commodity: r.commodity || r.Commodity || "",
                variety: r.variety || r.Variety || "",
                min_price: parseFloat(
                    String(r.min_price || r["Min Price"] || 0)
                        .replace(/,/g, "")
                ),
                max_price: parseFloat(
                    String(r.max_price || r["Max Price"] || 0)
                        .replace(/,/g, "")
                ),
                modal_price: parseFloat(
                    String(r.modal_price || r["Modal Price"] || 0)
                        .replace(/,/g, "")
                ),
                date: r.price_date || r.arrival_date ||
                    r["Price Date"] ||
                    new Date().toISOString().split("T")[0],
            }))
            .filter((r: any) => r.modal_price > 0)
            .sort((a: any, b: any) => b.modal_price - a.modal_price);

        return NextResponse.json({
            success: true,
            total: cleaned.length,
            records: cleaned,
            source: "data.gov.in — Agmarknet",
            cached: false,
        });

    } catch (error) {
        console.error("Mandi API error:", error);

        // Return error — component will show fallback message
        return NextResponse.json({
            success: false,
            error: "data.gov.in API se data nahi mila",
            records: [],
        }, { status: 500 });
    }
}
