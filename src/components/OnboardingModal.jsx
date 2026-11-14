import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Users,
  ShieldAlert,
  Activity,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';
import { HRP_RISKS } from '../data/hrpRisks.js';

const STEPS = [
  {
    id: 'crew',
    title: '1. Crew Switcher & Personal Baselines',
    subtitle: 'Monitor each astronaut against their own pre-flight clinical baseline.',
    icon: Users,
  },
  {
    id: 'triage',
    title: '2. NASA HRP Triage & Hover Insights',
    subtitle: 'Understand why an alert fired, which NASA HRP Risk applies, and what to do next.',
    icon: ShieldAlert,
  },
  {
    id: 'domains',
    title: '3. Body Model & 4 Risk Domains',
    subtitle: 'Inspect affected systems on the body map and switch between Live & 14-Day trends.',
    icon: Activity,
  },
  {
    id: 'simulate',
    title: '4. Test Scenarios Anytime',
    subtitle: 'Use the bottom-right Simulate pill to inject spaceflight events or tune vitals.',
    icon: SlidersHorizontal,
  },
];

export default function OnboardingModal({
  isOpen,
  onClose,
  crewRoster = [],
  activeCrewId,
  crewSummaries = {},
  activeScenario,
  onSelectCrew,
  onSelectScenario,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[stepIndex];
  const StepIcon = step.icon;
  const activeCrew = crewRoster.find((c) => c.id === activeCrewId) || crewRoster[0];
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="VESTA Interactive Onboarding Guide"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#141821] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-sky-300">
                VESTA Quick Guide · Step {stepIndex + 1} of {STEPS.length}
              </div>
              <h2 className="text-base font-semibold text-white">{step.title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close onboarding guide"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIndex(idx)}
              aria-label={`Go to step ${idx + 1}: ${s.title}`}
              className={`h-1.5 flex-1 rounded-full transition cursor-pointer ${
                idx <= stepIndex ? 'bg-sky-400' : 'bg-white/10 hover:bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Interactive Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-slate-200">
              <StepIcon className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{step.subtitle}</p>
          </div>

          {/* Step 1 Interactive: Live Crew Switcher */}
          {step.id === 'crew' && (
            <div className="card-surface-inner space-y-3 p-4">
              <div className="text-xs font-medium text-slate-300">
                Try switching crew members (updates the live dashboard behind this guide):
              </div>
              <div className="flex flex-wrap gap-2">
                {crewRoster.map((crew) => {
                  const summary = crewSummaries?.[crew.id] || { score: 99, status: 'NOMINAL' };
                  const selected = crew.id === activeCrewId;
                  return (
                    <button
                      key={crew.id}
                      type="button"
                      onClick={() => onSelectCrew(crew.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                        selected
                          ? 'border-sky-400/50 bg-sky-500/15 text-white'
                          : 'border-white/10 bg-[#11151E] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span>{crew.name}</span>
                      <span className="font-mono-num text-[11px] text-sky-300">{summary.score}</span>
                    </button>
                  );
                })}
              </div>
              {activeCrew && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="rounded-xl bg-[#11151E] px-3 py-2">
                    <div className="text-[11px] text-slate-400">Baseline HR</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-white">
                      {activeCrew.baselines.restingHr} bpm
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#11151E] px-3 py-2">
                    <div className="text-[11px] text-slate-400">Baseline HRV</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-white">
                      {activeCrew.baselines.hrvRmssd} ms
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#11151E] px-3 py-2">
                    <div className="text-[11px] text-slate-400">Baseline PVT</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-white">
                      {activeCrew.baselines.pvtMeanMs} ms
                    </div>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Use <span className="font-medium text-slate-200">Admin</span> in the top bar anytime to add crew members or edit baselines.
              </p>
            </div>
          )}

          {/* Step 2 Interactive: Hoverable NASA HRP Risk Preview */}
          {step.id === 'triage' && (
            <div className="card-surface-inner space-y-3 p-4">
              <div className="text-xs text-slate-300">
                The top triage panel computes <span className="font-medium text-white">Readiness</span>, operational{' '}
                <span className="font-medium text-white">Task Clearances</span> (EVA, Robotics, Docking), and{' '}
                <span className="font-medium text-white">Recommended Actions</span> you can check off to project recovery.
              </div>
              <div className="rounded-xl bg-[#11151E] p-3.5 space-y-2">
                <div className="text-[11px] text-slate-400">
                  Hover or focus this sample NASA HRP Risk badge to see how clinical details appear:
                </div>
                <div className="group relative inline-block">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200 cursor-help"
                  >
                    <Info className="h-3.5 w-3.5 text-indigo-300" />
                    <span>NASA HRP · {HRP_RISKS.SANS.shortLabel}</span>
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-white/15 bg-[#0F131C]/95 p-3 shadow-2xl opacity-0 transition-all duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                      {HRP_RISKS.SANS.id} · {HRP_RISKS.SANS.category}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white">{HRP_RISKS.SANS.title}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {HRP_RISKS.SANS.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Body Model & 4 Risk Domains */}
          {step.id === 'domains' && (
            <div className="card-surface-inner space-y-2.5 p-4 text-xs text-slate-300">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-[#11151E] p-3">
                  <div className="font-semibold text-white">Human Body Model</div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Highlights cardiovascular, neural/ocular, skeletal, and immune/radiation status on the crew silhouette.
                  </p>
                </div>
                <div className="rounded-xl bg-[#11151E] p-3">
                  <div className="font-semibold text-white">4 Risk Domain Cards</div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Toggle between <span className="text-slate-200">Live</span> and <span className="text-slate-200">14D</span> trends, run the 3-min PVT reaction test, or adjust nutrition &amp; ARED load.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 Interactive: Scenario Simulator */}
          {step.id === 'simulate' && (
            <div className="card-surface-inner space-y-3 p-4">
              <div className="text-xs font-medium text-slate-300">
                Try triggering a NASA HRP scenario now (or use the <span className="text-white">Simulate</span> button in the bottom-right corner anytime):
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'SANS_FLUID_SHIFT', label: 'SANS + Isolation Drift' },
                  { id: 'SPE', label: 'Solar Particle Event' },
                  { id: 'CO2_SCRUBBER', label: 'CO₂ Scrubber Degradation' },
                  { id: 'NOMINAL', label: 'Reset to Nominal' },
                ].map((sc) => {
                  const isCurrent = activeScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => onSelectScenario(sc.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isCurrent
                          ? 'border-sky-400/50 bg-sky-500/15 text-white'
                          : 'border-white/10 bg-[#11151E] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />}
                      <span>{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.07] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Skip guide
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-white/[0.07] px-4 text-xs font-medium text-slate-200 hover:bg-white/[0.12] cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-sky-500 px-5 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Start Monitoring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
