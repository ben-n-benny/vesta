import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Radiation,
  Wind,
  Moon,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { SCENARIO_DEFINITIONS } from '../data/missionSeed.js';

const SCENARIO_ICONS = {
  NOMINAL: CheckCircle2,
  SPE: Radiation,
  CO2_SCRUBBER: Wind,
  CIRCADIAN_BONE: Moon,
};

const TUNABLE_CONTROLS = [
  { domain: 'cardio', field: 'restingHr', label: 'Heart Rate', unit: 'bpm', min: 45, max: 130, step: 1 },
  { domain: 'cardio', field: 'hrvRmssd', label: 'HRV (RMSSD)', unit: 'ms', min: 20, max: 100, step: 1 },
  { domain: 'immuneRad', field: 'cabinCo2Ppm', label: 'Cabin CO₂', unit: 'ppm', min: 800, max: 5200, step: 50 },
  { domain: 'immuneRad', field: 'radiationRateMSvDay', label: 'Radiation Rate', unit: 'mSv/d', min: 0.8, max: 25, step: 0.2 },
  { domain: 'cognitive', field: 'pvtMeanMs', label: 'Reaction (PVT)', unit: 'ms', min: 180, max: 450, step: 5 },
  { domain: 'cognitive', field: 'circadianAlignmentPct', label: 'Circadian Align', unit: '%', min: 40, max: 100, step: 1 },
  { domain: 'cardio', field: 'aredCompletionPct', label: 'Daily ARED', unit: '%', min: 0, max: 100, step: 2 },
];

export default function ScenarioSimulator({
  activeScenario,
  telemetry,
  onSelectScenario,
  onUpdateSimValue,
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('PRESETS'); // 'PRESETS' | 'TUNE'

  const currentDef =
    SCENARIO_DEFINITIONS.find((s) => s.id === activeScenario) || null;
  const pillLabel =
    activeScenario === 'CUSTOM'
      ? 'Custom Values'
      : currentDef
      ? currentDef.shortLabel
      : 'Nominal Baseline';

  return (
    <aside aria-label="Mission Scenario Simulator" className="fixed bottom-4 right-4 z-40">
      {expanded && (
        <div className="mb-2 w-[calc(100vw-2rem)] max-w-[360px] rounded-3xl border border-white/10 bg-[#141821]/95 p-3.5 shadow-2xl backdrop-blur-xl">
          {/* Header + Segmented Tab */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">Simulate</span>
            <div className="inline-flex rounded-full bg-[#1B202C] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setTab('PRESETS')}
                className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
                  tab === 'PRESETS' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setTab('TUNE')}
                className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
                  tab === 'TUNE' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tune Values
              </button>
            </div>
          </div>

          {tab === 'PRESETS' ? (
            <div className="space-y-1.5">
              {SCENARIO_DEFINITIONS.map((sc) => {
                const Icon = SCENARIO_ICONS[sc.id] || CheckCircle2;
                const isActive = activeScenario === sc.id;
                const dotColor =
                  sc.severity === 'CRITICAL'
                    ? 'text-rose-400'
                    : sc.severity === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-emerald-400';

                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onSelectScenario(sc.id)}
                    className={`flex min-h-[44px] w-full items-start gap-2.5 rounded-2xl px-3 py-2.5 text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-[#242B3A] text-white'
                        : 'bg-[#1B202C] text-slate-300 hover:bg-[#212735]'
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${dotColor}`} />
                    <div>
                      <div className="text-xs font-medium">{sc.shortLabel}</div>
                      <div className="text-[11px] leading-snug text-slate-400">{sc.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
              {TUNABLE_CONTROLS.map((ctrl) => {
                const currentVal = telemetry[ctrl.domain]?.[ctrl.field] ?? 0;
                const displayVal =
                  ctrl.step < 1 ? Number(currentVal).toFixed(1) : Math.round(currentVal);

                return (
                  <div key={`${ctrl.domain}-${ctrl.field}`} className="card-surface-inner px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-200">{ctrl.label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step}
                          aria-label={`${ctrl.label} value`}
                          value={displayVal}
                          onChange={(e) => onUpdateSimValue(ctrl.domain, ctrl.field, e.target.value)}
                          className="font-mono-num w-18 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-right text-xs font-semibold text-white focus:border-sky-400 focus:outline-none"
                        />
                        <span className="w-9 text-[11px] text-slate-400">{ctrl.unit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={ctrl.min}
                      max={ctrl.max}
                      step={ctrl.step}
                      aria-label={`${ctrl.label} slider`}
                      value={currentVal}
                      onChange={(e) => onUpdateSimValue(ctrl.domain, ctrl.field, e.target.value)}
                      className="mt-2 w-full cursor-pointer accent-sky-400"
                    />
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => onSelectScenario('NOMINAL')}
                className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-xs font-medium text-slate-200 hover:bg-white/[0.12] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Nominal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compact Pill Toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/12 bg-[#141821]/95 px-4 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-xl transition hover:bg-[#1C222E] cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
          <span>Simulate: {pillLabel}</span>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      </div>
    </aside>
  );
}
