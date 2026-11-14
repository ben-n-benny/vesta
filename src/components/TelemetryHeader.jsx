import React from 'react';
import { RotateCcw, Settings2, Sun, Moon, HelpCircle } from 'lucide-react';
import { CREW_ROSTER } from '../data/missionSeed.js';

function formatMet(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const rem = totalSeconds % 86400;
  const hrs = Math.floor(rem / 3600);
  const mins = Math.floor((rem % 3600) / 60);
  const secs = Math.floor(rem % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export default function TelemetryHeader({
  metSeconds,
  crewRoster,
  activeCrewId,
  crewSummaries,
  backendOnline,
  theme = 'dark',
  onToggleTheme,
  onSelectCrew,
  onOpenSelfCheck,
  onOpenAddMetric,
  onOpenAdmin,
  onOpenOnboarding,
  onResetMission,
}) {
  const roster = crewRoster && crewRoster.length ? crewRoster : CREW_ROSTER;
  const activeCrew = roster.find((c) => c.id === activeCrewId) || roster[0];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0A0C10]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        {/* Left: Clean Identity + MET */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-white">VESTA</h1>
            </div>
            <p className="text-xs text-slate-400">
              {activeCrew.name} · Day {activeCrew.missionDay} ·{' '}
              <span className="font-mono-num text-slate-300">MET {formatMet(metSeconds)}</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Crew Switcher + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Crew Pill Switcher */}
          <div
            className="inline-flex rounded-full border border-white/[0.07] bg-[#141821] p-1"
            role="group"
            aria-label="Crew Member Selector"
          >
            {roster.map((crew) => {
              const summary = crewSummaries?.[crew.id] || { score: 99, status: 'NOMINAL' };
              const isActive = crew.id === activeCrewId;
              const dotClass =
                summary.status === 'CRITICAL'
                  ? 'bg-rose-400'
                  : summary.status === 'WARNING'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400';

              return (
                <button
                  key={crew.id}
                  type="button"
                  onClick={() => onSelectCrew(crew.id)}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#252C3B] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  <span>{crew.shortName}</span>
                  <span className="font-mono-num text-[11px] text-slate-400">{summary.score}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/10 bg-[#141821] px-3.5 text-xs font-medium text-slate-200 transition hover:bg-[#1C222E] cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5 text-slate-300" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#141821] text-slate-300 transition hover:bg-[#1C222E] hover:text-white cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>

          <button
            type="button"
            onClick={onOpenOnboarding}
            title="Open Interactive Guide"
            aria-label="Open Interactive Guide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#141821] text-slate-300 transition hover:bg-[#1C222E] hover:text-white cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-sky-300" />
          </button>

          <button
            type="button"
            onClick={onResetMission}
            title="Reset to 14-day baseline seed"
            aria-label="Reset mission data"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#141821] text-slate-400 transition hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
