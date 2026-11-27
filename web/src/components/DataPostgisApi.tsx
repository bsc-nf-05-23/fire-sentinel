import React, { useState } from 'react';
import {
  EventKey,
  INCIDENT_EVENTS,
  POSTGIS_API_ENDPOINTS,
  POSTGIS_SQL_PRESETS,
  SATELLITE_PASSES,
} from '../data/pyrotraceData';

interface DataPostgisApiProps {
  activeEvent: EventKey;
}

export const DataPostgisApi: React.FC<DataPostgisApiProps> = ({
  activeEvent,
}) => {
  const eventData = INCIDENT_EVENTS[activeEvent];

  const [selectedEndpointId, setSelectedEndpointId] = useState(
    POSTGIS_API_ENDPOINTS[0].id
  );
  const [responseVisible, setResponseVisible] = useState(true);
  const [executingApi, setExecutingApi] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState(
    POSTGIS_SQL_PRESETS[0].id
  );
  const [runningSql, setRunningSql] = useState(false);
  const [sqlRuntimeMs, setSqlRuntimeMs] = useState(
    POSTGIS_SQL_PRESETS[0].executionMs
  );

  const activeEndpoint =
    POSTGIS_API_ENDPOINTS.find((ep) => ep.id === selectedEndpointId) ||
    POSTGIS_API_ENDPOINTS[0];

  const activePreset =
    POSTGIS_SQL_PRESETS.find((p) => p.id === selectedPresetId) ||
    POSTGIS_SQL_PRESETS[0];

  const handleExecuteApi = () => {
    setExecutingApi(true);
    setTimeout(() => {
      setExecutingApi(false);
      setResponseVisible(true);
    }, 320);
  };

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(
      JSON.stringify(activeEndpoint.sampleResponse, null, 2)
    );
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 1600);
  };

  const handleRunSql = () => {
    setRunningSql(true);
    setTimeout(() => {
      setRunningSql(false);
      setSqlRuntimeMs(
        Number(
          (activePreset.executionMs * (0.88 + Math.random() * 0.25)).toFixed(1)
        )
      );
    }, 280);
  };

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)]">
      {/* Telemetry Ribbon */}
      <div className="w-full bg-surface-container-lowest px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high/40">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[15px]">
              database
            </span>
            <span className="tracking-widest uppercase font-semibold">
              PostgreSQL 16.4 + PostGIS 3.4.2
            </span>
          </div>
          <span className="text-surface-container-highest">/</span>
          <span className="text-on-surface-variant">
            POOL: psycopg3 (12/20 connections active)
          </span>
          <span className="text-surface-container-highest">/</span>
          <span className="text-on-surface-variant">
            ACTIVE_EVENT: {eventData.code}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-on-surface-variant">
          <span className="text-secondary">GiST Spatial Indexes: Healthy</span>
          <span>SRID: EPSG:4326 / EPSG:32736</span>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="w-full px-4 lg:px-8 py-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT COLUMN: REST Spatial API Endpoints (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          <div className="bg-surface-container-low p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  api
                </span>
                <span className="text-[17px] font-bold text-on-surface">
                  FastAPI Spatial Dispatch Endpoints
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-secondary">
                OpenAPI v2.4
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {POSTGIS_API_ENDPOINTS.map((ep) => {
                const selected = ep.id === activeEndpoint.id;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      setSelectedEndpointId(ep.id);
                      setResponseVisible(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                      selected
                        ? 'bg-surface-container-high ring-1 ring-secondary/40 shadow-md'
                        : 'bg-surface-container hover:bg-surface-container-high/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                            ep.method === 'POST'
                              ? 'bg-primary-container/25 text-primary'
                              : 'bg-secondary/20 text-secondary'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-on-surface truncate">
                          {ep.path}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant shrink-0 tabular-nums">
                        {ep.latencyMs}ms
                      </span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mt-1.5 leading-snug">
                      {ep.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Response Inspector */}
          <div className="bg-surface-container-low p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[11px] text-on-surface font-semibold truncate">
                {activeEndpoint.method} {activeEndpoint.path}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-mono text-[10px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">
                    content_copy
                  </span>
                  <span>{jsonCopied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApi}
                  className="px-3 py-1 rounded-lg bg-primary-container text-on-primary-container font-mono text-[10px] font-bold flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    play_arrow
                  </span>
                  <span>
                    {executingApi ? 'Running...' : 'Execute Request'}
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-2.5 rounded-lg font-mono text-[10px] text-secondary break-all">
              {activeEndpoint.params}
            </div>

            {responseVisible && (
              <pre className="bg-surface-container-lowest p-3 rounded-lg font-mono text-[10px] text-on-surface/90 overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(activeEndpoint.sampleResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PostGIS SQL Console & Satellite Pipeline (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-container-low p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  terminal
                </span>
                <span className="text-[17px] font-bold text-on-surface">
                  PostGIS Spatial Query Runner
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-secondary tabular-nums">
                  Exec Time: {sqlRuntimeMs}ms
                </span>
                <button
                  type="button"
                  onClick={handleRunSql}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-mono text-[10px] font-bold flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    bolt
                  </span>
                  <span>{runningSql ? 'Querying...' : 'Run Spatial Query'}</span>
                </button>
              </div>
            </div>

            {/* Preset Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-surface-container">
              {POSTGIS_SQL_PRESETS.map((preset) => {
                const isActive = preset.id === activePreset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setSqlRuntimeMs(preset.executionMs);
                    }}
                    className={`px-3 py-1.5 rounded-md font-mono text-[10px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-container-highest text-secondary font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <pre className="bg-surface-container-lowest p-3.5 rounded-lg font-mono text-[11px] text-on-surface overflow-x-auto leading-relaxed">
              {activePreset.sql}
            </pre>

            {/* Query Result Table */}
            <div className="rounded-lg bg-surface-container overflow-hidden">
              <div className="px-3 py-2 bg-surface-container-high flex items-center justify-between font-mono text-[10px]">
                <span className="font-bold text-on-surface uppercase tracking-wider">
                  Result Set
                </span>
                <span className="text-secondary tabular-nums">
                  {activePreset.rows.length} rows returned
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] tabular-nums">
                  <thead className="bg-surface-container-low/60 text-on-surface-variant">
                    <tr>
                      {activePreset.columns.map((col) => (
                        <th key={col} className="px-3 py-2 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 text-on-surface">
                    {activePreset.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-surface-container-high/40 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 ${
                              cIdx === 1
                                ? 'text-secondary font-semibold'
                                : 'text-on-surface'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Satellite Ingestion Pipeline Status */}
          <div className="bg-surface-container-low p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  satellite_alt
                </span>
                <span className="text-[17px] font-bold text-on-surface">
                  NASA FIRMS &amp; Sentinel-2 Ingestion Feed
                </span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Auto-poll interval: 180s
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg bg-surface-container">
              <table className="w-full text-left font-mono text-[11px] tabular-nums">
                <thead className="bg-surface-container-high text-on-surface-variant text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Sensor / Resolution</th>
                    <th className="px-3 py-2">Orbit / Tile</th>
                    <th className="px-3 py-2">Acquired</th>
                    <th className="px-3 py-2 text-right">Detections</th>
                    <th className="px-3 py-2 text-right">Mean FRP</th>
                    <th className="px-3 py-2 text-right">Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40">
                  {SATELLITE_PASSES.map((pass) => (
                    <tr
                      key={pass.orbit}
                      className="hover:bg-surface-container-high/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-on-surface font-semibold">
                        {pass.satellite}
                      </td>
                      <td className="px-3 py-2.5 text-on-surface-variant">
                        {pass.orbit}
                      </td>
                      <td className="px-3 py-2.5 text-on-surface-variant">
                        {pass.acquired}
                      </td>
                      <td className="px-3 py-2.5 text-right text-secondary font-bold">
                        {pass.detections}
                      </td>
                      <td className="px-3 py-2.5 text-right text-primary">
                        {pass.meanFrp}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-semibold">
                          {pass.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
