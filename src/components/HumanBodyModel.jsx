import React, { useState } from 'react';
import { Heart, Brain, Bone, Shield, Activity } from 'lucide-react';

const STATUS_PALETTE = {
  NOMINAL: {
    stroke: '#34d399',
    fill: 'rgba(52, 211, 153, 0.22)',
    glow: 'rgba(52, 211, 153, 0.45)',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Nominal',
  },
  WARNING: {
    stroke: '#fbbf24',
    fill: 'rgba(251, 191, 36, 0.26)',
    glow: 'rgba(251, 191, 36, 0.5)',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Elevated',
  },
  CRITICAL: {
    stroke: '#fb7185',
    fill: 'rgba(251, 113, 133, 0.3)',
    glow: 'rgba(251, 113, 133, 0.6)',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Critical',
  },
};

const SYSTEMS = [
  {
    id: 'cognitive',
    label: 'Neuro & Cognitive',
    shortLabel: 'Cognitive',
    icon: Brain,
    region: 'Cranial / CNS',
  },
  {
    id: 'cardio',
    label: 'Cardiovascular',
    shortLabel: 'Cardio',
    icon: Heart,
    region: 'Thoracic / Heart',
  },
  {
    id: 'immuneRad',
    label: 'Immune & Radiation',
    shortLabel: 'Immune / Rad',
    icon: Shield,
    region: 'Respiratory & Lymphatic',
  },
  {
    id: 'bone',
    label: 'Musculoskeletal',
    shortLabel: 'Bone / Load',
    icon: Bone,
    region: 'Axial & Appendicular Skeleton',
  },
];

function getSystemMetrics(systemId, telemetry, deltas) {
  const { cardio, bone, immuneRad, cognitive } = telemetry;
  if (systemId === 'cognitive') {
    return [
      { label: 'Sleep Duration', value: `${cognitive.sleepHours.toFixed(1)} hrs` },
      { label: 'Circadian Align', value: `${Math.round(cognitive.circadianAlignmentPct)}%` },
      {
        label: 'PVT Reaction',
        value: `${Math.round(cognitive.pvtMeanMs)} ms`,
        delta: deltas?.pvtSlowingMs > 0 ? `+${deltas.pvtSlowingMs} ms` : `${deltas?.pvtSlowingMs ?? 0} ms`,
      },
      { label: 'Mood Score', value: `${cognitive.moodScore.toFixed(1)} / 10` },
    ];
  }
  if (systemId === 'cardio') {
    return [
      { label: 'Resting HR', value: `${Math.round(cardio.restingHr)} bpm` },
      {
        label: 'HRV (RMSSD)',
        value: `${Math.round(cardio.hrvRmssd)} ms`,
        delta: deltas?.hrvDropPct > 0 ? `-${deltas.hrvDropPct}%` : `+${Math.abs(deltas?.hrvDropPct ?? 0)}%`,
      },
      { label: 'Blood Pressure', value: `${Math.round(cardio.systolicBp)}/${Math.round(cardio.diastolicBp)} mmHg` },
      { label: 'Orthostatic / ARED', value: `${Math.round(cardio.orthostaticIndex)}% · ${Math.round(cardio.aredCompletionPct)}%` },
    ];
  }
  if (systemId === 'immuneRad') {
    return [
      { label: 'Radiation Dose', value: `${immuneRad.radiationRateMSvDay.toFixed(2)} mSv/d` },
      { label: 'Cabin CO₂', value: `${Math.round(immuneRad.cabinCo2Ppm).toLocaleString()} ppm` },
      { label: 'Cabin VOCs', value: `${Math.round(immuneRad.cabinVocPpb)} ppb` },
      { label: 'Immune Symptoms', value: `${immuneRad.immuneSymptomScore} reported` },
    ];
  }
  return [
    {
      label: 'BMD Delta',
      value: `${deltas?.bmdChangePct >= 0 ? '+' : ''}${deltas?.bmdChangePct ?? 0}%`,
    },
    { label: 'Skeletal Load', value: `${Math.round(bone.skeletalLoadScore)} / 100` },
    { label: 'Vitamin D', value: `${Math.round(bone.vitaminDIu)} IU` },
    { label: 'Calcium Intake', value: `${Math.round(bone.calciumMg)} mg` },
  ];
}

export default function HumanBodyModel({
  telemetry,
  domainStatuses = {},
  deltas = {},
  crew,
  overallStatus = 'NOMINAL',
}) {
  const [selectedSystem, setSelectedSystem] = useState('cardio');
  const [hoveredSystem, setHoveredSystem] = useState(null);

  const activeSystemId = hoveredSystem || selectedSystem;
  const activeMeta = SYSTEMS.find((s) => s.id === activeSystemId) || SYSTEMS[1];
  const activeStatus = domainStatuses[activeSystemId] || 'NOMINAL';
  const activePalette = STATUS_PALETTE[activeStatus] || STATUS_PALETTE.NOMINAL;
  const overallPalette = STATUS_PALETTE[overallStatus] || STATUS_PALETTE.NOMINAL;
  const metrics = getSystemMetrics(activeSystemId, telemetry, deltas);

  const getPalette = (id) => STATUS_PALETTE[domainStatuses[id] || 'NOMINAL'] || STATUS_PALETTE.NOMINAL;
  const hrBpm = Math.max(40, Math.min(180, telemetry?.cardio?.restingHr || 64));
  const pulseDuration = `${(60 / hrBpm).toFixed(2)}s`;

  const cogPal = getPalette('cognitive');
  const cardioPal = getPalette('cardio');
  const immPal = getPalette('immuneRad');
  const bonePal = getPalette('bone');

  return (
    <section className="card-surface p-5" aria-label="Biometric Human Model">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Crew Biometric Digital Twin
            </h2>
            <p className="text-xs text-slate-400">
              {crew?.name || 'Crew Member'} · Click or hover a physiological system to inspect live vitals
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${overallPalette.badgeBg}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${overallPalette.dot}`} />
          Whole-Body Status: {overallPalette.label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Interactive 2D SVG Anatomical Diagram */}
        <div className="card-surface-inner relative flex items-center justify-center overflow-hidden p-4 lg:col-span-5">
          {/* Subtle clinical grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.16), transparent 68%), linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 24px 24px, 24px 24px',
            }}
          />

          <svg
            viewBox="0 0 260 440"
            className="relative z-10 h-[340px] w-full max-w-[260px] select-none"
            role="img"
            aria-label="Interactive human anatomical telemetry diagram"
          >
            <defs>
              <filter id="organ-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Human Body Outer Silhouette */}
            <path
              d="M130 22
                 C146 22 156 34 156 50
                 C156 64 148 74 141 78
                 L142 88
                 C164 92 186 102 196 122
                 L214 198
                 C217 210 212 222 204 224
                 C196 226 190 218 187 206
                 L173 142
                 L170 216
                 L175 248
                 L168 338
                 L165 404
                 C165 415 157 422 149 422
                 C141 422 136 414 136 403
                 L135 266
                 L125 266
                 L124 403
                 C124 414 119 422 111 422
                 C103 422 95 415 95 404
                 L92 338
                 L85 248
                 L90 216
                 L87 142
                 L73 206
                 C70 218 64 226 56 224
                 C48 222 43 210 46 198
                 L64 122
                 C74 102 96 92 118 88
                 L119 78
                 C112 74 104 64 104 50
                 C104 34 114 22 130 22 Z"
              fill="rgba(148, 163, 184, 0.08)"
              stroke="rgba(148, 163, 184, 0.38)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            {/* 1. BONE / MUSCULOSKELETAL SYSTEM (Spine, Pelvis, Femurs) */}
            <g
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => setSelectedSystem('bone')}
              onMouseEnter={() => setHoveredSystem('bone')}
              onMouseLeave={() => setHoveredSystem(null)}
              opacity={activeSystemId === 'bone' ? 1 : 0.72}
              filter={activeSystemId === 'bone' ? 'url(#organ-glow)' : undefined}
            >
              {/* Spine */}
              <line
                x1="130"
                y1="84"
                x2="130"
                y2="232"
                stroke={bonePal.stroke}
                strokeWidth="4.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              {/* Pelvis */}
              <path
                d="M100 226 Q130 246 160 226 Q156 250 130 254 Q104 250 100 226 Z"
                fill={bonePal.fill}
                stroke={bonePal.stroke}
                strokeWidth="1.6"
              />
              {/* Femur & Tibia lines */}
              <line x1="110" y1="252" x2="108" y2="395" stroke={bonePal.stroke} strokeWidth="3.2" strokeLinecap="round" />
              <line x1="150" y1="252" x2="152" y2="395" stroke={bonePal.stroke} strokeWidth="3.2" strokeLinecap="round" />
              {/* Knee joints */}
              <circle cx="109" cy="328" r="4.5" fill={bonePal.fill} stroke={bonePal.stroke} strokeWidth="1.5" />
              <circle cx="151" cy="328" r="4.5" fill={bonePal.fill} stroke={bonePal.stroke} strokeWidth="1.5" />
            </g>

            {/* 2. IMMUNE & RADIATION SYSTEM (Lungs / Thoracic Shield) */}
            <g
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => setSelectedSystem('immuneRad')}
              onMouseEnter={() => setHoveredSystem('immuneRad')}
              onMouseLeave={() => setHoveredSystem(null)}
              opacity={activeSystemId === 'immuneRad' ? 1 : 0.75}
              filter={activeSystemId === 'immuneRad' ? 'url(#organ-glow)' : undefined}
            >
              {/* Left Lung */}
              <path
                d="M124 112 C110 112 96 128 96 154 C96 172 106 180 122 178 Z"
                fill={immPal.fill}
                stroke={immPal.stroke}
                strokeWidth="1.7"
              />
              {/* Right Lung */}
              <path
                d="M136 112 C150 112 164 128 164 154 C164 172 154 180 138 178 Z"
                fill={immPal.fill}
                stroke={immPal.stroke}
                strokeWidth="1.7"
              />
              {/* Trachea */}
              <line x1="130" y1="90" x2="130" y2="120" stroke={immPal.stroke} strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* 3. CARDIOVASCULAR SYSTEM (Heart & Pulse Ring) */}
            <g
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => setSelectedSystem('cardio')}
              onMouseEnter={() => setHoveredSystem('cardio')}
              onMouseLeave={() => setHoveredSystem(null)}
              opacity={activeSystemId === 'cardio' ? 1 : 0.85}
              filter={activeSystemId === 'cardio' ? 'url(#organ-glow)' : undefined}
            >
              {/* Pulse ring synced to resting HR */}
              <circle
                cx="136"
                cy="144"
                r="14"
                fill="none"
                stroke={cardioPal.stroke}
                strokeWidth="1.4"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="10;20;10"
                  dur={pulseDuration}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.75;0.1;0.75"
                  dur={pulseDuration}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Heart shape */}
              <path
                d="M136 156 C136 156 122 146 122 137 C122 132 126 129 130 129 C133 129 135 131 136 133 C137 131 139 129 142 129 C146 129 150 132 150 137 C150 146 136 156 136 156 Z"
                fill={cardioPal.fill}
                stroke={cardioPal.stroke}
                strokeWidth="2"
              />
            </g>

            {/* 4. COGNITIVE / NEURO SYSTEM (Brain) */}
            <g
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => setSelectedSystem('cognitive')}
              onMouseEnter={() => setHoveredSystem('cognitive')}
              onMouseLeave={() => setHoveredSystem(null)}
              opacity={activeSystemId === 'cognitive' ? 1 : 0.85}
              filter={activeSystemId === 'cognitive' ? 'url(#organ-glow)' : undefined}
            >
              <path
                d="M113 46 C113 33 122 28 130 28 C138 28 147 33 147 46 C147 54 141 60 130 60 C119 60 113 54 113 46 Z"
                fill={cogPal.fill}
                stroke={cogPal.stroke}
                strokeWidth="1.8"
              />
              <path
                d="M122 38 Q130 43 138 38 M120 48 Q130 53 140 48"
                fill="none"
                stroke={cogPal.stroke}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* System Selector & Live Telemetry Readout */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-7">
          {/* Quick System Pills */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SYSTEMS.map((sys) => {
              const Icon = sys.icon;
              const status = domainStatuses[sys.id] || 'NOMINAL';
              const pal = STATUS_PALETTE[status] || STATUS_PALETTE.NOMINAL;
              const isActive = activeSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'border-sky-400/50 bg-sky-500/12 text-white'
                      : 'border-white/[0.07] bg-[#1B202C] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${pal.dot}`} />
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{sys.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active System Detail Card */}
          <div className="card-surface-inner flex-1 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <activeMeta.icon className="h-4 w-4" style={{ color: activePalette.stroke }} />
                <div>
                  <h3 className="text-sm font-semibold">{activeMeta.label}</h3>
                  <p className="text-[11px] text-slate-400">{activeMeta.region}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${activePalette.badgeBg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${activePalette.dot}`} />
                {activePalette.label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5"
                >
                  <div className="text-[11px] text-slate-400">{m.label}</div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="font-mono-num text-sm font-semibold">{m.value}</span>
                    {m.delta && (
                      <span className="font-mono-num text-[11px] text-slate-400">
                        Δ {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Heart pulse rate synced to live resting HR ({Math.round(hrBpm)} bpm)</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Nominal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Elevated
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Critical
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
