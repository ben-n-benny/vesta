import React, { useState } from 'react';
import {
  Heart,
  Wind,
  Moon,
  Activity,
  Plus,
  Minus,
  X,
  Zap,
  Bone,
  Sun,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { CREW_PROFILE } from '../data/missionSeed.js';
import PVTReactionTest from './PVTReactionTest.jsx';

function StatusPill({ status }) {
  if (status === 'CRITICAL') {
    return (
      <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
        Critical
      </span>
    );
  }
  if (status === 'WARNING') {
    return (
      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
        Elevated
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
      Normal
    </span>
  );
}

function RangeToggle({ value, onChange, label }) {
  return (
    <div
      className="inline-flex rounded-full bg-[#1B202C] p-0.5 text-[11px]"
      role="group"
      aria-label={`${label} view range`}
    >
      <button
        type="button"
        onClick={() => onChange('LIVE')}
        className={`rounded-full px-2.5 py-0.5 font-medium transition cursor-pointer ${
          value === 'LIVE' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Live
      </button>
      <button
        type="button"
        onClick={() => onChange('14D')}
        className={`rounded-full px-2.5 py-0.5 font-medium transition cursor-pointer ${
          value === '14D' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        14d
      </button>
    </div>
  );
}

function CleanTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0D1017]/95 px-2.5 py-1.5 font-mono-num text-[11px] shadow-xl">
      <div className="text-slate-400">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-white">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskDomainCards({
  telemetry,
  history14d,
  liveWaveforms,
  domainStatuses,
  deltas,
  lastPvtSession,
  crewBaselines,
  enabledAddons,
  customMetrics,
  onCompletePvt,
  onAdjustNutrition,
  onToggleAddon,
  onAdjustCustomMetric,
  onRemoveCustomMetric,
  onOpenAddMetric,
}) {
  const { cardio, bone, immuneRad, cognitive } = telemetry;
  const base = crewBaselines || CREW_PROFILE.baselines;
  const [showInlinePvt, setShowInlinePvt] = useState(false);
  const [cardRanges, setCardRanges] = useState({
    heart: 'LIVE',
    air: 'LIVE',
    sleep: 'LIVE',
    activity: 'LIVE',
  });

  const setCardRange = (cardKey, nextRange) => {
    setCardRanges((prev) => ({ ...prev, [cardKey]: nextRange }));
  };

  const sleepSegments = [
    { name: 'Deep', hrs: Number(cognitive.deepSleepHours.toFixed(1)), color: '#38bdf8' },
    { name: 'REM', hrs: Number(cognitive.remSleepHours.toFixed(1)), color: '#818cf8' },
    { name: 'Light', hrs: Number(cognitive.lightSleepHours.toFixed(1)), color: '#475569' },
  ];

  const hasPvtPinned = enabledAddons.includes('pvt');
  const hasBonePinned = enabledAddons.includes('bone');
  const hasOrthoPinned = enabledAddons.includes('orthostatic');
  const hasVocPinned = enabledAddons.includes('voc');

  return (
    <div className="space-y-4">
      {/* BASIC HEALTH MONITORING (4 Clean Cards) */}
      <section aria-label="Basic Health Monitoring" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. HEART */}
        <article className="card-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <Heart className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Heart &amp; Vitals</h2>
            </div>
            <div className="flex items-center gap-2">
              <RangeToggle
                label="Heart & Vitals"
                value={cardRanges.heart}
                onChange={(r) => setCardRange('heart', r)}
              />
              <StatusPill status={domainStatuses.cardio} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="font-mono-num text-3xl font-semibold tracking-tight text-white">
                {Math.round(cardio.restingHr)}
                <span className="ml-1.5 text-sm font-normal text-slate-400">bpm</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Resting HR · Base {base.restingHr} bpm
              </div>
            </div>

            <div className="flex gap-5">
              <div>
                <div
                  className={`font-mono-num text-lg font-semibold ${
                    deltas.hrvDropPct > 15 ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {Math.round(cardio.hrvRmssd)} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
                <div className="text-[11px] text-slate-400">HRV (Base {base.hrvRmssd})</div>
              </div>
              <div>
                <div className="font-mono-num text-lg font-semibold text-white">
                  {Math.round(cardio.systolicBp)}/{Math.round(cardio.diastolicBp)}
                </div>
                <div className="text-[11px] text-slate-400">BP (mmHg)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {cardRanges.heart === 'LIVE' ? (
                <LineChart data={liveWaveforms} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[30, 120]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Line type="monotone" dataKey="hr" name="HR (bpm)" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              ) : (
                <LineChart data={history14d} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[40, 85]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Line type="monotone" dataKey="hr" name="14d HR (bpm)" stroke="#fb7185" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="hrv" name="14d HRV (ms)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </article>

        {/* 2. CABIN ENVIRONMENT & OXYGEN */}
        <article className="card-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Wind className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Cabin Air &amp; CO₂</h2>
            </div>
            <div className="flex items-center gap-2">
              <RangeToggle
                label="Cabin Air"
                value={cardRanges.air}
                onChange={(r) => setCardRange('air', r)}
              />
              <StatusPill status={immuneRad.cabinCo2Ppm > 3500 ? 'CRITICAL' : immuneRad.cabinCo2Ppm > 2200 ? 'WARNING' : 'NOMINAL'} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div
                className={`font-mono-num text-3xl font-semibold tracking-tight ${
                  immuneRad.cabinCo2Ppm > 3500
                    ? 'text-rose-300'
                    : immuneRad.cabinCo2Ppm > 2200
                    ? 'text-amber-300'
                    : 'text-white'
                }`}
              >
                {Math.round(immuneRad.cabinCo2Ppm).toLocaleString()}
                <span className="ml-1.5 text-sm font-normal text-slate-400">ppm</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">Cabin CO₂ (Target &lt; 2,000)</div>
            </div>

            <div className="flex gap-5">
              <div>
                <div className="font-mono-num text-lg font-semibold text-white">
                  {immuneRad.cabinO2Pct}
                  <span className="text-xs font-normal text-slate-400">%</span>
                </div>
                <div className="text-[11px] text-slate-400">Oxygen</div>
              </div>
              <div>
                <div className="font-mono-num text-lg font-semibold text-white">
                  {immuneRad.cabinPressureKpa}
                </div>
                <div className="text-[11px] text-slate-400">kPa</div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {cardRanges.air === 'LIVE' ? (
                <AreaChart data={liveWaveforms} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="appleCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[800, 4800]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Area type="monotone" dataKey="co2" name="CO₂ (ppm)" stroke="#38bdf8" fill="url(#appleCo2)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              ) : (
                <AreaChart data={history14d} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="appleCo2Hist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[900, 1600]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Area type="monotone" dataKey="co2" name="14d CO₂ (ppm)" stroke="#38bdf8" fill="url(#appleCo2Hist)" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </article>

        {/* 3. SLEEP & COGNITIVE FOCUS */}
        <article className="card-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                <Moon className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Sleep &amp; Focus</h2>
            </div>
            <div className="flex items-center gap-2">
              <RangeToggle
                label="Sleep & Focus"
                value={cardRanges.sleep}
                onChange={(r) => setCardRange('sleep', r)}
              />
              <StatusPill status={domainStatuses.cognitive} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="font-mono-num text-3xl font-semibold tracking-tight text-white">
                {cognitive.sleepHours.toFixed(1)}
                <span className="ml-1.5 text-sm font-normal text-slate-400">hrs</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">Last Sleep Cycle</div>
            </div>

            <div className="flex gap-5">
              <div>
                <div
                  className={`font-mono-num text-lg font-semibold ${
                    cognitive.circadianAlignmentPct < 75 ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {cognitive.circadianAlignmentPct}
                  <span className="text-xs font-normal text-slate-400">%</span>
                </div>
                <div className="text-[11px] text-slate-400">Circadian</div>
              </div>
              <div>
                <div
                  className={`font-mono-num text-lg font-semibold ${
                    deltas.pvtSlowingMs > 40 ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {Math.round(cognitive.pvtMeanMs)}
                  <span className="text-xs font-normal text-slate-400"> ms</span>
                </div>
                <div className="text-[11px] text-slate-400">Reaction (Base {base.pvtMeanMs})</div>
              </div>
            </div>
          </div>

          {cardRanges.sleep === 'LIVE' ? (
            <div className="mt-5 card-surface-inner p-3.5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                {sleepSegments.map((seg) => (
                  <div
                    key={seg.name}
                    style={{
                      width: `${(seg.hrs / Math.max(1, cognitive.sleepHours)) * 100}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-sky-300">Deep {cognitive.deepSleepHours.toFixed(1)}h</span>
                <span className="text-indigo-300">REM {cognitive.remSleepHours.toFixed(1)}h</span>
                <span>Light {cognitive.lightSleepHours.toFixed(1)}h</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history14d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[200, 290]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Line type="monotone" dataKey="pvt" name="14d Reaction (ms)" stroke="#818cf8" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!hasPvtPinned && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowInlinePvt((v) => !v)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/[0.1] cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-sky-400" />
                <span>{showInlinePvt ? 'Hide Reaction Test' : 'Run 3-Min Reaction Test (PVT)'}</span>
              </button>
              {showInlinePvt && (
                <div className="mt-3">
                  <PVTReactionTest
                    currentPvtMs={cognitive.pvtMeanMs}
                    baselinePvtMs={base.pvtMeanMs}
                    lastSession={lastPvtSession}
                    onCompleteSession={onCompletePvt}
                  />
                </div>
              )}
            </div>
          )}
        </article>

        {/* 4. RADIATION & DAILY EXERCISE */}
        <article className="card-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Shield className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Radiation &amp; Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              <RangeToggle
                label="Radiation & Activity"
                value={cardRanges.activity}
                onChange={(r) => setCardRange('activity', r)}
              />
              <StatusPill
                status={
                  immuneRad.radiationRateMSvDay >= 4.0
                    ? 'CRITICAL'
                    : cardio.aredCompletionPct < 70
                    ? 'WARNING'
                    : 'NOMINAL'
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div
                className={`font-mono-num text-3xl font-semibold tracking-tight ${
                  immuneRad.radiationRateMSvDay >= 4 ? 'text-rose-300' : 'text-white'
                }`}
              >
                {immuneRad.radiationRateMSvDay.toFixed(2)}
                <span className="ml-1.5 text-sm font-normal text-slate-400">mSv/d</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Cumulative: {immuneRad.cumulativeRadMSv.toFixed(1)} mSv
              </div>
            </div>

            <div>
              <div
                className={`font-mono-num text-2xl font-semibold ${
                  cardio.aredCompletionPct < 70 ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {cardio.aredCompletionPct}%
              </div>
              <div className="text-[11px] text-slate-400">Daily ARED</div>
            </div>
          </div>

          {cardRanges.activity === 'LIVE' ? (
            <>
              <div className="mt-5 card-surface-inner p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Resistive Exercise Goal</span>
                  <span className="font-mono-num text-slate-400">{cardio.aredCompletionPct} / 100%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cardio.aredCompletionPct < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, cardio.aredCompletionPct)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Self-reported symptoms</span>
                <span className="font-medium text-slate-200">
                  {immuneRad.immuneSymptomScore === 0 ? 'None' : `${immuneRad.immuneSymptomScore} noted`}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-4 h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history14d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 105]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Bar dataKey="ared" name="14d ARED %" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      {/* OPTIONAL ADDED MODULES & CUSTOM METRICS */}
      {(enabledAddons.length > 0 || customMetrics.length > 0) && (
        <section aria-label="Pinned & Custom Metrics" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasBonePinned && (
            <article className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
                    <Bone className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Bone &amp; Calcium (DEXA)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAddon('bone')}
                  aria-label="Remove Bone module"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <div className="font-mono-num text-2xl font-semibold text-white">
                    {bone.currentBmd.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-slate-400">g/cm²</span>
                  </div>
                  <div className="text-xs text-slate-400">{deltas.bmdChangePct}% vs pre-flight DEXA</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-num text-xl font-semibold text-white">
                    {bone.skeletalLoadScore}/100
                  </div>
                  <div className="text-[11px] text-slate-400">Skeletal Load</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="card-surface-inner flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Sun className="h-3 w-3 text-amber-300" /> Vit D3
                    </div>
                    <div className="font-mono-num text-xs font-semibold text-white">
                      {bone.vitaminDIu} IU
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdjustNutrition('vitaminDIu', 200)}
                    className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-white/[0.14] cursor-pointer"
                  >
                    +200
                  </button>
                </div>

                <div className="card-surface-inner flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-[11px] text-slate-400">Calcium</div>
                    <div className="font-mono-num text-xs font-semibold text-white">
                      {bone.calciumMg} mg
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdjustNutrition('calciumMg', 250)}
                    className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-white/[0.14] cursor-pointer"
                  >
                    +250
                  </button>
                </div>
              </div>

              <div className="mt-3 h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history14d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 105]} axisLine={false} tickLine={false} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="skeletalLoad" name="Load Score" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          )}

          {hasOrthoPinned && (
            <article className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                    <Activity className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Orthostatic &amp; Fluid Shift</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAddon('orthostatic')}
                  aria-label="Remove Orthostatic module"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card-surface-inner p-3.5">
                  <div className="text-xs text-slate-400">Orthostatic Tolerance</div>
                  <div className="font-mono-num mt-1 text-2xl font-semibold text-white">
                    {Math.round(cardio.orthostaticIndex)}%
                  </div>
                </div>
                <div className="card-surface-inner p-3.5">
                  <div className="text-xs text-slate-400">Headward Fluid Shift</div>
                  <div className="font-mono-num mt-1 text-2xl font-semibold text-white">
                    +{cardio.fluidShiftIndex}%
                  </div>
                </div>
              </div>
            </article>
          )}

          {hasVocPinned && (
            <article className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                    <Wind className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Cabin VOCs &amp; Trace Gases</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAddon('voc')}
                  aria-label="Remove VOC module"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card-surface-inner p-3.5">
                  <div className="text-xs text-slate-400">Cabin VOCs</div>
                  <div className="font-mono-num mt-1 text-2xl font-semibold text-white">
                    {Math.round(immuneRad.cabinVocPpb)}{' '}
                    <span className="text-xs font-normal text-slate-400">ppb</span>
                  </div>
                </div>
                <div className="card-surface-inner p-3.5">
                  <div className="text-xs text-slate-400">Immune Check</div>
                  <div className="font-mono-num mt-1 text-2xl font-semibold text-white">
                    {immuneRad.immuneSymptomScore === 0 ? 'Clear' : `Lvl ${immuneRad.immuneSymptomScore}`}
                  </div>
                </div>
              </div>
            </article>
          )}

          {hasPvtPinned && (
            <article className="card-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Pinned PVT Reaction Test</h3>
                <button
                  type="button"
                  onClick={() => onToggleAddon('pvt')}
                  aria-label="Unpin PVT module"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <PVTReactionTest
                currentPvtMs={cognitive.pvtMeanMs}
                baselinePvtMs={base.pvtMeanMs}
                lastSession={lastPvtSession}
                onCompleteSession={onCompletePvt}
              />
            </article>
          )}

          {/* Custom User-Added Metrics */}
          {customMetrics.map((metric) => (
            <article key={metric.id} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{metric.label}</h3>
                  <p className="text-xs text-slate-400">Target: {metric.target}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCustomMetric(metric.id)}
                  aria-label={`Remove ${metric.label}`}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="font-mono-num text-3xl font-semibold text-white">
                  {metric.value}
                  <span className="ml-1.5 text-sm font-normal text-slate-400">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAdjustCustomMetric(metric.id, -metric.step)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B202C] text-slate-200 hover:bg-[#252C3B] cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustCustomMetric(metric.id, metric.step)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B202C] text-slate-200 hover:bg-[#252C3B] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Subtle Add More Prompt */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onOpenAddMetric}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-dashed border-white/15 bg-white/[0.02] px-4 text-xs font-medium text-slate-400 transition hover:border-white/30 hover:text-slate-200 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-sky-400" />
          <span>Add Bone Density, PVT Test, Fluid Shift, or Custom Metric</span>
        </button>
      </div>
    </div>
  );
}
