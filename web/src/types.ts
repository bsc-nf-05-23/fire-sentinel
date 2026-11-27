/** Front-end API contract, matching the shared data-model examples (WGS84). */
export interface Reserve {
  id: number;
  name: string;
  geom: { type: "Polygon"; coordinates: number[][][] };
}

export interface FireEvent {
  id: number;
  name: string;
  reserve_id: number;
  started_at: string;
}

export interface FireDetection {
  id: number;
  detected_at: string;
  lat: number;
  lng: number;
  confidence: string;
  frp: number;
  satellite: string;
}

export interface Village {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface HourlyWind {
  ts: string;
  speed_ms: number;
  /** Degrees the wind blows FROM, clockwise from north. */
  direction_deg: number;
}

export interface SpreadForecast {
  hours_since_detection: number;
  scenario: "slow" | "fast";
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

export interface VillageAlert {
  village_id: number;
  window_min_h: number;
  window_max_h: number;
  message: string;
}

export interface ValidationResult {
  event_id: number;
  hits: number;
  total: number;
  notes: string | null;
}

/** Grouping used by the front end; each row retains its agreed API shape. */
export interface ReplayData {
  reserve: Reserve | null;
  event: FireEvent;
  detections: FireDetection[];
  villages: Village[];
  wind_hourly: HourlyWind[];
  spread_forecasts: SpreadForecast[];
  village_alerts: VillageAlert[];
  validation_results: ValidationResult[];
}
