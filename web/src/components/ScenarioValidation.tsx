import React, { useEffect, useState } from 'react';
import {
  EventKey,
  INCIDENT_EVENTS,
  ScenarioKey,
  ZOMBA_TERRAIN_IMAGE,
} from '../data/pyrotraceData';

interface ScenarioValidationProps {
  activeEvent: EventKey;
  onSelectEvent: (ev: EventKey) => void;
}

const FUEL_MODIFIERS: Record<
  string,
  { code: string; iouAdj: number; spreadAdj: number }
> = {
  fm4: { code: 'FM-04', iouAdj: 0, spreadAdj: 1.0 },
  fm1: { code: 'FM-01', iouAdj: -1.8, spreadAdj: 1.12 },
  fm9: { code: 'FM-09', iouAdj: -0.9, spreadAdj: 0.92 },
  fm6: { code: 'FM-06', iouAdj: -2.4, spreadAdj: 1.05 },
};

export const ScenarioValidation: React.FC<ScenarioValidationProps> = ({
  activeEvent,
  onSelectEvent,
}) => {
  const eventData = INCIDENT_EVENTS[activeEvent];

  const [scenario, setScenario] = useState<ScenarioKey>('std');
  const [timestep, setTimestep] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);

  const [fuelModel, setFuelModel] = useState('fm4');
  const [slopeFactor, setSlopeFactor] = useState(1.45);
  const [moisturePct, setMoisturePct] = useState(7.2);

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showContours, setShowContours] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({
    lat: '-15.3421° S',
    lon: '35.3184° E',
    alt: '1,842m ASL',
  });
  const [sqlCopied, setSqlCopied] = useState(false);
  const [exportedToast, setExportedToast] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setTimestep((prev) => (prev >= 24 ? 0 : prev + 1));
    }, 900);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const baseMetrics = eventData.scenarios[scenario];
  const fuelMod = FUEL_MODIFIERS[fuelModel] || FUEL_MODIFIERS.fm4;

  // Calibration adjustment from interactive sliders
  const slopeDelta = slopeFactor - 1.45;
  const moistureDelta = moisturePct - 7.2;
  const calibrationPenalty =
    Math.abs(slopeDelta) * 2.2 + Math.abs(moistureDelta) * 0.28;

  const computedIoU = Math.max(
    52,
    Math.min(
      95,
      baseMetrics.iouPct + fuelMod.iouAdj - calibrationPenalty * 0.65
    )
  ).toFixed(1);

  const computedDice = Math.max(
    0.65,
    Math.min(
      0.97,
      baseMetrics.diceCoeff +
        fuelMod.iouAdj * 0.004 -
        calibrationPenalty * 0.003
    )
  ).toFixed(3);

  const computedFalseAlarm = Math.max(
    1.2,
    baseMetrics.falseAlarmPct + slopeDelta * 2.4 - moistureDelta * 0.14
  ).toFixed(1);

  const computedTimeError = Math.max(
    6,
    Math.round(baseMetrics.timeErrorMin + calibrationPenalty * 1.8)
  );

  const timestepScale = 0.55 + (timestep / 24) * 0.65;
  const effectiveForecastScale =
    baseMetrics.forecastScale *
    fuelMod.spreadAdj *
    (1 + slopeDelta * 0.12 - moistureDelta * 0.008) *
    timestepScale;

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ry = (e.clientY - rect.top) / Math.max(1, rect.height);
    const baseLat = activeEvent === 'nyika' ? -10.58 : activeEvent === 'dzalanyama' ? -14.31 : -15.34;
    const baseLon = activeEvent === 'nyika' ? 33.8 : activeEvent === 'dzalanyama' ? 33.48 : 35.31;
    const latVal = Math.abs(baseLat - ry * 0.06).toFixed(4);
    const lonVal = (baseLon + rx * 0.08).toFixed(4);
    const altVal = Math.round(1350 + (1 - ry) * 620);
    setCursorCoords({
      lat: `-${latVal}° S`,
      lon: `${lonVal}° E`,
      alt: `${altVal.toLocaleString()}m ASL`,
    });
  };

  const handleCopySQL = () => {
    const query = `SELECT v.village_name, f.window_min_h, f.window_max_h,
       ST_Distance(v.geom::geography, f.geom::geography) / 1000.0 AS dist_km,
       ST_Area(ST_Intersection(f.geom, b.actual_burn_geom)::geography) / 10000.0 AS overlap_ha
FROM spatial_villages v
JOIN spread_forecasts f ON ST_DWithin(v.geom, f.geom, 0.05)
LEFT JOIN viirs_ground_truth b ON f.event_id = b.event_id
WHERE f.event_id = '${eventData.code}' AND f.scenario = '${scenario}' AND f.timestep_h <= ${timestep}
ORDER BY dist_km ASC LIMIT 5;`;
    navigator.clipboard?.writeText(query);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 1800);
  };

  const handleExportGeoJson = () => {
    const geojson = {
      type: 'FeatureCollection',
      name: `${eventData.code}_${scenario}_T${timestep}h_validation_diff`,
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      properties: {
        event_id: eventData.code,
        scenario,
        timestep_h: timestep,
        fuel_model: fuelMod.code,
        slope_factor: slopeFactor,
        moisture_1h_pct: moisturePct,
        iou_pct: Number(computedIoU),
        dice_coeff: Number(computedDice),
      },
      features: [
        {
          type: 'Feature',
          properties: { layer: 'viirs_ground_truth', area_ha: baseMetrics.totalFootprintHa },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [35.291, -15.371],
                [35.318, -15.365],
                [35.332, -15.382],
                [35.308, -15.391],
                [35.291, -15.371],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { layer: 'rothermel_forecast', scale: Number(effectiveForecastScale.toFixed(2)) },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [35.288, -15.369],
                [35.324, -15.362],
                [35.337, -15.385],
                [35.303, -15.394],
                [35.288, -15.369],
              ],
            ],
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData.code}_${scenario}_T${timestep}h.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedToast(true);
    setTimeout(() => setExportedToast(false), 3000);
  };

  const truePosHa = Math.round(
    baseMetrics.truePosHa * Math.min(1.12, 0.72 + (timestep / 24) * 0.4)
  );
  const falsePosHa = Math.round(
    baseMetrics.falsePosHa * (1 + slopeDelta * 0.25)
  );
  const falseNegHa = Math.max(
    18,
    Math.round(baseMetrics.falseNegHa * (1 - slopeDelta * 0.15))
  );

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)]">
      {/* Sub-header HUD Bar */}
      <section className="w-full bg-surface-container-lowest px-4 lg:px-8 py-2.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-md border-b border-surface-container-high/40">
        {/* Left: Event Switcher & Scenario Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <label htmlFor="event-select" className="sr-only">
              Select Incident Event
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface shadow-sm">
              <span className="material-symbols-outlined material-symbols-filled text-primary text-[18px]">
                history
              </span>
              <select
                id="event-select"
                value={activeEvent}
                onChange={(e) => onSelectEvent(e.target.value as EventKey)}
                className="bg-transparent text-on-surface text-[15px] font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {(Object.keys(INCIDENT_EVENTS) as EventKey[]).map((key) => (
                  <option
                    key={key}
                    value={key}
                    className="bg-surface-container-lowest text-on-surface"
                  >
                    {INCIDENT_EVENTS[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-surface-container-highest" />

          {/* Scenario Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-surface-container-low shadow-inner">
            {(
              [
                { key: 'std', label: 'Standard Rothermel' },
                { key: 'fast', label: 'Fast Gust (30 km/h)' },
                { key: 'slow', label: 'Slow / High Moisture (>45%)' },
              ] as const
            ).map((item) => {
              const active = scenario === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setScenario(item.key)}
                  className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-surface-container-highest text-secondary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Temporal Playback HUD */}
        <div className="flex items-center gap-3 p-1.5 px-3 rounded-xl bg-surface-container-low shadow-sm">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimestep((t) => Math.max(0, t - 1))}
              title="Step Back (-1h)"
              className="w-8 h-8 rounded flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                skip_previous
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              title="Play / Pause Replay"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-container text-on-primary-container hover:opacity-90 shadow-md transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined material-symbols-filled text-[20px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTimestep((t) => Math.min(24, t + 1))}
              title="Step Forward (+1h)"
              className="w-8 h-8 rounded flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                skip_next
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-1 min-w-[200px] xl:min-w-[250px]">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-on-surface-variant">TEMPORAL OFFSET</span>
              <span className="text-secondary font-bold tabular-nums">
                T+{String(timestep).padStart(2, '0')}h : 00m
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={timestep}
              onChange={(e) => setTimestep(parseInt(e.target.value, 10))}
              className="w-full accent-primary-container cursor-pointer h-1.5 rounded-lg bg-surface-container-highest"
            />
            <div className="flex justify-between font-mono text-[10px] text-on-surface-variant/60">
              <span>T+0h</span>
              <span>T+6h</span>
              <span>T+12h</span>
              <span>T+18h</span>
              <span>T+24h</span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col text-right font-mono text-[10px] pl-3 border-l border-surface-container-highest">
            <span className="text-on-surface-variant/70 uppercase">
              Replay Epoch
            </span>
            <span className="text-primary tabular-nums">
              {eventData.replayEpoch}
            </span>
          </div>
        </div>
      </section>

      {/* Main Split Analysis Canvas */}
      <div className="w-full px-4 lg:px-8 py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE: Model vs Ground Truth GIS Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-lowest shadow-xl flex flex-col min-h-[560px] xl:min-h-[620px]">
            <div
              onMouseMove={handleMouseMoveCanvas}
              className="relative flex-1 w-full h-full bg-surface-container-lowest overflow-hidden select-none cursor-crosshair"
            >
              <div
                className="absolute inset-0 w-full h-full transition-transform duration-150 origin-center"
                style={{ transform: `scale(${canvasZoom})` }}
              >
                <img
                  src={ZOMBA_TERRAIN_IMAGE}
                  alt="Terrain elevation satellite basemap"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.42] saturate-[0.8]"
                />

                {/* Topographic Contour & Vector Grid Overlay */}
                {showContours && (
                  <svg
                    className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="val-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="#2f3543"
                          strokeWidth="0.7"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#val-grid)" />
                    <path
                      d="M -50,180 Q 200,90 420,160 T 900,120"
                      fill="none"
                      stroke="#4cd7f6"
                      strokeOpacity="0.22"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <path
                      d="M -50,260 Q 220,180 440,240 T 900,210"
                      fill="none"
                      stroke="#4cd7f6"
                      strokeOpacity="0.22"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <path
                      d="M -50,340 Q 240,260 480,310 T 900,280"
                      fill="none"
                      stroke="#4cd7f6"
                      strokeOpacity="0.22"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <path
                      d="M -50,420 Q 260,340 520,390 T 900,370"
                      fill="none"
                      stroke="#4cd7f6"
                      strokeOpacity="0.22"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                  </svg>
                )}

                {/* Dynamic Fire Propagation & Polygonal Discrepancies */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                  viewBox="0 0 700 520"
                >
                  <defs>
                    <pattern
                      id="underPredHatch"
                      width="8"
                      height="8"
                      patternTransform="rotate(45 0 0)"
                      patternUnits="userSpaceOnUse"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="8"
                        stroke="#4cd7f6"
                        strokeWidth="2"
                      />
                    </pattern>
                    <pattern
                      id="overPredDots"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="5" cy="5" r="1.5" fill="#ff5722" />
                    </pattern>
                  </defs>

                  {/* Scaled Simulated Forecast Layers */}
                  <g
                    transform={`translate(340, 240) scale(${effectiveForecastScale}) translate(-340, -240)`}
                  >
                    <path
                      d="M 230,130 C 340,90 460,110 510,180 C 560,250 510,340 430,360 C 370,375 270,350 200,290 C 150,245 160,165 230,130 Z"
                      fill="url(#overPredDots)"
                      opacity="0.38"
                    />
                    <path
                      d="M 260,165 C 325,145 405,155 440,205 C 475,255 440,305 390,318 C 330,330 285,295 245,265 C 210,235 220,185 260,165 Z"
                      fill="#ff5722"
                      fillOpacity="0.25"
                      stroke="#ff5722"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Actual Ground Truth Polygon (VIIRS Scar) */}
                  <path
                    d="M 250,150 C 320,130 420,140 460,195 C 500,250 470,315 410,330 C 340,345 285,310 235,275 C 190,240 200,175 250,150 Z"
                    fill="none"
                    stroke="#4cd7f6"
                    strokeDasharray="6,4"
                    strokeWidth="2.5"
                  />

                  {/* Under-prediction Slip */}
                  <path
                    d="M 440,205 C 475,255 440,305 390,318 C 420,335 465,310 475,260 C 485,220 460,200 440,205 Z"
                    fill="url(#underPredHatch)"
                    opacity="0.45"
                  />

                  {/* Fire Ignition Origin */}
                  <circle
                    cx="240"
                    cy="270"
                    r="6"
                    fill="#ff5451"
                    opacity="0.7"
                    className="animate-ping"
                  />
                  <circle cx="240" cy="270" r="4" fill="#ff5451" />
                  <text
                    x="250"
                    y="274"
                    fill="#ffb5a0"
                    className="font-mono text-[10px] tracking-wider font-semibold"
                  >
                    {eventData.originLabel}
                  </text>

                  {/* Threatened Settlements */}
                  {eventData.settlements.map((st, idx) => (
                    <g key={idx}>
                      <circle cx={st.x} cy={st.y} r="4" fill="#4cd7f6" />
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r="14"
                        fill="none"
                        stroke="#4cd7f6"
                        strokeOpacity="0.4"
                        strokeDasharray="2,2"
                        strokeWidth="1"
                      />
                      <text
                        x={st.x + 18}
                        y={st.y + 4}
                        fill="#dde2f5"
                        className="font-sans text-[12px] font-semibold"
                      >
                        {st.name}
                      </text>
                      <text
                        x={st.x + 18}
                        y={st.y + 16}
                        fill={st.status === 'warning' ? '#ffb3ad' : '#e4beb4'}
                        className="font-mono text-[9px]"
                      >
                        {st.etaLabel}
                      </text>
                    </g>
                  ))}

                  {/* Wind Compass */}
                  <g transform="translate(80, 80)">
                    <circle
                      cx="0"
                      cy="0"
                      r="28"
                      fill="#161b29"
                      opacity="0.9"
                    />
                    <g
                      transform={`rotate(${eventData.windAzimuthDeg - 90})`}
                    >
                      <line
                        x1="0"
                        y1="18"
                        x2="0"
                        y2="-18"
                        stroke="#4cd7f6"
                        strokeWidth="2.5"
                      />
                      <polygon points="0,-22 -5,-12 5,-12" fill="#4cd7f6" />
                    </g>
                    <text
                      x="0"
                      y="38"
                      textAnchor="middle"
                      fill="#4cd7f6"
                      className="font-mono text-[9px] font-bold"
                    >
                      WIND{' '}
                      {scenario === 'fast'
                        ? 30
                        : scenario === 'slow'
                        ? 11
                        : eventData.windSpeedKmh}{' '}
                      KM/H ({eventData.spreadDirection})
                    </text>
                  </g>
                </svg>
              </div>

              {/* Floating Map HUD Controls (Top Right) */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() =>
                    setCanvasZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))
                  }
                  title="Zoom In"
                  className="w-8 h-8 rounded-lg bg-surface-container-high/90 text-on-surface hover:text-secondary flex items-center justify-center backdrop-blur-md shadow-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCanvasZoom((z) => Math.max(0.8, Number((z - 0.15).toFixed(2))))
                  }
                  title="Zoom Out"
                  className="w-8 h-8 rounded-lg bg-surface-container-high/90 text-on-surface hover:text-secondary flex items-center justify-center backdrop-blur-md shadow-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    remove
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasZoom(1)}
                  title="Recenter Geometry"
                  className="w-8 h-8 rounded-lg bg-surface-container-high/90 text-on-surface hover:text-secondary flex items-center justify-center backdrop-blur-md shadow-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    filter_center_focus
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowContours((s) => !s)}
                  title="Toggle Contour Hillshade"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md shadow-md transition-colors cursor-pointer ${
                    showContours
                      ? 'bg-surface-container-high/90 text-secondary'
                      : 'bg-surface-container-high/90 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    layers
                  </span>
                </button>
              </div>

              {/* Floating Spatial Legend Panel (Bottom Left) */}
              <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-surface-container-low/95 backdrop-blur-md shadow-lg max-w-[280px]">
                <div className="font-mono text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[14px]">
                    tune
                  </span>
                  Spatial Layer Overlap
                </div>
                <div className="flex flex-col gap-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1.5 rounded-full bg-primary-container" />
                    <span className="text-on-surface-variant">
                      Simulated Forecast (Rothermel)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-0 border-b-2 border-dashed border-secondary" />
                    <span className="text-on-surface-variant">
                      VIIRS Scar (Ground Truth)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-primary-container/30 flex items-center justify-center text-[7px] text-primary-fixed">
                      ..
                    </span>
                    <span className="text-on-surface-variant tabular-nums">
                      Over-prediction:{' '}
                      <strong className="text-on-surface">
                        +{baseMetrics.overPredPct}%
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-secondary/30 flex items-center justify-center text-[8px] text-secondary">
                      ///
                    </span>
                    <span className="text-on-surface-variant tabular-nums">
                      Under-prediction:{' '}
                      <strong className="text-on-surface">
                        -{baseMetrics.underPredPct}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Cursor Coordinates Strip (Bottom Right) */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-surface-container-lowest/85 backdrop-blur-md font-mono text-[10px] text-on-surface-variant tabular-nums">
                <span>
                  {cursorCoords.lat}, {cursorCoords.lon}
                </span>
                <span className="text-outline-variant mx-1.5">|</span>
                <span>ALT: {cursorCoords.alt}</span>
              </div>
            </div>

            {/* Map Diagnostics Footbar */}
            <div className="px-4 py-2 bg-surface-container-low flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface-variant">
                  {eventData.viirsOrbitLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-on-surface-variant">Mesh Grid Size:</span>
                <span className="text-secondary">30m DEM (SRTM-GL1)</span>
                <span className="text-outline-variant">|</span>
                <span className="text-on-surface-variant">SRID:</span>
                <span className="text-on-surface">{eventData.sridLabel}</span>
              </div>
            </div>
          </div>

          {/* Model Calibration & Parameter Tuning */}
          <div className="p-3.5 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  tune
                </span>
                <span className="text-[17px] font-semibold text-on-surface">
                  Model Calibration &amp; Parameter Tuning
                </span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Rothermel (1972) Albini-BehavePlus Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fuel-model"
                  className="font-mono text-[10px] text-on-surface-variant flex items-center justify-between"
                >
                  <span>VEGETATION FUEL MODEL</span>
                  <span className="text-secondary">{fuelMod.code}</span>
                </label>
                <select
                  id="fuel-model"
                  value={fuelModel}
                  onChange={(e) => setFuelModel(e.target.value)}
                  className="w-full bg-surface-container text-on-surface px-2.5 py-1.5 rounded-lg text-[12px] focus:outline-none cursor-pointer"
                >
                  <option value="fm4">
                    Pine Plantation (Pinus patula - FM4)
                  </option>
                  <option value="fm1">High Montane Grassland (FM1)</option>
                  <option value="fm9">Miombo / Broadleaf Woodland (FM9)</option>
                  <option value="fm6">Montane Shrub &amp; Scrub (FM6)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-on-surface-variant">
                    SLOPE ADJUST (TOPOGRAPHY)
                  </span>
                  <span className="text-primary font-bold tabular-nums">
                    {slopeFactor.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={2.5}
                  step={0.05}
                  value={slopeFactor}
                  onChange={(e) => setSlopeFactor(parseFloat(e.target.value))}
                  className="accent-primary-container cursor-pointer h-1.5 rounded-lg bg-surface-container-highest mt-2"
                />
                <div className="flex justify-between font-mono text-[10px] text-on-surface-variant/60">
                  <span>0.8x (Flat)</span>
                  <span>1.5x</span>
                  <span>2.5x (Steep Ridges)</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-on-surface-variant">
                    1-HR FUEL MOISTURE
                  </span>
                  <span className="text-secondary font-bold tabular-nums">
                    {moisturePct.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={0.5}
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(parseFloat(e.target.value))}
                  className="accent-secondary cursor-pointer h-1.5 rounded-lg bg-surface-container-highest mt-2"
                />
                <div className="flex justify-between font-mono text-[10px] text-on-surface-variant/60">
                  <span>3% (Critical Dry)</span>
                  <span>15%</span>
                  <span>30% (Extinction)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Validation Scorecard & PostGIS Live Query Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Spatial Validation Scorecard */}
          <div className="p-3.5 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  verified
                </span>
                <span className="text-[17px] font-semibold text-on-surface">
                  Spatial Validation Scorecard
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[10px] text-secondary tabular-nums">
                T+{String(timestep).padStart(2, '0')}h Evaluation
              </span>
            </div>

            {/* 4 Key Precision Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  IoU / JACCARD
                </span>
                <span className="text-[22px] leading-7 text-secondary font-bold mt-1 tabular-nums">
                  {computedIoU}%
                </span>
                <span className="font-mono text-[10px] text-secondary/80 mt-0.5">
                  {baseMetrics.iouDelta}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  DICE COEFF
                </span>
                <span className="text-[22px] leading-7 text-primary font-bold mt-1 tabular-nums">
                  {computedDice}
                </span>
                <span className="font-mono text-[10px] text-primary/80 mt-0.5">
                  High Agreement
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  FALSE ALARM
                </span>
                <span className="text-[22px] leading-7 text-on-surface font-bold mt-1 tabular-nums">
                  {computedFalseAlarm}%
                </span>
                <span className="font-mono text-[10px] text-outline mt-0.5">
                  Over-predicted
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  TIME ERROR
                </span>
                <span className="text-[22px] leading-7 text-tertiary font-bold mt-1 tabular-nums">
                  ±{computedTimeError}m
                </span>
                <span className="font-mono text-[10px] text-tertiary/80 mt-0.5">
                  Per perimeter node
                </span>
              </div>
            </div>

            {/* Spatial Contingency Confusion Matrix Table */}
            <div className="rounded-lg bg-surface-container overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-container-high flex justify-between items-center font-mono text-[10px]">
                <span className="font-bold text-on-surface uppercase tracking-wider">
                  Spatial Contingency (Hectares)
                </span>
                <span className="text-on-surface-variant tabular-nums">
                  Total Burn Footprint:{' '}
                  {baseMetrics.totalFootprintHa.toLocaleString()} ha
                </span>
              </div>
              <table className="w-full text-left font-mono text-[10px] tabular-nums">
                <thead className="text-on-surface-variant bg-surface-container-low/50">
                  <tr>
                    <th className="p-2 pl-3">Condition</th>
                    <th className="p-2 text-right">Ground Burned</th>
                    <th className="p-2 pr-3 text-right">Ground Unburned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 text-on-surface">
                  <tr>
                    <td className="p-2 pl-3 text-secondary font-medium">
                      Model Predicted Fire
                    </td>
                    <td className="p-2 text-right font-semibold text-secondary">
                      {truePosHa.toLocaleString()} ha (True +)
                    </td>
                    <td className="p-2 pr-3 text-right text-tertiary">
                      {falsePosHa.toLocaleString()} ha (False +)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-3 text-on-surface-variant font-medium">
                      Model Predicted Clear
                    </td>
                    <td className="p-2 text-right text-tertiary">
                      {falseNegHa.toLocaleString()} ha (False -)
                    </td>
                    <td className="p-2 pr-3 text-right text-on-surface-variant">
                      {baseMetrics.trueNegHa.toLocaleString()} ha (True -)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PostGIS Live Query Inspector */}
          <div className="p-3.5 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  terminal
                </span>
                <span className="text-[17px] font-semibold text-on-surface">
                  PostGIS Live Query Inspector
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#4cd7f6]" />
                <span className="text-on-surface-variant">
                  psycopg3 Pool (3.4)
                </span>
              </div>
            </div>

            {/* Query Header */}
            <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
              <span className="text-primary truncate">
                SELECT v.village_name, ST_Distance(...)
              </span>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-secondary">Execution: 28.4ms</span>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  title="Copy SQL statement"
                  className="hover:text-on-surface flex items-center gap-1 text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    content_copy
                  </span>
                  <span>{sqlCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Syntax-Highlighted SQL */}
            <div className="rounded-lg bg-surface-container-lowest p-3 font-mono text-[10px] text-on-surface overflow-x-auto shadow-inner leading-relaxed">
              <pre className="font-mono leading-5">
                <span className="text-secondary font-bold">SELECT</span> {'\n'}
                {'    '}v.village_name,{'\n'}
                {'    '}f.window_min_h,{'\n'}
                {'    '}f.window_max_h,{'\n'}
                {'    '}
                <span className="text-primary font-bold">ST_Distance</span>
                (v.geom::<span className="text-primary">geography</span>,
                f.geom::<span className="text-primary">geography</span>) /{' '}
                <span className="text-tertiary">1000.0</span>{' '}
                <span className="text-secondary font-bold">AS</span> dist_km,
                {'\n'}
                {'    '}
                <span className="text-primary font-bold">ST_Area</span>(
                <span className="text-primary font-bold">ST_Intersection</span>
                (f.geom, b.actual_burn_geom)::
                <span className="text-primary">geography</span>) /{' '}
                <span className="text-tertiary">10000.0</span>{' '}
                <span className="text-secondary font-bold">AS</span> overlap_ha
                {'\n'}
                <span className="text-secondary font-bold">FROM</span>{' '}
                spatial_villages v{'\n'}
                <span className="text-secondary font-bold">JOIN</span>{' '}
                spread_forecasts f{' '}
                <span className="text-secondary font-bold">ON</span>{' '}
                <span className="text-primary font-bold">ST_DWithin</span>
                (v.geom, f.geom, <span className="text-tertiary">0.05</span>)
                {'\n'}
                <span className="text-secondary font-bold">LEFT JOIN</span>{' '}
                viirs_ground_truth b{' '}
                <span className="text-secondary font-bold">ON</span>{' '}
                f.event_id = b.event_id{'\n'}
                <span className="text-secondary font-bold">WHERE</span>{' '}
                f.event_id ={' '}
                <span className="text-primary-fixed font-bold">
                  &apos;{eventData.code}&apos;
                </span>
                {'\n'}
                {'    '}
                <span className="text-secondary font-bold">AND</span>{' '}
                f.scenario ={' '}
                <span className="text-primary-fixed font-bold">
                  &apos;{scenario}&apos;
                </span>{' '}
                <span className="text-secondary font-bold">AND</span>{' '}
                f.timestep_h &lt;={' '}
                <span className="text-tertiary font-bold">{timestep}</span>
                {'\n'}
                <span className="text-secondary font-bold">ORDER BY</span>{' '}
                dist_km <span className="text-secondary font-bold">ASC</span>{' '}
                <span className="text-secondary font-bold">LIMIT</span>{' '}
                <span className="text-tertiary font-bold">5</span>;
              </pre>
            </div>

            {/* Query Result Table */}
            <div className="rounded-lg bg-surface-container overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-container-high font-mono text-[10px] text-on-surface-variant flex justify-between">
                <span>Query Results (Buffer 0.05° / ~5.5km)</span>
                <span className="text-secondary">3 Rows Returned</span>
              </div>
              <div className="divide-y divide-surface-container-high/40 font-mono text-[10px] tabular-nums">
                <div className="px-3 py-2 flex items-center justify-between text-on-surface gap-2">
                  <span className="font-semibold text-secondary">
                    {eventData.settlements[0].name}
                  </span>
                  <span className="text-on-surface-variant">
                    Win: T+9.5h - T+12.0h
                  </span>
                  <span className="text-tertiary font-semibold">1.42 km</span>
                  <span className="text-primary">142.1 ha ovlp</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-on-surface gap-2">
                  <span className="font-semibold text-secondary">
                    Chingale Forestry Camp
                  </span>
                  <span className="text-on-surface-variant">
                    Win: T+7.0h - T+8.5h
                  </span>
                  <span className="text-tertiary font-semibold">0.38 km</span>
                  <span className="text-primary">289.4 ha ovlp</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-on-surface gap-2">
                  <span className="font-semibold text-secondary">
                    {eventData.settlements[1].name}
                  </span>
                  <span className="text-on-surface-variant">
                    Win: T+16.0h - T+20.0h
                  </span>
                  <span className="text-on-surface-variant">4.12 km</span>
                  <span className="text-outline">0.0 ha ovlp</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[10px]">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  sync
                </span>
                <span>Triggered via FastAPI Worker Node: worker-geospatial-03</span>
              </div>
              <button
                type="button"
                onClick={handleExportGeoJson}
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-secondary font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  file_download
                </span>
                <span>
                  {exportedToast ? 'GeoJSON Downloaded' : 'Export GeoJSON Diff'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
