import { Type, type Static } from "typebox";

export const firstToolConfigSchema = Type.Object({
  geocodingBaseUrl: Type.Optional(
    Type.String({ description: "Override the Open-Meteo geocoding API base URL." })
  ),
  forecastBaseUrl: Type.Optional(
    Type.String({ description: "Override the Open-Meteo forecast API base URL." })
  ),
  language: Type.Optional(
    Type.String({ description: "Language used for geocoding lookup results. Defaults to en." })
  )
});

export type FirstToolConfig = Static<typeof firstToolConfigSchema>;
