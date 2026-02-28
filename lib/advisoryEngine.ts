import { WeatherDay, WeatherAlert } from "./weatherService";

export function generateAdvisories(
    forecast: WeatherDay[],
    crops: string[],
    season: string
): WeatherAlert[] {

    const alerts: WeatherAlert[] = [];

    forecast.forEach((day, index) => {
        const d = index === 0 ? "Aaj"
            : index === 1 ? "Kal"
                : index + " din mein";

        // HEAVY RAIN
        if (day.rain_mm > 20) {
            alerts.push({
                type: "danger",
                emoji: "⛈️",
                title_en: "Heavy Rain Alert — " +
                    (index === 0 ? "Today" : "In " + index + " Days"),
                title_hi: d + " Bhari Baarish Aayegi!",
                message_en: day.rain_mm.toFixed(0) +
                    "mm heavy rain expected. Stop all harvesting immediately.",
                message_hi: d + " " + day.rain_mm.toFixed(0) +
                    "mm bhari baarish aane wali hai. Fasal kaatna turant band karein!",
                action_en: "Cover stored grain. Clear drainage channels. Do not harvest.",
                action_hi: "Anaj dhak dein. Naali saaf karein. Kaataai bilkul mat karein.",
                crop: crops[0] || "Sabhi Fasal",
                days_until: index,
            });
        }

        // MODERATE RAIN
        else if (day.rain_mm > 8) {
            alerts.push({
                type: "warning",
                emoji: "🌧️",
                title_en: "Rain Expected — " +
                    (index === 0 ? "Today" : "In " + index + " Days"),
                title_hi: d + " Baarish Hogi",
                message_en: day.rain_mm.toFixed(0) +
                    "mm rain coming. Good for Kharif, protect Rabi.",
                message_hi: d + " " + day.rain_mm.toFixed(0) +
                    "mm baarish hogi. Kharif ke liye accha, Rabi bachao.",
                action_en: season === "kharif"
                    ? "Great time to sow Kharif crops!"
                    : "Protect Rabi crops from excess moisture.",
                action_hi: season === "kharif"
                    ? "Kharif bowaai ka sahi waqt hai!"
                    : "Rabi fasal ko zyada nami se bachayein.",
                crop: season === "kharif" ? "Dhan/Makka" : "Gehu/Sarson",
                days_until: index,
            });
        }

        // EXTREME HEAT
        if (day.temp > 42) {
            alerts.push({
                type: "danger",
                emoji: "🔥",
                title_en: "Extreme Heat — " + day.temp + "°C",
                title_hi: d + " Ati Garmi — " + day.temp + "°C",
                message_en: "Temperature " + day.temp +
                    "°C. Crops may wilt and die.",
                message_hi: d + " " + day.temp +
                    "°C tak garmi jayegi. Fasal murjha sakti hai!",
                action_en: "Water crops only in early morning and evening.",
                action_hi: "Sirf subah jaldi aur shaam ko sinchai karein. Dopahar mein bilkul nahi.",
                crop: "Sabhi Fasal",
                days_until: index,
            });
        }

        // FROST
        if (day.temp < 4) {
            alerts.push({
                type: "danger",
                emoji: "🥶",
                title_en: "Frost Warning — " + day.temp + "°C",
                title_hi: d + " Pala Padega — " + day.temp + "°C",
                message_en: "Near-freezing. Wheat and Mustard at serious risk.",
                message_hi: "Pala padne ka bada khatra! Gehu aur Sarson ko abhi bachao.",
                action_en: "Light irrigation before night protects crops from frost.",
                action_hi: "Raat se pehle halki sinchai karein — yeh pala se bachata hai.",
                crop: "Gehu / Sarson",
                days_until: index,
            });
        }

        // STRONG WINDS
        if (day.wind_speed > 40) {
            alerts.push({
                type: "warning",
                emoji: "💨",
                title_en: "Strong Winds — " + day.wind_speed + " km/h",
                title_hi: d + " Tez Hawa — " + day.wind_speed + " km/h",
                message_en: "High winds may damage tall crops.",
                message_hi: "Tez hawa se Gehu aur Makka gir sakti hai!",
                action_en: "Support tall crops with bamboo before wind arrives.",
                action_hi: "Lamba fasal ko baans se sahara dein. Abhi karo!",
                crop: "Gehu / Makka",
                days_until: index,
            });
        }

        // PERFECT DAY
        if (
            day.temp >= 22 && day.temp <= 32 &&
            day.humidity >= 40 && day.humidity <= 70 &&
            day.rain_mm < 3 &&
            day.wind_speed < 20
        ) {
            alerts.push({
                type: "good",
                emoji: "✅",
                title_en: "Perfect Farming Day!",
                title_hi: d + " Kheti Ka Best Din!",
                message_en: "Ideal weather for all farming activities.",
                message_hi: "Mausam bilkul perfect hai! Aaj khet mein kaam karein.",
                action_en: "Best day for harvesting, sowing or spraying.",
                action_hi: "Kaataai, bowaai ya dawai chhidkaav — sab ke liye best din!",
                crop: "Sabhi Fasal",
                days_until: index,
            });
        }
    });

    // Sort: danger first
    const order = { danger: 0, warning: 1, good: 2 };
    return (alerts as any[])
        .sort((a, b) => (order[a.type as keyof typeof order] || 0) - (order[b.type as keyof typeof order] || 0))
        .slice(0, 5);
}
