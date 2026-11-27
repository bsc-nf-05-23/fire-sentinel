import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container-high/40 py-5">
      <div className="w-full px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] tracking-[0.06em] text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-sans text-[13px] font-bold text-on-surface">
            FIRE SENTINEL LITE DEMO
          </span>
          <span className="text-outline-variant">|</span>
          <span>Historical replay interface</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-secondary">Illustrative sample data</span>
          <span>Not an official warning system</span>
        </div>
      </div>
    </footer>
  );
};
