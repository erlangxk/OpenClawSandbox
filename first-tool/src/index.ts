import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import { firstToolConfigSchema } from "./config.js";
import { executeWeatherCurrent, weatherCurrentParameters } from "./tools/weather-current.js";

const weatherCurrentTool = {
  name: "weather_current",
  label: "Current Weather",
  description: "Get current weather by city name using the Open-Meteo API.",
  parameters: weatherCurrentParameters,
  execute: executeWeatherCurrent
};

export default defineToolPlugin({
  id: "first-tool",
  name: "First Tool",
  description: "Example OpenClaw tools plugin.",
  configSchema: firstToolConfigSchema,
  tools: (tool) => [tool(weatherCurrentTool)]
});
