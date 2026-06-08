import { Type, type Static } from "typebox";
import type { FirstToolConfig } from "../config.js";
import type {
  ForecastResponse,
  GeocodeResponse,
  WeatherCurrentContext
} from "./weather-current.types.js";

export const weatherCurrentParameters = Type.Object({
  city: Type.String({ description: "City name, for example Tokyo" })
});

export type WeatherCurrentParameters = Static<typeof weatherCurrentParameters>;

export async function executeWeatherCurrent(
  { city }: WeatherCurrentParameters,
  config: FirstToolConfig,
  context: WeatherCurrentContext
) {
  context.signal?.throwIfAborted();

  const geocodingBaseUrl = config.geocodingBaseUrl ?? "https://geocoding-api.open-meteo.com/v1/search";
  const forecastBaseUrl = config.forecastBaseUrl ?? "https://api.open-meteo.com/v1/forecast";
  const language = config.language ?? "en";

  const geocodeUrl = new URL(geocodingBaseUrl);
  geocodeUrl.searchParams.set("name", city);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", language);
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

  const geocode = (await geocodeRes.json()) as GeocodeResponse;
  const first = geocode.results?.[0];
  if (!first) {
    return {
      ok: false,
      step: "geocode",
      message: "City not found"
    };
  }

  const forecastUrl = new URL(forecastBaseUrl);
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

  const forecast = (await forecastRes.json()) as ForecastResponse;
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

