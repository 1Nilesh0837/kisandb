import { useState, useEffect } from "react";
import { getForecast, getCurrentWeather, WeatherDay, WeatherAlert } from "@/lib/weatherService";
import { generateAdvisories } from "@/lib/advisoryEngine";

export function useWeatherData(
    city: string,
    crops: string[],
    season: string
) {
    const [forecast, setForecast] = useState<WeatherDay[]>([]);
    const [current, setCurrent] = useState<any>(null);
    const [advisories, setAdvisories] = useState<WeatherAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [f, c] = await Promise.all([
                    getForecast(city),
                    getCurrentWeather(city),
                ]);
                setForecast(f);
                setCurrent(c);
                setAdvisories(
                    generateAdvisories(f, crops, season)
                );
            } catch (err) {
                setError(
                    "Weather data load nahi ho pa rahi. " +
                    "Internet check karein."
                );
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [city, season]);

    return { forecast, current, advisories, loading, error };
}
