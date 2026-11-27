"use client";

import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { Feature, Polygon as GeoPolygon } from "geojson";
import type { ReplayData, SpreadForecast } from "../types";

interface ReplayMapProps {
  data: ReplayData;
  hoursSinceDetection: number;
  scenario: "slow" | "fast";
  villageInForecast: boolean;
}

function toFeature(forecast: SpreadForecast): Feature<GeoPolygon> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: forecast.geometry.coordinates as GeoPolygon["coordinates"],
    },
  };
}

export default function ReplayMap({
  data,
  hoursSinceDetection,
  scenario,
  villageInForecast,
}: ReplayMapProps) {
  const firstDetection = data.detections[0];
  const center: [number, number] = firstDetection
    ? [firstDetection.lat, firstDetection.lng]
    : [-15.35, 35.3];
  const forecast = data.spread_forecasts.find(
    (item) =>
      item.scenario === scenario &&
      item.hours_since_detection <= hoursSinceDetection,
  );

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full min-h-[420px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {data.reserve && (
        <GeoJSON
          data={{
            type: "Feature",
            properties: { name: data.reserve.name },
            geometry: {
              type: "Polygon",
              coordinates: data.reserve.geom.coordinates as GeoPolygon["coordinates"],
            },
          }}
          style={{ color: "#4cd7f6", weight: 2, fillOpacity: 0.08 }}
        />
      )}

      {forecast && (
        <GeoJSON
          key={`${forecast.scenario}-${forecast.hours_since_detection}`}
          data={toFeature(forecast)}
          style={{
            color: scenario === "fast" ? "#ff5722" : "#4cd7f6",
            weight: 2,
            dashArray: scenario === "slow" ? "6 5" : undefined,
            fillOpacity: 0.24,
          }}
        />
      )}

      {data.detections.map((detection) => (
        <CircleMarker
          key={detection.id}
          center={[detection.lat, detection.lng]}
          radius={8}
          pathOptions={{ color: "#fff0e8", weight: 2, fillColor: "#ff5722", fillOpacity: 1 }}
        >
          <Tooltip direction="top" permanent>
            Satellite detection
          </Tooltip>
        </CircleMarker>
      ))}

      {data.villages.map((village) => (
        <CircleMarker
          key={village.id}
          center={[village.lat, village.lng]}
          radius={7}
          pathOptions={{
            color: villageInForecast ? "#ffb5a0" : "#4cd7f6",
            weight: 2,
            fillColor: villageInForecast ? "#ff5722" : "#003640",
            fillOpacity: 0.95,
          }}
        >
          <Tooltip direction="top" permanent>
            {village.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
