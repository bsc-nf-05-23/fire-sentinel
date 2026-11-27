import React, { useEffect, useRef, useState } from 'react';
import {
  EventKey,
  FIRMS_HOTSPOTS,
  FirmsHotspot,
  INCIDENT_EVENTS,
  VILLAGE_RELAY_RECORDS,
  VillageKey,
  ZOMBA_TERRAIN_IMAGE,
} from '../data/pyrotraceData';

interface LiveSituationMapProps {
  activeEvent: EventKey;
  onOpenRelay: (villageKey: VillageKey) => void;
}

export const LiveSituationMap: React.FC<LiveSituationMapProps> = ({
  activeEvent,
  onOpenRelay,
}) => {
  const eventData = INCIDENT_EVENTS[activeEvent];

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [timeHour, setTimeHour] = useState(6.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );

  const [selectedHotspot, setSelectedHotspot] = useState<FirmsHotspot | null>(null);
  const [focusedVillageKey, setFocusedVillageKey] = useState<VillageKey>('chisi');
  const [sqlCopied, setSqlCopied] = useState(false);

  const [layers, setLayers] = useState({
    reserve: true,
    firms: true,
    spread: true,
    villages: true,
    wind: true,
    swir: false,
  });

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = playbackSpeed === 2 ? 180 : 350;
    const id = window.setInterval(() => {
      setTimeHour((prev) => (prev >= 18 ? 0 : Number((prev + 0.5).toFixed(1))));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, playbackSpeed]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))));
  const handleRecenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, label, a')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: Math.max(-320, Math.min(320, dragStartRef.current.panX + dx)),
      y: Math.max(-240, Math.min(240, dragStartRef.current.panY + dy)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(
      'ST_DWithin(v.geom::geography, f.hull::geography, 5000)'
    );
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 1600);
  };

  // Dynamic metrics derived from replay scrubber
  const timeFactor = Math.max(0.25, timeHour / 6.5);
  const currentBurnArea = (eventData.baseBurnAreaHa * (0.42 + 0.58 * timeFactor)).toFixed(1);
  const hoursInt = Math.floor(timeHour);
  const minsInt = Math.round((timeHour - hoursInt) * 60);
  const formattedClock = `T+${String(hoursInt).padStart(2, '0')}:${String(minsInt).padStart(2, '0')}h`;
  const formattedSliderBadge = `T+${timeHour.toFixed(1).padStart(4, '0')}h / 18.0h`;
  const spreadScale = 0.45 + (timeHour / 18) * 0.95;
  const scaleKm = (1.0 / zoom).toFixed(1);

  const perimeterVillages = VILLAGE_RELAY_RECORDS.slice(0, 4);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[680px] overflow-hidden select-none bg-surface-container-lowest">
      {/* Interactive Pan/Zoom Map Viewport */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 z-0 bg-surface-container-lowest ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className="w-full h-full relative transition-transform duration-150 ease-out origin-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {/* Satellite Terrain Base Layer */}
          <img
            src={ZOMBA_TERRAIN_IMAGE}
            alt="Zomba Plateau satellite terrain basemap"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 mix-blend-luminosity filter brightness-75 contrast-125 pointer-events-none"
          />

          {/* Sentinel-2 SWIR False Color Thermal Burn Scar Overlay */}
          {layers.swir && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(ellipse 360px 210px at 44% 52%, rgba(255, 87, 34, 0.34), rgba(176, 47, 0, 0.16) 55%, rgba(76, 215, 246, 0.08) 80%, transparent 100%)',
                mixBlendMode: 'screen',
              }}
            />
          )}

          {/* Scrim Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/80 via-transparent to-surface-container-lowest/80 pointer-events-none" />

          {/* Spatial Vector SVG Layer */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 820"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="#242a38"
                  strokeWidth="0.5"
                  opacity="0.45"
                />
                <circle cx="60" cy="60" r="1" fill="#4cd7f6" opacity="0.3" />
              </pattern>
              <pattern
                id="reserve-hatch"
                width="12"
                height="12"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="12"
                  stroke="#4cd7f6"
                  strokeWidth="1"
                  opacity="0.16"
                />
              </pattern>
              <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff5451" stopOpacity="0.8" />
                <stop offset="45%" stopColor="#ff5722" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="spread-fast" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#ff5451" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#ffb5a0" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ff5722" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="spread-slow" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#ff5722" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b0900" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid-pattern)" />

            {/* Forest Reserve Boundary */}
            {layers.reserve && (
              <g id="layer-reserve">
                <polygon
                  points="380,140 680,110 920,180 1140,290 1080,620 740,760 490,680 340,490 320,290"
                  fill="url(#reserve-hatch)"
                  opacity="0.85"
                  stroke="#4cd7f6"
                  strokeDasharray="6,4"
                  strokeWidth="1.5"
                />
                <text
                  x="740"
                  y="150"
                  fill="#4cd7f6"
                  opacity="0.65"
                  letterSpacing="0.2em"
                  className="font-mono text-[10px]"
                >
                  {eventData.reserveBoundaryLabel}
                </text>
              </g>
            )}

            {/* Spread Forecast Ellipses */}
            {layers.spread && (
              <g id="layer-spread-forecast">
                <g
                  transform={`translate(620, 415) scale(${spreadScale}) translate(-620, -415)`}
                >
                  <ellipse
                    cx="640"
                    cy="420"
                    rx="220"
                    ry="110"
                    fill="url(#spread-fast)"
                    stroke="#ff5451"
                    strokeDasharray="4,4"
                    strokeWidth="1.2"
                    transform="rotate(28 640 420)"
                  />
                  <ellipse
                    cx="610"
                    cy="410"
                    rx="140"
                    ry="70"
                    fill="url(#spread-slow)"
                    stroke="#ff5722"
                    strokeWidth="1.5"
                    transform="rotate(25 610 410)"
                  />
                  <path
                    d="M 520,390 Q 640,320 840,480"
                    fill="none"
                    opacity="0.7"
                    stroke="#ffb5a0"
                    strokeDasharray="2,3"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 540,430 Q 680,380 870,540"
                    fill="none"
                    opacity="0.5"
                    stroke="#ffb5a0"
                    strokeDasharray="2,3"
                    strokeWidth="1.2"
                  />
                </g>
                <text
                  x="780"
                  y="370"
                  fill="#ffb5a0"
                  opacity="0.75"
                  className="font-mono text-[10px]"
                >
                  T+12h SPREAD VECTOR (FAST: {eventData.maxGustKmh} km/h)
                </text>
              </g>
            )}

            {/* Wind Vectors */}
            {layers.wind && (
              <g
                id="layer-wind-vectors"
                opacity="0.75"
                stroke="#4cd7f6"
                strokeWidth="1.2"
              >
                {[
                  { x: 420, y: 240, len: 48, offset: 0 },
                  { x: 560, y: 280, len: 52, offset: 0 },
                  { x: 710, y: 310, len: 46, offset: 2 },
                  { x: 860, y: 370, len: 56, offset: -3 },
                  { x: 510, y: 480, len: 44, offset: 0 },
                  { x: 680, y: 520, len: 54, offset: 4 },
                  { x: 820, y: 580, len: 50, offset: -1 },
                ].map((vec, i) => (
                  <g
                    key={i}
                    transform={`translate(${vec.x}, ${vec.y}) rotate(${
                      eventData.windAzimuthDeg + vec.offset
                    })`}
                  >
                    <path
                      d={`M 0,0 L ${vec.len},0 M ${vec.len - 6},-4 L ${vec.len},0 L ${
                        vec.len - 6
                      },4`}
                      fill="none"
                    />
                    <circle cx="0" cy="0" r="2" fill="#4cd7f6" />
                  </g>
                ))}
              </g>
            )}

            {/* Villages with Buffer Circles */}
            {layers.villages && (
              <g id="layer-villages">
                {perimeterVillages.map((v) => {
                  const isFocused = focusedVillageKey === v.key;
                  const isWarning = v.mapStatus === 'WARNING';
                  const color =
                    v.key === 'chisi'
                      ? '#ff5451'
                      : v.key === 'domasi'
                      ? '#ff5722'
                      : '#4cd7f6';
                  return (
                    <g
                      key={v.key}
                      transform={`translate(${v.mapX}, ${v.mapY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedVillageKey(v.key);
                        setDrawerOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={v.bufferRadius}
                        fill={color}
                        fillOpacity={isFocused ? 0.16 : 0.07}
                        stroke={color}
                        strokeDasharray="3,3"
                        strokeWidth={isFocused ? 2 : 1}
                      />
                      <circle cx="0" cy="0" r={isWarning ? 6 : 4.5} fill={color} />
                      {isWarning && <circle cx="0" cy="0" r="2" fill="#ffffff" />}
                      <text
                        x="14"
                        y="4"
                        fill={isFocused ? '#ffffff' : '#dde2f5'}
                        className="font-sans text-[12px] font-bold"
                      >
                        {v.mapLabel}
                      </text>
                      <text
                        x="14"
                        y="17"
                        fill={isWarning ? '#ffb3ad' : '#acedff'}
                        className="font-mono text-[10px]"
                      >
                        {v.key === 'songani'
                          ? `Watch State · ${v.mapDist}`
                          : `ETA: ${v.etaShort} · ${v.mapDist}`}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* NASA FIRMS Hotspots */}
            {layers.firms && (
              <g id="layer-firms-detections">
                <circle cx="560" cy="380" r="70" fill="url(#fire-glow)" />
                <circle cx="610" cy="420" r="90" fill="url(#fire-glow)" />
                {FIRMS_HOTSPOTS.filter((h) => h.appearAtHour <= timeHour + 1.5).map(
                  (spot, idx) => {
                    const isViirs = spot.sensor === 'VIIRS';
                    const isSelected = selectedHotspot?.id === spot.id;
                    return (
                      <g
                        key={spot.id}
                        transform={`translate(${spot.x}, ${spot.y})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(isSelected ? null : spot);
                        }}
                        className="cursor-pointer"
                      >
                        {idx === 0 && (
                          <circle
                            cx="0"
                            cy="0"
                            r="11"
                            fill="#ff5451"
                            opacity="0.35"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? 11 : isViirs ? 8 : 6}
                          fill={isViirs ? '#ff5451' : '#ff5722'}
                          stroke={isSelected ? '#4cd7f6' : 'none'}
                          strokeWidth="2"
                        />
                        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                      </g>
                    );
                  }
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Selected FIRMS Hotspot Inspection Popover */}
      {selectedHotspot && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-surface-container-low/95 backdrop-blur-xl border border-secondary/40 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
            <span className="font-mono text-[11px] font-bold text-on-surface">
              {selectedHotspot.id} ({selectedHotspot.sensor})
            </span>
          </div>
          <div className="font-mono text-[11px] text-secondary tabular-nums">
            Conf: {selectedHotspot.confidence}% · FRP: {selectedHotspot.frpMw} MW
          </div>
          <div className="hidden sm:block font-mono text-[10px] text-on-surface-variant">
            {selectedHotspot.coords} · {selectedHotspot.acquiredUtc}
          </div>
          <button
            type="button"
            onClick={() => setSelectedHotspot(null)}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
            aria-label="Close hotspot details"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* TOP-LEFT FLOATING INCIDENT SUMMARY & WIND METRIC */}
      <div className="absolute top-4 left-4 z-20 w-80 sm:w-84 max-w-[calc(100vw-2rem)] flex flex-col gap-3 pointer-events-auto">
        <div className="bg-surface-container-low/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-surface-container-highest/50">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 bg-surface-container-high/40 -mx-4 -mt-4 px-4 pt-3.5 rounded-t-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#ff5722] animate-pulse shrink-0" />
              <span className="font-mono text-[11px] text-primary uppercase font-bold tracking-wider truncate">
                {eventData.code}
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-secondary tabular-nums shrink-0">
              {formattedClock}
            </span>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <span className="text-[15px] font-bold text-on-surface">
              {eventData.ridgeTitle}
            </span>
            <span className="text-[12px] text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary">
                schedule
              </span>
              {eventData.detectedUtc}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                Est. Burn Area
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                <span className="text-[22px] leading-7 font-bold text-on-surface">
                  {currentBurnArea}
                </span>
                <span className="font-mono text-[10px] text-primary">ha</span>
              </div>
              <span className="font-mono text-[9px] text-secondary mt-1 tabular-nums">
                +{eventData.burnRateHaPerHour} ha / 60m
              </span>
            </div>
            <div className="bg-surface-container p-2.5 rounded-lg flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                Front Velocity
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                <span className="text-[22px] leading-7 font-bold text-tertiary">
                  {eventData.frontVelocityKmh}
                </span>
                <span className="font-mono text-[10px] text-tertiary">km/h</span>
              </div>
              <span className="font-mono text-[9px] text-on-surface-variant mt-1 tabular-nums">
                Max gust: {eventData.maxGustKmh} km/h
              </span>
            </div>
          </div>

          <div className="bg-surface-container-high/60 p-2.5 rounded-lg mb-3">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-[10px] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-tertiary">
                  near_me
                </span>
                Nearest Habitation
              </span>
              <span className="font-mono text-[10px] font-bold text-tertiary uppercase">
                Critical
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-on-surface">
                {eventData.nearestVillage}
              </span>
              <span className="font-mono text-[11px] font-bold text-secondary tabular-nums">
                {eventData.nearestDistanceLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="w-full text-left bg-surface-container-lowest hover:bg-surface-container p-2 rounded-lg transition-colors cursor-pointer group"
            title="Click to copy PostGIS spatial query"
          >
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">
                  terminal
                </span>
                PostGIS Dispatch Buffer Query
              </span>
              <span className="font-mono text-[9px] text-primary">
                {sqlCopied ? 'Copied!' : '18ms'}
              </span>
            </div>
            <code className="font-mono text-[10px] text-on-surface leading-tight block break-all">
              ST_DWithin(v.geom::geography, f.hull::geography, 5000)
            </code>
          </button>
        </div>

        {/* Wind Metric & Relative Humidity Card */}
        <div className="bg-surface-container-low/90 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-surface-container-highest/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-secondary text-[20px]"
                style={{ transform: `rotate(${eventData.windAzimuthDeg}deg)` }}
              >
                navigation
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                Wind Metric
              </span>
              <span className="text-[17px] font-bold text-on-surface leading-tight tabular-nums">
                {eventData.windSpeedKmh} km/h{' '}
                <span className="font-mono text-[10px] text-secondary font-normal">
                  {eventData.windDirLabel}
                </span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase block">
              Relative Humidity
            </span>
            <span className="font-mono text-[11px] font-bold text-tertiary tabular-nums">
              {eventData.humidityPct}% DRY CRIT
            </span>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT THREAT DRAWER, MAP CONTROLS & LAYER STACKING */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="bg-surface-container-low/90 backdrop-blur-xl p-1.5 rounded-xl shadow-xl border border-surface-container-highest/50 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              drawerOpen
                ? 'bg-surface-container-high text-secondary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              notification_important
            </span>
            <span className="font-mono text-[10px] uppercase font-semibold whitespace-nowrap">
              Threat Drawer
            </span>
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse ml-0.5" />
          </button>
          <div className="w-[1px] h-5 bg-surface-container-highest" />
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom in"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom out"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Center on fire front"
          >
            <span className="material-symbols-outlined text-[18px]">
              filter_center_focus
            </span>
          </button>
        </div>

        {drawerOpen && (
          <div className="w-80 bg-surface-container-low/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-surface-container-highest/50 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">
                  warning
                </span>
                <span className="text-[14px] font-bold text-on-surface">
                  Vulnerability Perimeter
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary">
                4 Settlements
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {perimeterVillages.map((v) => {
                const isSelected = focusedVillageKey === v.key;
                const isCritical = v.key === 'chisi';
                const isOrange = v.key === 'domasi';
                const dotColor = isCritical
                  ? 'bg-tertiary-container shadow-[0_0_6px_#ff5451]'
                  : isOrange
                  ? 'bg-primary-container shadow-[0_0_6px_#ff5722]'
                  : v.key === 'mulunguzi'
                  ? 'bg-secondary'
                  : 'bg-secondary-container';
                const badgeClass = isCritical
                  ? 'bg-tertiary-container/30 text-tertiary'
                  : isOrange
                  ? 'bg-primary-container/30 text-primary'
                  : v.key === 'mulunguzi'
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-secondary-container/20 text-secondary-fixed';
                const etaColor = isCritical
                  ? 'text-tertiary'
                  : isOrange
                  ? 'text-primary'
                  : v.key === 'mulunguzi'
                  ? 'text-secondary'
                  : 'text-secondary-fixed';

                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setFocusedVillageKey(v.key)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-high ring-1 ring-secondary/50'
                        : 'bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="text-[12px] font-bold text-on-surface">
                          {v.name === 'Domasi Slope Settlement'
                            ? 'Likangala Valley'
                            : v.name === 'Mulunguzi Valley Core'
                            ? 'Mulunguzi Station'
                            : v.name === 'Songani Foothills'
                            ? 'Songani North'
                            : v.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant mt-0.5 tabular-nums">
                        Pop: ~{v.pop} · {v.mapDist} away
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeClass}`}
                      >
                        {v.mapStatus}
                      </span>
                      <span
                        className={`font-mono text-[10px] block mt-1 tabular-nums ${etaColor}`}
                      >
                        ETA: {v.etaShort}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenRelay(focusedVillageKey)}
              className="w-full py-2.5 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-[15px] font-bold text-center flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                cell_tower
              </span>
              <span>Open Village Relay Dispatch</span>
            </button>
          </div>
        )}

        {/* Spatial Layer Stacking Panel */}
        <div className="bg-surface-container-low/90 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-surface-container-highest/50 flex flex-col gap-2 w-80">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Spatial Layer Stacking
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: 'reserve', label: 'Reserve Bounds', accent: 'accent-secondary' },
                { key: 'firms', label: 'FIRMS Points', accent: 'accent-primary-container' },
                { key: 'spread', label: 'Spread Ellipse', accent: 'accent-tertiary-container' },
                { key: 'villages', label: 'Villages (Buffer)', accent: 'accent-secondary' },
                { key: 'wind', label: 'Wind Vectors', accent: 'accent-secondary' },
                { key: 'swir', label: 'Sentinel-2 SWIR', accent: 'accent-secondary' },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 p-1.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={layers[item.key]}
                  onChange={() => toggleLayer(item.key)}
                  className={`${item.accent} w-3.5 h-3.5 rounded cursor-pointer`}
                />
                <span className="font-mono text-[10px] text-on-surface truncate">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM HUD BAR: LEGEND, TEMPORAL REPLAY & SCALE */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col xl:flex-row items-stretch xl:items-end justify-between gap-3 pointer-events-auto">
        {/* Legend */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl px-4 py-3 rounded-xl shadow-2xl border border-surface-container-highest/50 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
            Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-tertiary-container shadow-[0_0_8px_#ff5451]" />
            <span className="font-mono text-[10px] text-on-surface">
              VIIRS High Conf (&gt;80%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="font-mono text-[10px] text-on-surface">
              MODIS Nominal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded bg-tertiary-container/30 border-b-2 border-tertiary-container" />
            <span className="font-mono text-[10px] text-on-surface">
              Fast Forecast
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded bg-primary-container/30 border-b-2 border-primary-container" />
            <span className="font-mono text-[10px] text-on-surface">
              Slow Scenario
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-secondary" />
            <span className="font-mono text-[10px] text-secondary">
              {eventData.reserveName} Boundary
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[14px]">
              arrow_forward
            </span>
            <span className="font-mono text-[10px] text-secondary tabular-nums">
              {eventData.windSpeedKmh} km/h Drift
            </span>
          </div>
        </div>

        {/* Temporal Spread Replay */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl p-3.5 rounded-xl shadow-2xl border border-surface-container-highest/50 flex flex-col gap-2 min-w-[320px] sm:min-w-[360px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                history
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-on-surface">
                Temporal Spread Replay
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-secondary tabular-nums">
              {formattedSliderBadge}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
              className="w-7 h-7 rounded-lg bg-surface-container-highest hover:bg-secondary text-on-surface hover:text-on-secondary flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={18}
                step={0.5}
                value={timeHour}
                onChange={(e) => setTimeHour(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>
            <button
              type="button"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
              title="Toggle 1x / 2x playback speed"
              className={`px-2 h-7 rounded-lg flex items-center justify-center gap-0.5 font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                playbackSpeed === 2
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                fast_forward
              </span>
              <span>{playbackSpeed}x</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-mono text-[10px] px-0.5">
            <span>T+0h (Ignition)</span>
            <span>T+6h</span>
            <span>T+12h (Forecast)</span>
            <span>T+18h Limit</span>
          </div>
        </div>

        {/* Coordinates & Scale Bar */}
        <div className="bg-surface-container-low/95 backdrop-blur-xl px-3.5 py-2.5 rounded-xl shadow-2xl border border-surface-container-highest/50 flex items-center gap-3 font-mono text-[10px] text-on-surface-variant tabular-nums">
          <div className="flex flex-col">
            <span className="text-on-surface font-semibold">
              {eventData.centerCoords}
            </span>
            <span>PROJ: WGS84 Web Mercator</span>
          </div>
          <div className="w-[1px] h-6 bg-surface-container-highest" />
          <div className="flex flex-col items-center">
            <span className="w-16 h-1 bg-on-surface-variant/80 rounded-full mb-0.5" />
            <span>{scaleKm} km</span>
          </div>
        </div>
      </div>
    </div>
  );
};
