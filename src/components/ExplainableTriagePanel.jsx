import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  Users,
  Info,
} from 'lucide-react';

function HrpRiskBadge({ risk, label, align = 'left' }) {
  if (!risk) return null;
  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  return (
    <div className="group relative inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-indigo-400/25 bg-indigo-500/12 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200 transition hover:border-indigo-400/45 hover:bg-indigo-500/20 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 cursor-help"
        aria-label={`${risk.title}: ${risk.detail}`}
      >
        <Info className="h-3 w-3 shrink-0 text-indigo-300" />
        <span>{label}</span>
      </button>

      <div
        role="tooltip"
        className={`pointer-events-none absolute top-full ${alignClass} z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-white/15 bg-[#0F131C]/95 p-3.5 text-left shadow-2xl backdrop-blur-xl opacity-0 translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0`}
      >
        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
          <span>{risk.id} · {risk.category}</span>
          <span className="text-slate-400">NASA HRP</span>
        </div>
        <div className="mt-1 text-xs font-semibold text-white">{risk.title}</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{risk.detail}</p>
        {risk.drivers && risk.drivers.length > 0 && (
          <div className="mt-2.5 border-t border-white/10 pt-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Monitored Signals
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {risk.drivers.map((d) => (
                <span
                  key={d}
                  className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-200"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClearancePill({ label, status }) {
  const styles =
    status === 'HOLD'
      ? 'border-rose-500/30 bg-rose-500/12 text-rose-300'
      : status === 'CAUTION'
      ? 'border-amber-500/30 bg-amber-500/12 text-amber-300'
      : 'border-white/[0.08] bg-[#1B202C] text-slate-300';

  const statusText = status === 'HOLD' ? 'Hold' : status === 'CAUTION' ? 'Caution' : 'Cleared';
  const dotColor =
    status === 'HOLD' ? 'bg-rose-400' : status === 'CAUTION' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{label}:</span>
      <span className="font-semibold">{statusText}</span>
    </span>
  );
}

export default function ExplainableTriagePanel({
  triage,
  checkedCountermeasures,
  onToggleCountermeasure,
}) {
  const {
    insights,
    countermeasures,
    currentEffectiveScore,
    projectedScore,
    completedCount,
    totalCountermeasures,
    taskClearances,
    crewCorrelation,
  } = triage;
  const primary = insights[0];
  const isNominal = primary.severity === 'NOMINAL';
  const [expandedWhenNominal, setExpandedWhenNominal] = useState(false);

  const showDetails = !isNominal || expandedWhenNominal;

  const badgeTone =
    primary.severity === 'CRITICAL'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : primary.severity === 'WARNING'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';

  const iconColor =
    primary.severity === 'CRITICAL'
      ? 'text-rose-400'
      : primary.severity === 'WARNING'
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <section
      aria-label="Health Summary & Actions"
      className="card-surface overflow-visible transition-all"
    >
      {/* Clean Summary Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {isNominal ? (
            <CheckCircle2 className={`h-5 w-5 shrink-0 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 shrink-0 ${iconColor}`} />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-white sm:text-base">{primary.title}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeTone}`}>
                {isNominal ? 'Normal' : primary.severity === 'CRITICAL' ? 'Urgent' : 'Attention'}
              </span>
              {primary.hrpRisk && !isNominal && (
                <HrpRiskBadge
                  risk={primary.hrpRisk}
                  label={`NASA HRP · ${primary.hrpRisk.shortLabel}`}
                />
              )}
              {crewCorrelation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                  <Users className="h-3 w-3" />
                  {crewCorrelation}
                </span>
              )}
            </div>
            {!showDetails && (
              <p className="mt-0.5 text-xs text-slate-400">
                Heart rate, cabin CO₂, radiation, and sleep are within transit baseline.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Operational Go / No-Go Task Clearances */}
          {taskClearances && (
            <div className="hidden flex-wrap items-center gap-1.5 sm:flex" aria-label="Task Clearances">
              <ClearancePill label={taskClearances.eva.label} status={taskClearances.eva.status} />
              <ClearancePill label={taskClearances.robotics.label} status={taskClearances.robotics.status} />
              <ClearancePill label={taskClearances.docking.label} status={taskClearances.docking.status} />
            </div>
          )}

          <div className="flex items-baseline gap-1.5 rounded-full bg-[#1B202C] px-3.5 py-1.5">
            <span className="text-xs text-slate-400">Readiness</span>
            <span className="font-mono-num text-base font-semibold text-white">
              {currentEffectiveScore}
            </span>
            {!isNominal && projectedScore > currentEffectiveScore && (
              <span className="font-mono-num text-xs text-emerald-400">→ {projectedScore}</span>
            )}
          </div>

          {isNominal && (
            <button
              type="button"
              onClick={() => setExpandedWhenNominal((v) => !v)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white/[0.06] px-3 text-xs font-medium text-slate-300 hover:bg-white/[0.1] cursor-pointer"
            >
              <span>{expandedWhenNominal ? 'Hide' : 'Details'}</span>
              {expandedWhenNominal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Task Clearance Row */}
      {taskClearances && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] px-5 py-2.5 sm:hidden">
          <ClearancePill label={taskClearances.eva.label} status={taskClearances.eva.status} />
          <ClearancePill label={taskClearances.robotics.label} status={taskClearances.robotics.status} />
          <ClearancePill label={taskClearances.docking.label} status={taskClearances.docking.status} />
        </div>
      )}

      {/* Simplified Expanded Summary + iOS Reminders-Style Action List */}
      {showDetails && (
        <div className="border-t border-white/[0.07] px-5 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Concise Why */}
            <div className="space-y-3 lg:col-span-5">
              {insights.map((insight) => (
                <div key={insight.id} className="card-surface-inner p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {insights.length > 1 && (
                      <div className="text-xs font-semibold text-white">{insight.title}</div>
                    )}
                    {insight.hrpRisk && (
                      <HrpRiskBadge
                        risk={insight.hrpRisk}
                        label={`${insight.hrpRisk.id} · ${insight.hrpRisk.shortLabel}`}
                      />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{insight.differentialNote}</p>
                  {insight.hrpRisk && (
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      <span className="font-medium text-indigo-300">{insight.hrpRisk.title}:</span>{' '}
                      {insight.hrpRisk.summary}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {insight.signals.map((sig) => (
                      <div key={sig.label} className="rounded-xl bg-[#121620] px-2.5 py-2">
                        <div className="text-[11px] text-slate-400">{sig.label}</div>
                        <div className="font-mono-num mt-0.5 text-sm font-semibold text-white">
                          {sig.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Clean Apple-Reminders-style Action Checklist */}
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-medium text-slate-300">Recommended Actions</span>
                <span className="font-mono-num text-xs text-slate-400">
                  {completedCount}/{totalCountermeasures} done
                </span>
              </div>

              <div className="card-surface-inner divide-y divide-white/[0.06] overflow-hidden">
                {countermeasures.map((cm) => {
                  const checked = Boolean(checkedCountermeasures[cm.id]);
                  return (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => onToggleCountermeasure(cm.id)}
                      className="flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.03] cursor-pointer"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          checked
                            ? 'border-sky-400 bg-sky-400 text-slate-950'
                            : 'border-slate-500 bg-transparent'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          checked ? 'text-slate-500 line-through' : 'text-slate-100'
                        }`}
                      >
                        {cm.label}
                      </span>
                      <span className="font-mono-num text-xs text-slate-400">{cm.eta}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
