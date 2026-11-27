import React, { useEffect, useState } from 'react';
import {
  DispatchLogEntry,
  EventKey,
  INCIDENT_EVENTS,
  VILLAGE_RELAY_RECORDS,
  VillageKey,
} from '../data/pyrotraceData';

interface AlertsVillageRelayProps {
  activeEvent: EventKey;
  selectedVillage: VillageKey;
  onSelectVillage: (key: VillageKey) => void;
  dispatchLogs: DispatchLogEntry[];
  onAuthorizeDispatch: (entry: DispatchLogEntry) => void;
}

export const AlertsVillageRelay: React.FC<AlertsVillageRelayProps> = ({
  activeEvent,
  selectedVillage,
  onSelectVillage,
  dispatchLogs,
  onAuthorizeDispatch,
}) => {
  const eventData = INCIDENT_EVENTS[activeEvent];
  const activeVillage =
    VILLAGE_RELAY_RECORDS.find((v) => v.key === selectedVillage) ||
    VILLAGE_RELAY_RECORDS[0];

  const [protocolMode, setProtocolMode] = useState<'warning' | 'watch'>('warning');
  const [payloadText, setPayloadText] = useState(activeVillage.warningMsg);
  const [recipients, setRecipients] = useState({
    villageHead: true,
    dodma: true,
    forestry: true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [execLatency, setExecLatency] = useState(18.4);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState<{
    visible: boolean;
    village: string;
    gateways: number;
  }>({ visible: false, village: '', gateways: 3 });

  useEffect(() => {
    const village =
      VILLAGE_RELAY_RECORDS.find((v) => v.key === selectedVillage) ||
      VILLAGE_RELAY_RECORDS[0];
    setPayloadText(
      protocolMode === 'warning' ? village.warningMsg : village.watchMsg
    );
  }, [selectedVillage, protocolMode]);

  const handleSyncLayer = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setExecLatency(Number((15.2 + Math.random() * 5.8).toFixed(1)));
    }, 650);
  };

  const handleCopySql = () => {
    const sql = `SELECT v.gid, v.name, v.pop_2024, ST_Distance(v.geom, f.fire_front) AS dist_m,
       calc_spread_window(v.geom, f.rate_of_spread, f.wind_azimuth) AS window_hours
FROM tbl_villages v, tbl_fire_isochrones f
WHERE ST_Intersects(f.spread_polygon_3h, v.buffer_250m)
ORDER BY window_hours ASC LIMIT 5;`;
    navigator.clipboard?.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 1600);
  };

  const selectedRecipientCount =
    Number(recipients.villageHead) +
    Number(recipients.dodma) +
    Number(recipients.forestry);

  const handleConfirmBroadcast = () => {
    setModalOpen(false);
    const now = new Date();
    const utcStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    const relayNum = 922 + dispatchLogs.length;

    const newEntry: DispatchLogEntry = {
      id: `log-${Date.now()}`,
      timestampUtc: utcStr,
      relayCode: `RELAY-0${relayNum}`,
      title: `${activeVillage.name} ${
        protocolMode === 'warning' ? 'Warning' : 'Watch Advisory'
      }`,
      deliverySummary: `DELIVERED (${Math.max(1, selectedRecipientCount) * 16}/${
        Math.max(1, selectedRecipientCount) * 16
      } SMS)`,
      ackLabel: protocolMode === 'warning' ? 'USSD Push Sent' : 'VHF CH-7 Queued',
      severity: protocolMode === 'warning' ? 'orange' : 'cyan',
    };

    onAuthorizeDispatch(newEntry);
    setToastInfo({
      visible: true,
      village: activeVillage.name,
      gateways: Math.max(1, selectedRecipientCount),
    });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 4200);
  };

  const charCount = payloadText.length;
  const smsSegments = Math.max(1, Math.ceil(charCount / 160));

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)]">
      {/* Telemetry Context Strip */}
      <div className="w-full bg-surface-container-lowest px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high/40">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[15px]">radar</span>
            <span className="tracking-widest uppercase font-semibold">
              PostGIS ST_Intersects Stream
            </span>
          </div>
          <span className="text-surface-container-highest">/</span>
          <span className="text-on-surface-variant">
            EPSG:3857 • SPATIAL_BUFFER: 4.8km
          </span>
          <span className="text-surface-container-highest">/</span>
          <span className="text-on-surface-variant">
            MODEL_RUN_ID: SIM-2025-09-{activeEvent.toUpperCase()}-v4
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary-container" />
            Cellular Gateway: Airtel/TNM Hybrid (USSD+SMS)
          </span>
          <span>REST: POST /api/alerts [v2.4]</span>
        </div>
      </div>

      {/* 5-Card Incident Critical Stat Bar */}
      <div className="w-full px-4 lg:px-8 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                At-Risk Villages
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">
                domain
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-[30px] leading-9 font-bold text-on-surface">
                05
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Intersected
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-secondary">
              ST_DWithin ≤ 6.2km
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-error">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                Immediate Warning
              </span>
              <span className="material-symbols-outlined text-[18px] text-error animate-pulse">
                crisis_alert
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-[30px] leading-9 font-bold text-error">
                02
              </span>
              <span className="font-mono text-[10px] text-error/80">
                Zones Critical
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-error">
              Chisi • Domasi Slope
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Watch Stage
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary">
                visibility
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-[30px] leading-9 font-bold text-primary">
                03
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Buffered
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-on-surface-variant">
              Arrival 3h+
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Projected Evacuees
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">
                groups
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-[30px] leading-9 font-bold text-on-surface">
                4,280
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Census 2024
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-secondary">
              940 Households
            </div>
          </div>

          <div className="bg-surface-container-high p-3 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1 shadow-md">
            <div className="flex items-center justify-between text-primary-container">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                Spread Breach ETA
              </span>
              <span
                className="material-symbols-outlined text-[18px] text-primary-container animate-spin"
                style={{ animationDuration: '4s' }}
              >
                timelapse
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-[30px] leading-9 font-bold text-primary-container">
                1h 15m
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-on-surface truncate">
              {eventData.nearestVillage} • Perimeter Sector E
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Operations Layout */}
      <div className="w-full px-4 lg:px-8 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* LEFT COLUMN: PostGIS Village Queue (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-3">
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    layers
                  </span>
                </div>
                <div>
                  <div className="text-[17px] font-bold text-on-surface">
                    Village Impact &amp; Spatial Intersects
                  </div>
                  <div className="font-mono text-[10px] text-on-surface-variant">
                    Calculated via PostGIS ST_Intersects(spread_forecast.geom,
                    village.geom)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded bg-surface-container font-mono text-[10px] text-secondary">
                  Vector Buffer: 250m
                </span>
                <button
                  type="button"
                  onClick={handleSyncLayer}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-mono text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      isSyncing ? 'animate-spin text-secondary' : ''
                    }`}
                  >
                    refresh
                  </span>
                  <span>{isSyncing ? 'Syncing...' : 'Sync Layer'}</span>
                </button>
              </div>
            </div>

            {/* Village Queue Rows */}
            <div className="flex flex-col gap-1.5">
              {VILLAGE_RELAY_RECORDS.map((v) => {
                const isSelected = v.key === activeVillage.key;
                const stripeColor = isSelected
                  ? 'w-1.5 bg-primary-container'
                  : v.status === 'Critical Warning'
                  ? 'w-1 bg-tertiary-container'
                  : v.status === 'Elevated Watch'
                  ? 'w-1 bg-primary'
                  : 'w-1 bg-secondary';

                const badgeClass =
                  v.status === 'Critical Warning'
                    ? 'bg-error-container text-on-error-container'
                    : v.status === 'Elevated Watch'
                    ? 'bg-surface-container-highest text-primary'
                    : 'bg-surface-container-highest text-secondary';

                return (
                  <div
                    key={v.key}
                    onClick={() => onSelectVillage(v.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVillage(v.key);
                      }
                    }}
                    className={`group p-3.5 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-surface-container-high shadow-lg'
                        : 'bg-surface-container-low hover:bg-surface-container shadow-sm'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${stripeColor}`}
                    />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pl-2">
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[17px] font-bold text-on-surface group-hover:text-primary transition-colors">
                            {v.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
                          >
                            {v.status}
                          </span>
                          <span className="font-mono text-[10px] text-secondary">
                            {v.sectorLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 font-mono text-[10px] text-on-surface-variant tabular-nums">
                          <span>
                            POP:{' '}
                            <span className="text-on-surface font-semibold">
                              {v.pop}
                            </span>
                          </span>
                          <span>
                            DIST:{' '}
                            <span
                              className={`font-semibold ${
                                v.status === 'Critical Warning'
                                  ? 'text-primary-container'
                                  : 'text-on-surface'
                              }`}
                            >
                              {v.dist}
                            </span>
                          </span>
                          <span>
                            WINDOW:{' '}
                            <span
                              className={`font-semibold ${
                                v.status === 'Critical Warning'
                                  ? 'text-error'
                                  : v.status === 'Elevated Watch'
                                  ? 'text-primary'
                                  : 'text-secondary'
                              }`}
                            >
                              {v.window}
                            </span>
                          </span>
                          <span>
                            ELEV:{' '}
                            <span className="text-on-surface">{v.elev}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-[10px] text-on-surface font-medium">
                            {v.head}
                          </div>
                          <div className="font-mono text-[10px] text-on-surface-variant tabular-nums">
                            {v.phone}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVillage(v.key);
                          }}
                          className={
                            isSelected
                              ? 'px-3.5 py-2 rounded-lg bg-primary-container text-on-primary-container font-mono text-[10px] font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(255,87,34,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap'
                              : 'px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-mono text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap'
                          }
                        >
                          <span>
                            {isSelected ? 'Active Selection' : 'Review & Stage'}
                          </span>
                          <span className="material-symbols-outlined text-[16px]">
                            {isSelected ? 'chevron_right' : 'arrow_forward'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PostGIS Query Terminal Widget */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-inner font-mono text-[10px]">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[14px]">
                    terminal
                  </span>
                  LIVE POSTGIS INTERSECT PIPELINE
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant/70 tabular-nums">
                    Execution: {execLatency}ms
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-secondary hover:text-on-surface flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      content_copy
                    </span>
                    <span>{sqlCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className="text-on-surface-variant/85 overflow-x-auto whitespace-pre leading-relaxed select-all font-mono">
{`SELECT v.gid, v.name, v.pop_2024, ST_Distance(v.geom, f.fire_front) AS dist_m,
       calc_spread_window(v.geom, f.rate_of_spread, f.wind_azimuth) AS window_hours
FROM tbl_villages v, tbl_fire_isochrones f
WHERE ST_Intersects(f.spread_polygon_3h, v.buffer_250m)
ORDER BY window_hours ASC LIMIT 5;`}
              </pre>
            </div>

            {/* Recent Dispatch Logs */}
            <div className="bg-surface-container-low p-3.5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    satellite
                  </span>
                  <span className="text-[15px] font-bold text-on-surface">
                    Recent Dispatch Logs (Relay Gateway)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  Gateway: Twilio + GSM-Malawi
                </span>
              </div>
              <div className="divide-y divide-surface-container-highest/30">
                {dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tabular-nums"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.severity === 'cyan'
                            ? 'bg-secondary'
                            : 'bg-primary-container'
                        }`}
                      />
                      <span className="text-on-surface font-semibold">
                        {log.timestampUtc}
                      </span>
                      <span className="text-on-surface-variant">
                        {log.relayCode}
                      </span>
                      <span className="text-on-surface">{log.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          log.severity === 'cyan'
                            ? 'text-secondary'
                            : 'text-primary-container'
                        }
                      >
                        {log.deliverySummary}
                      </span>
                      <span className="text-on-surface-variant">
                        {log.ackLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Simulated Alert Dispatch Console (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-3">
            <div className="bg-surface-container-low p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping shrink-0" />
                  <span className="text-[17px] font-bold text-on-surface truncate">
                    Dispatch Target: {activeVillage.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-mono text-[10px] shrink-0">
                  {activeVillage.sectorCode}
                </span>
              </div>

              {/* Spatial Mini Canvas / Vector Diagram */}
              <div className="w-full bg-surface-container-lowest rounded-xl p-2.5 relative overflow-hidden mb-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant mb-1">
                  <span>FIRE ELLIPSE TRAJECTORY → INTERSECT</span>
                  <span className="text-primary-container font-semibold">
                    WIND: {eventData.windSpeedKmh}km/h • AZM:{' '}
                    {eventData.windAzimuthDeg}° {eventData.spreadDirection}
                  </span>
                </div>

                <div className="relative w-full h-44 bg-surface rounded-lg overflow-hidden flex items-center justify-center">
                  <svg
                    className="w-full h-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 460 170"
                  >
                    <defs>
                      <radialGradient id="fireGlow" cx="20%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ff5722" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#ff5451" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient
                        id="spreadCone"
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                      >
                        <stop offset="0%" stopColor="#ff5722" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.05" />
                      </linearGradient>
                      <pattern
                        id="mini-grid"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 20 0 L 0 0 0 20"
                          fill="none"
                          stroke="#242a38"
                          strokeWidth="0.7"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mini-grid)" />
                    <path
                      d="M 10 30 Q 120 40 220 20 T 450 15"
                      fill="none"
                      stroke="#2f3543"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <path
                      d="M 10 80 Q 150 90 280 60 T 450 65"
                      fill="none"
                      stroke="#2f3543"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <path
                      d="M 10 140 Q 170 120 310 130 T 450 120"
                      fill="none"
                      stroke="#2f3543"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <polygon
                      points="60,85 240,40 370,60 370,110 240,130"
                      fill="url(#spreadCone)"
                    />
                    <ellipse
                      cx="70"
                      cy="85"
                      rx="45"
                      ry="32"
                      fill="url(#fireGlow)"
                      stroke="#ff5722"
                      strokeWidth="2"
                    />
                    <ellipse
                      cx="60"
                      cy="85"
                      rx="20"
                      ry="14"
                      fill="#ffb5a0"
                      opacity="0.4"
                    />
                    <line
                      x1="80"
                      y1="85"
                      x2="280"
                      y2="78"
                      stroke="#4cd7f6"
                      strokeDasharray="6 3"
                      strokeWidth="2.5"
                    />
                    <polygon points="285,78 275,73 275,83" fill="#4cd7f6" />
                    <text
                      x="130"
                      y="70"
                      fill="#4cd7f6"
                      fontFamily="JetBrains Mono"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      SPREAD VECTOR: {eventData.maxGustKmh} km/h
                    </text>
                    <path
                      d="M 180 50 Q 230 80 180 115"
                      fill="none"
                      stroke="#ffb5a0"
                      strokeDasharray="2 2"
                      strokeWidth="1.5"
                    />
                    <text
                      x="170"
                      y="44"
                      fill="#ffb5a0"
                      fontFamily="JetBrains Mono"
                      fontSize="9"
                    >
                      ETA {activeVillage.etaShort}
                    </text>
                    <circle
                      cx="340"
                      cy="82"
                      r="32"
                      fill="#4cd7f6"
                      fillOpacity="0.1"
                      stroke="#4cd7f6"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <circle cx="340" cy="82" r="5" fill="#4cd7f6" />
                    <circle
                      cx="340"
                      cy="82"
                      r="14"
                      fill="none"
                      stroke="#ff5451"
                      strokeWidth="2"
                      className="animate-ping"
                      style={{ transformOrigin: '340px 82px' }}
                    />
                    <text
                      x="265"
                      y="134"
                      fill="#dde2f5"
                      fontFamily="Space Grotesk"
                      fontSize="12"
                      fontWeight="700"
                    >
                      {activeVillage.name}
                    </text>
                    <text
                      x="265"
                      y="148"
                      fill="#4cd7f6"
                      fontFamily="JetBrains Mono"
                      fontSize="10"
                    >
                      {activeVillage.intersectUtc}
                    </text>
                  </svg>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-on-surface-variant">
                  <span>
                    LAT: {activeVillage.lat} • LON: {activeVillage.lon}
                  </span>
                  <span className="text-secondary">
                    Evac Route: {activeVillage.evacRoute}
                  </span>
                </div>
              </div>

              {/* Message Urgency Protocol Toggle */}
              <div className="mb-3">
                <span className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-1.5 font-semibold">
                  Message Urgency Protocol
                </span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-lg">
                  <button
                    type="button"
                    onClick={() => setProtocolMode('warning')}
                    className={`py-2 rounded font-mono text-[10px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      protocolMode === 'warning'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      warning
                    </span>
                    Evacuation Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setProtocolMode('watch')}
                    className={`py-2 rounded font-mono text-[10px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      protocolMode === 'watch'
                        ? 'bg-surface-container-high text-secondary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      info
                    </span>
                    Watch Notice (Advisory)
                  </button>
                </div>
              </div>

              {/* Editable Message Payload */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <label
                    htmlFor="alert-payload-input"
                    className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold"
                  >
                    Payload Content (SMS &amp; USSD broadcast)
                  </label>
                  <span className="font-mono text-[10px] text-on-surface-variant tabular-nums">
                    {charCount} / 320 chars ({smsSegments} SMS segment
                    {smsSegments > 1 ? 's' : ''})
                  </span>
                </div>
                <textarea
                  id="alert-payload-input"
                  rows={4}
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface font-mono text-[11px] p-3 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-secondary leading-relaxed resize-none selection:bg-primary-container selection:text-on-primary-container"
                />
              </div>

              {/* Target Relay Stakeholders */}
              <div className="mb-4">
                <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">
                  Target Relay Stakeholders
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded bg-surface-container font-mono text-[10px] cursor-pointer hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={recipients.villageHead}
                        onChange={() =>
                          setRecipients((r) => ({
                            ...r,
                            villageHead: !r.villageHead,
                          }))
                        }
                        className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                      />
                      <span className="text-on-surface font-sans text-[12px] font-medium">
                        {activeVillage.head} (Village Head)
                      </span>
                    </div>
                    <span className="text-secondary tabular-nums">
                      {activeVillage.phone}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-surface-container font-mono text-[10px] cursor-pointer hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={recipients.dodma}
                        onChange={() =>
                          setRecipients((r) => ({ ...r, dodma: !r.dodma }))
                        }
                        className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                      />
                      <span className="text-on-surface font-sans text-[12px] font-medium">
                        Dist. Disaster Mgmt Officer (DODMA)
                      </span>
                    </div>
                    <span className="text-secondary tabular-nums">
                      +265 99 941 0022
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-surface-container font-mono text-[10px] cursor-pointer hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={recipients.forestry}
                        onChange={() =>
                          setRecipients((r) => ({
                            ...r,
                            forestry: !r.forestry,
                          }))
                        }
                        className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                      />
                      <span className="text-on-surface font-sans text-[12px] font-medium">
                        Zomba Plateau Forestry Ranger Station
                      </span>
                    </div>
                    <span className="text-secondary">VHF CH-07 + SMS</span>
                  </label>
                </div>
              </div>

              {/* Dispatch CTA */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={selectedRecipientCount === 0}
                  onClick={() => setModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary-container text-on-primary-container text-[17px] font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(255,87,34,0.4)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    cell_tower
                  </span>
                  <span>Dispatch SMS &amp; Radio Relay</span>
                </button>
                <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant px-1">
                  <span>Method: POST /api/alerts</span>
                  <span className="text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Instant USSD Flash Push Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Broadcast Authorization Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-low max-w-lg w-full rounded-xl p-5 shadow-2xl border border-surface-container-highest flex flex-col gap-4">
            <div className="flex items-center gap-3 text-primary-container">
              <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  crisis_alert
                </span>
              </div>
              <div>
                <div className="text-[18px] font-bold text-on-surface">
                  Confirm Broadcast Authorization
                </div>
                <div className="font-mono text-[10px] text-on-surface-variant">
                  POST /api/alerts • TOKEN: DISPATCH_AUTH_GEO_2025
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-lg font-mono text-[11px] text-on-surface-variant space-y-2 tabular-nums">
              <div className="flex justify-between">
                <span>TARGET SETTLEMENT:</span>
                <span className="text-on-surface font-bold">
                  {activeVillage.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EST. POPULATION:</span>
                <span className="text-on-surface font-bold">
                  {activeVillage.pop} civilians
                </span>
              </div>
              <div className="flex justify-between">
                <span>ARRIVAL WINDOW:</span>
                <span className="text-error font-bold">
                  {activeVillage.window} ETA
                </span>
              </div>
              <div className="flex justify-between">
                <span>GATEWAYS ENGAGED:</span>
                <span className="text-secondary font-bold">
                  Airtel MW, TNM, VHF-7 ({selectedRecipientCount} targets)
                </span>
              </div>
            </div>

            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              This action initiates urgent emergency cell-broadcast and SMS
              gateway triggers. Village leadership and local forestry personnel
              will receive immediate audio and siren cue instructions.
            </p>

            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-[11px] font-medium transition-colors cursor-pointer"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleConfirmBroadcast}
                className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(255,87,34,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  send
                </span>
                Authorize Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-secondary-container text-on-secondary-container p-3.5 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 ${
          toastInfo.visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">verified</span>
        <div className="flex flex-col">
          <span className="text-[14px] font-bold">
            POST /api/alerts Executed ({toastInfo.village})
          </span>
          <span className="font-mono text-[10px]">
            Dispatched to {toastInfo.gateways} Gateways • Status 201 Created
          </span>
        </div>
      </div>
    </div>
  );
};
