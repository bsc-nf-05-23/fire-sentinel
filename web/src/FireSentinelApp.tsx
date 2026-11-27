"use client";

import dynamic from "next/dynamic";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import { useEffect, useMemo, useState } from "react";
import { replayExample } from "./data/replay-example";
import type { ReplayData } from "./types";

const ReplayMap = dynamic(() => import("./components/ReplayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
      Loading map…
    </div>
  ),
});

const SCENARIOS = ["slow", "fast"] as const;

export default function FireSentinelApp({ data = replayExample }: { data?: ReplayData }) {
  const [hoursSinceDetection, setHoursSinceDetection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scenario, setScenario] = useState<"slow" | "fast">("fast");

  const maxHours = Math.max(
    0,
    ...data.spread_forecasts.map((forecast) => forecast.hours_since_detection),
  );
  const activeForecast = data.spread_forecasts.find(
    (forecast) =>
      forecast.scenario === scenario &&
      forecast.hours_since_detection <= hoursSinceDetection,
  );

  const villagesInForecast = useMemo(() => {
    if (!activeForecast) return new Set<number>();
    const forecastPolygon = polygon(
      activeForecast.geometry.coordinates as Parameters<typeof polygon>[0],
    );
    return new Set(
      data.villages
        .filter((village) =>
          booleanPointInPolygon(point([village.lng, village.lat]), forecastPolygon),
        )
        .map((village) => village.id),
    );
  }, [activeForecast, data.villages]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(
      () => setHoursSinceDetection((current) => Math.min(maxHours, Number((current + 0.25).toFixed(2)))),
      500,
    );
    return () => window.clearInterval(timer);
  }, [isPlaying, maxHours]);

  useEffect(() => {
    if (isPlaying && hoursSinceDetection >= maxHours) setIsPlaying(false);
  }, [hoursSinceDetection, isPlaying, maxHours]);

  const wind = data.wind_hourly[0];
  // direction_deg is the direction wind blows FROM; fire spreads downwind, in the opposite direction.
  const downwindDirection = wind ? (wind.direction_deg + 180) % 360 : null;
  const timeLabel = `${Math.floor(hoursSinceDetection)}h ${Math.round((hoursSinceDetection % 1) * 60)}m`;
  const alertByVillage = new Map(
    data.village_alerts.map((alert) => [alert.village_id, alert]),
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-surface-container-high bg-surface-container-lowest px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">
              Fire Sentinel Lite
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">Historical fire replay</h1>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
            Example data · not live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <section className="rounded-xl border border-secondary/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          This replay uses the brief’s placeholder examples to demonstrate the interface. Satellite detections are roughly 375 m pixels and satellites pass about every 12 hours. Wind data is coarse; forecasts and arrival windows are estimates. This is not an official warning system, and SMS messages are simulated.
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high px-4 py-3">
              <div>
                <h2 className="font-semibold">{data.event.name}</h2>
                <p className="font-mono text-xs text-on-surface-variant">
                  Detection time {data.detections[0]?.detected_at ?? "unavailable"}
                </p>
              </div>
              <div className="flex items-center gap-2" aria-label="Forecast scenario">
                {SCENARIOS.map((option) => {
                  const available = data.spread_forecasts.some(
                    (forecast) => forecast.scenario === option,
                  );
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!available}
                      onClick={() => setScenario(option)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40 ${
                        scenario === option
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-surface-container-high text-on-surface-variant"
                      }`}
                      title={available ? `${option} forecast` : `No ${option} forecast in the example data`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[min(62vh,720px)] min-h-[420px] p-2 sm:p-3">
              <ReplayMap
                data={data}
                hoursSinceDetection={hoursSinceDetection}
                scenario={scenario}
                villageInForecast={villagesInForecast.size > 0}
              />
            </div>

            <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (hoursSinceDetection >= maxHours) setHoursSinceDetection(0);
                      setIsPlaying((playing) => !playing);
                    }}
                    className="min-w-24 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-white hover:brightness-110"
                  >
                    {isPlaying ? "Pause" : hoursSinceDetection >= maxHours ? "Replay" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setHoursSinceDetection(0);
                    }}
                    className="rounded-lg border border-surface-container-high px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface"
                  >
                    Reset
                  </button>
                </div>
                <span className="font-mono text-sm text-secondary">T+{timeLabel}</span>
              </div>
              <label className="mt-4 block">
                <span className="sr-only">Hours since first detection</span>
                <input
                  type="range"
                  min={0}
                  max={maxHours || 1}
                  step={0.25}
                  value={hoursSinceDetection}
                  onChange={(event) => {
                    setIsPlaying(false);
                    setHoursSinceDetection(Number(event.target.value));
                  }}
                  className="w-full accent-orange-500"
                />
                <span className="flex justify-between font-mono text-[11px] text-on-surface-variant">
                  <span>Detection · 0h</span>
                  <span>Forecast sample · {maxHours}h</span>
                </span>
              </label>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
              <h2 className="font-semibold">Map layers</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-center justify-between gap-3">
                  <span>Fire detections</span>
                  <span className="text-primary">{data.detections.length} sample</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>Reserve outline</span>
                  <span className="text-on-surface-variant">Unavailable in example</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>Forecast geometry</span>
                  <span className="text-secondary">
                    {activeForecast ? `${scenario} · T+${activeForecast.hours_since_detection}h` : "Waiting for forecast time"}
                  </span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
              <h2 className="font-semibold">Hourly wind</h2>
              {wind ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Speed" value={`${wind.speed_ms} m/s`} />
                  <Metric label="Recorded" value={wind.ts.slice(11, 16) + " UTC"} />
                  <Metric label="Blows from" value={`${wind.direction_deg}°`} />
                  <Metric label="Downwind" value={`${downwindDirection}°`} />
                </div>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">No wind rows supplied.</p>
              )}
              <p className="mt-3 text-xs text-on-surface-variant">
                Fire spread is shown downwind, opposite the reported wind direction.
              </p>
            </section>

            <section className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
              <h2 className="font-semibold">Nearby villages</h2>
              <ul className="mt-3 space-y-3">
                {data.villages.map((village) => {
                  const alert = alertByVillage.get(village.id);
                  const inForecast = villagesInForecast.has(village.id);
                  return (
                    <li key={village.id} className="rounded-lg bg-surface-container p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{village.name}</span>
                        <span className={`text-xs ${inForecast ? "text-primary" : "text-secondary"}`}>
                          {inForecast ? "Inside forecast" : "Outside shown forecast"}
                        </span>
                      </div>
                      {alert && (
                        <>
                          <p className="mt-2 text-xs text-on-surface-variant">
                            Arrival window: {alert.window_min_h}–{alert.window_max_h} hours
                          </p>
                          <p className="mt-2 border-l-2 border-primary pl-2 text-xs leading-relaxed text-on-surface-variant">
                            Simulated SMS: “{alert.message}”
                          </p>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
              <h2 className="font-semibold">Reality check</h2>
              {data.validation_results.length ? (
                data.validation_results.map((result) => (
                  <p key={result.event_id} className="mt-2 text-sm">
                    {result.hits} of {result.total} later detections in forecast
                  </p>
                ))
              ) : (
                <p className="mt-2 text-sm text-on-surface-variant">
                  No validation results supplied. Hit rate is not available for this example.
                </p>
              )}
            </section>
          </aside>
        </section>
        <p className="text-center font-mono text-[11px] text-on-surface-variant">
          Coordinates use longitude, latitude (SRID 4326). All displayed records are illustrative placeholders.
        </p>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
