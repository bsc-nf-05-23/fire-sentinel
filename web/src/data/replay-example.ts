import type { ReplayData } from "../types";

/** Values from the brief's mock examples. They are placeholders, not observations. */
export const replayExample: ReplayData = {
  reserve: null, // The brief defines this shape but does not include a sample outline.
  event: {
    id: 1,
    name: "Example historical replay",
    reserve_id: 1,
    started_at: "2025-09-14T10:42:00Z",
  },
  detections: [
    {
      id: 1,
      detected_at: "2025-09-14T10:42:00Z",
      lat: -15.35,
      lng: 35.3,
      confidence: "nominal",
      frp: 4.2,
      satellite: "VIIRS",
    },
  ],
  villages: [{ id: 7, name: "Example Village", lat: -15.4, lng: 35.36 }],
  wind_hourly: [
    { ts: "2025-09-14T11:00:00Z", speed_ms: 4.5, direction_deg: 120 },
  ],
  spread_forecasts: [
    {
      hours_since_detection: 3,
      scenario: "fast",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.3, -15.35],
            [35.34, -15.37],
            [35.38, -15.36],
            [35.3, -15.35],
          ],
        ],
      },
    },
  ],
  village_alerts: [
    {
      village_id: 7,
      window_min_h: 2,
      window_max_h: 5,
      message:
        "Fire detected 8 km upwind. Likely to reach you in 2 to 5 hours. Move livestock and clear around homes.",
    },
  ],
  validation_results: [],
};
