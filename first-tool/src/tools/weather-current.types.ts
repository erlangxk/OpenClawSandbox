export type GeocodeResponse = {
  results?: Array<{
    name?: string;
    latitude: number;
    longitude: number;
    country?: string;
  }>;
};

export type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
};

export type WeatherCurrentContext = {
  signal?: AbortSignal;
};
