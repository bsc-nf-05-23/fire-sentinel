import React, { useState } from 'react';
import { EventKey, INCIDENT_EVENTS, NavView } from '../data/pyrotraceData';

interface HeaderProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  activeEvent: EventKey;
  onSelectEvent: (ev: EventKey) => void;
  dispatchedCount: number;
}

const NAV_ITEMS: { key: NavView; label: string }[] = [
  { key: 'live-situation-map', label: 'Historical Fire Replay' },
  { key: 'alerts-village-relay', label: 'Alerts & Village Relay' },
  { key: 'scenario-validation', label: 'Scenario & Validation' },
  { key: 'data-postgis-api', label: 'Data & PostGIS API' },
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  activeEvent,
  onSelectEvent,
  dispatchedCount,
}) => {
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentEvent = INCIDENT_EVENTS[activeEvent];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Brand & Live Context */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('live-situation-map')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shadow-[0_0_16px_rgba(255,87,34,0.35)]">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                local_fire_department
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[18px] font-bold tracking-tight text-on-surface leading-tight whitespace-nowrap">
                PyroTrace{' '}
                <span className="text-secondary font-mono text-[13px] tracking-widest font-normal">
                  GIS
                </span>
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant/70 tracking-wider uppercase whitespace-nowrap">
                Wildfire Spatial Dispatch
              </span>
            </div>
          </button>

          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-surface-container-highest/60">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-tertiary-container/30 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
              <span className="font-mono text-[10px] text-tertiary uppercase tracking-wider font-semibold">
                Replay Event
              </span>
              <span className="text-on-surface-variant font-mono text-[10px]">
                {currentEvent.shortTitle}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-secondary/30 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#4cd7f6]" />
              <span className="font-mono text-[10px] text-secondary tracking-widest">
                Sample Data
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container-highest/40"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectView(item.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  isActive
                    ? 'bg-surface-container-high text-secondary border border-secondary/40 font-semibold shadow-[0_0_12px_rgba(76,215,246,0.15)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Telemetry & Event Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden 2xl:flex items-center gap-2 font-mono text-[10px]">
            <div className="px-2.5 py-1 rounded bg-surface-container-low border border-surface-container-highest/60 text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px] text-secondary">
                database
              </span>
              <span>psycopg3/3.4</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-surface-container-low border border-surface-container-highest/60 text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px] text-primary">
                satellite_alt
              </span>
              <span>FIRMS: 4m ago</span>
            </div>
          </div>

          {/* Event Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setEventMenuOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-[11px] transition-colors cursor-pointer whitespace-nowrap"
              title="Switch active wildfire incident"
            >
              <span className="text-secondary">{currentEvent.code}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                unfold_more
              </span>
            </button>

            {eventMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-2xl p-1.5 z-50">
                <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  Select Incident Geometry
                </div>
                {(Object.keys(INCIDENT_EVENTS) as EventKey[]).map((key) => {
                  const ev = INCIDENT_EVENTS[key];
                  const selected = key === activeEvent;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onSelectEvent(key);
                        setEventMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        selected
                          ? 'bg-surface-container-high text-secondary'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                        <span>{ev.code}</span>
                        {selected && (
                          <span className="material-symbols-outlined text-[14px] text-secondary">
                            check
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        {ev.shortTitle} · {ev.ridgeTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operator Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setEventMenuOpen(false);
              }}
              aria-label="Operator session details"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/20 shrink-0 cursor-pointer hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-2xl p-3 z-50">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-surface-container-highest/50">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">
                    DO
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-on-surface truncate">
                      Zomba Dispatch Officer
                    </span>
                    <span className="font-mono text-[10px] text-secondary truncate">
                      DODMA · Spatial Ops Desk
                    </span>
                  </div>
                </div>
                <div className="pt-2.5 space-y-1.5 font-mono text-[11px] text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Active Event:</span>
                    <span className="text-on-surface">{currentEvent.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Relays Sent (Session):</span>
                    <span className="text-secondary font-bold tabular-nums">
                      {dispatchedCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gateway Auth:</span>
                    <span className="text-primary">VHF CH-7 + GSM</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Mobile/Tablet Navigation Strip */}
      <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectView(item.key)}
              className={`px-3 py-1 rounded-lg text-[11px] whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-surface-container-high text-secondary border border-secondary/40 font-semibold'
                  : 'text-on-surface-variant bg-surface-container-low'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
