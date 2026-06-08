import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
export default defineToolPlugin({
    id: "first-tool",
    name: "First Tool",
    description: "Example OpenClaw tools plugin.",
    tools: (tool) => [
        tool({
            name: "weather_current",
            label: "Current Weather",
            description: "Get current weather by city name using the Open-Meteo API.",
            parameters: Type.Object({
                city: Type.String({ description: "City name, for example Tokyo" })
            }),
            async execute({ city }, _config, context) {
                context.signal?.throwIfAborted();
                const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
                geocodeUrl.searchParams.set("name", city);
                geocodeUrl.searchParams.set("count", "1");
                geocodeUrl.searchParams.set("language", "en");
                geocodeUrl.searchParams.set("format", "json");
                const geocodeRes = await fetch(geocodeUrl, { signal: context.signal });
                if (!geocodeRes.ok) {
                    return {
                        ok: false,
                        step: "geocode",
                        status: geocodeRes.status,
                        message: "Failed to resolve city name"
                    };
                }
                const geocode = (await geocodeRes.json());
                const first = geocode.results?.[0];
                if (!first) {
                    return {
                        ok: false,
                        step: "geocode",
                        message: "City not found"
                    };
                }
                const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
                forecastUrl.searchParams.set("latitude", String(first.latitude));
                forecastUrl.searchParams.set("longitude", String(first.longitude));
                forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m");
                const forecastRes = await fetch(forecastUrl, { signal: context.signal });
                if (!forecastRes.ok) {
                    return {
                        ok: false,
                        step: "forecast",
                        status: forecastRes.status,
                        message: "Failed to fetch weather"
                    };
                }
                const forecast = (await forecastRes.json());
                return {
                    ok: true,
                    city: first.name ?? city,
                    country: first.country ?? "unknown",
                    latitude: first.latitude,
                    longitude: first.longitude,
                    temperatureC: forecast.current?.temperature_2m ?? null,
                    humidityPct: forecast.current?.relative_humidity_2m ?? null,
                    windSpeedKmh: forecast.current?.wind_speed_10m ?? null,
                    source: "open-meteo"
                };
            }
        })
    ]
});
