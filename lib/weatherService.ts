const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const BASE = "https://api.openweathermap.org/data/2.5";

export interface WeatherDay {
    date: string;
    temp: number;
    humidity: number;
    wind_speed: number;
    condition: string;
    description: string;
    rain_mm: number;
}

export interface WeatherAlert {
    type: "danger" | "warning" | "good";
    emoji: string;
    title_en: string;
    title_hi: string;
    message_en: string;
    message_hi: string;
    action_en: string;
    action_hi: string;
    crop: string;
    days_until: number;
}

export async function getForecast(city: string): Promise<WeatherDay[]> {
    const res = await fetch(
        BASE + "/forecast?q=" + city +
        "&appid=" + API_KEY +
        "&units=metric&cnt=40"
    );
    const data = await res.json();

    if (!data.list) return [];

    const dailyMap = new Map<string, any[]>();
    data.list.forEach((item: any) => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyMap.has(date)) dailyMap.set(date, []);
        dailyMap.get(date)!.push(item);
    });

    return Array.from(dailyMap.entries())
        .slice(0, 7)
        .map(([date, items]) => ({
            date,
            temp: Math.round(
                items.reduce((s: number, i: any) =>
                    s + i.main.temp, 0) / items.length
            ),
            humidity: Math.round(
                items.reduce((s: number, i: any) =>
                    s + i.main.humidity, 0) / items.length
            ),
            wind_speed: Math.round(
                items.reduce((s: number, i: any) =>
                    s + i.wind.speed, 0) / items.length * 3.6
            ),
            condition: items[0].weather[0].main,
            description: items[0].weather[0].description,
            rain_mm: items.reduce((s: number, i: any) =>
                s + (i.rain?.["3h"] || 0), 0
            ),
        }));
}

export async function getCurrentWeather(city: string) {
    const res = await fetch(
        BASE + "/weather?q=" + city +
        "&appid=" + API_KEY + "&units=metric"
    );
    return res.json();
}
