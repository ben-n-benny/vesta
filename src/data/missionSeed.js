export const CREW_ROSTER = [
  {
    id: 'CDR-VANCE-01',
    shortName: 'Elena',
    name: 'Cmdr. Elena Vance',
    role: 'Mission Commander',
    vehicle: 'ARES-IV Deep Space Transit Habitat',
    missionDay: 142,
    baselines: {
      restingHr: 58,
      hrvRmssd: 64,
      systolicBp: 116,
      diastolicBp: 74,
      orthostaticIndex: 92,
      bmdPreFlight: 1.182,
      co2NominalMax: 2000,
      radiationDailyNominal: 1.48,
      pvtMeanMs: 238,
      circadianAlignment: 91,
      sleepHoursTarget: 7.5,
    },
  },
  {
    id: 'CMO-CHEN-02',
    shortName: 'Marcus',
    name: 'Dr. Marcus Chen',
    role: 'Crew Medical Officer',
    vehicle: 'ARES-IV Deep Space Transit Habitat',
    missionDay: 142,
    baselines: {
      restingHr: 62,
      hrvRmssd: 59,
      systolicBp: 120,
      diastolicBp: 76,
      orthostaticIndex: 90,
      bmdPreFlight: 1.214,
      co2NominalMax: 2000,
      radiationDailyNominal: 1.48,
      pvtMeanMs: 245,
      circadianAlignment: 89,
      sleepHoursTarget: 7.4,
    },
  },
  {
    id: 'FE-PATEL-03',
    shortName: 'Aisha',
    name: 'Spec. Aisha Patel',
    role: 'Flight Engineer',
    vehicle: 'ARES-IV Deep Space Transit Habitat',
    missionDay: 142,
    baselines: {
      restingHr: 54,
      hrvRmssd: 70,
      systolicBp: 112,
      diastolicBp: 70,
      orthostaticIndex: 94,
      bmdPreFlight: 1.148,
      co2NominalMax: 2000,
      radiationDailyNominal: 1.48,
      pvtMeanMs: 229,
      circadianAlignment: 93,
      sleepHoursTarget: 7.6,
    },
  },
];

export const CREW_PROFILE = CREW_ROSTER[0];

export const DEFAULT_THRESHOLDS = {
  co2WarningPpm: 2200,
  co2CriticalPpm: 3500,
  radCriticalMSvDay: 4.0,
  hrWarningBpm: 85,
  hrvDropPctWarning: 15,
  pvtSlowingWarningMs: 40,
};

export const SCENARIO_DEFINITIONS = [
  {
    id: 'NOMINAL',
    label: 'Nominal Baseline (Reset)',
    shortLabel: 'Nominal Baseline',
    code: 'SCN-00',
    severity: 'NOMINAL',
    description: 'Restores healthy Mars transit vitals, nominal cabin CO₂ (1,140 ppm), and aligned circadian rhythm.',
  },
  {
    id: 'SPE',
    label: 'Solar Particle Event (SPE)',
    shortLabel: 'Solar Particle Event',
    code: 'SCN-01',
    severity: 'CRITICAL',
    description: 'Spikes habitat radiation flux to 18.4 mSv/day across all crew & activates shelter protocol.',
  },
  {
    id: 'CO2_SCRUBBER',
    label: 'Cabin CO₂ Scrubber Degradation',
    shortLabel: 'CO₂ Scrubber Degradation',
    code: 'SCN-02',
    severity: 'WARNING',
    description: 'Elevates cabin CO₂ to 4,200 ppm, degrading HRV & reaction across crew (proves habitat cause).',
  },
  {
    id: 'CIRCADIAN_BONE',
    label: '72h Circadian Shift & Bone Load Deficit',
    shortLabel: 'Circadian + Bone Deficit',
    code: 'SCN-03',
    severity: 'WARNING',
    description: 'Simulates 72-hour sleep phase drift and resistive workout deficit for active crew member.',
  },
  {
    id: 'SANS_FLUID_SHIFT',
    label: 'SANS Fluid Shift & Isolation Drift',
    shortLabel: 'SANS + Isolation Drift',
    code: 'SCN-04',
    severity: 'WARNING',
    description: 'Simulates headward fluid shift, mild CO₂ rise, and isolation mood/sleep drift (NASA HRP SANS & Behavioral).',
  },
];

export function build14DayHistoryForCrew(crew) {
  const b = crew.baselines;
  const offsets = [-1, 0, 1, -1, 0, 2, 0, -1, 0, 1, 0, -1, 0, 0];
  return offsets.map((off, idx) => {
    const dayNum = 129 + idx;
    const bmd = Number((b.bmdPreFlight - 0.008 - idx * 0.0004).toFixed(3));
    return {
      day: `D${dayNum}`,
      hr: Math.round(b.restingHr + off),
      hrv: Math.round(b.hrvRmssd - off * 1.5),
      sbp: Math.round(b.systolicBp + off),
      dbp: Math.round(b.diastolicBp + off * 0.5),
      bmd,
      bmdDeltaPct: Number((((bmd - b.bmdPreFlight) / b.bmdPreFlight) * 100).toFixed(2)),
      skeletalLoad: Math.max(76, Math.min(96, 89 - off * 3 + (idx % 3))),
      radCum: Number((186.2 + idx * 1.48).toFixed(1)),
      radRate: Number((1.46 + (idx % 4) * 0.02).toFixed(2)),
      co2: 1140 + (idx % 5) * 35,
      voc: 112 + (idx % 4) * 5,
      pvt: Math.round(b.pvtMeanMs + off * 3),
      sleep: Number((b.sleepHoursTarget - off * 0.15).toFixed(1)),
      circadian: Math.min(97, Math.max(85, b.circadianAlignment - off)),
      ared: Math.min(100, Math.max(84, 94 - off * 3)),
    };
  });
}

export function build14DayHistory() {
  return build14DayHistoryForCrew(CREW_ROSTER[0]);
}

export function buildInitialLiveWaveforms(seedTelemetry) {
  const samples = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i -= 1) {
    const t = new Date(now - i * 2000);
    const label = t.toTimeString().slice(0, 8);
    const jitter = Math.sin(i * 0.7);
    samples.push({
      time: label,
      hr: Number((seedTelemetry.cardio.restingHr + jitter * 1.4).toFixed(1)),
      hrv: Number((seedTelemetry.cardio.hrvRmssd - jitter * 1.8).toFixed(1)),
      co2: Math.round(seedTelemetry.immuneRad.cabinCo2Ppm + jitter * 18),
      radRate: Number((seedTelemetry.immuneRad.radiationRateMSvDay + jitter * 0.04).toFixed(2)),
      pvt: Math.round(seedTelemetry.cognitive.pvtMeanMs + jitter * 4),
    });
  }
  return samples;
}

export function buildCrewMemberTelemetry(crew) {
  const b = crew.baselines;
  return {
    cardio: {
      restingHr: b.restingHr,
      hrvRmssd: b.hrvRmssd,
      systolicBp: b.systolicBp,
      diastolicBp: b.diastolicBp,
      orthostaticIndex: b.orthostaticIndex,
      aredCompletionPct: 94,
      fluidShiftIndex: 14,
    },
    bone: {
      currentBmd: Number((b.bmdPreFlight - 0.014).toFixed(3)),
      preFlightBmd: b.bmdPreFlight,
      skeletalLoadScore: 88,
      vitaminDIu: 1000,
      vitaminDTargetIu: 1000,
      calciumMg: 1150,
      calciumTargetMg: 1200,
    },
    immuneRad: {
      cumulativeRadMSv: 205.4,
      radiationRateMSvDay: 1.48,
      cabinCo2Ppm: 1150,
      cabinVocPpb: 115,
      cabinO2Pct: 20.9,
      cabinPressureKpa: 101.2,
      immuneSymptomScore: 0,
    },
    cognitive: {
      sleepHours: b.sleepHoursTarget,
      deepSleepHours: 1.6,
      remSleepHours: 1.8,
      lightSleepHours: Number((b.sleepHoursTarget - 3.4).toFixed(1)),
      circadianAlignmentPct: b.circadianAlignment,
      pvtMeanMs: b.pvtMeanMs,
      pvtLapses: 0,
      moodScore: 8.5,
    },
  };
}

export function createSeedState() {
  const crewStates = {};
  CREW_ROSTER.forEach((crew) => {
    const t = buildCrewMemberTelemetry(crew);
    crewStates[crew.id] = {
      telemetry: t,
      simulationTargets: t,
      history14d: build14DayHistoryForCrew(crew),
      liveWaveforms: buildInitialLiveWaveforms(t),
      checkedCountermeasures: {},
      lastPvtSession: {
        completedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        meanMs: crew.baselines.pvtMeanMs,
        fastestMs: crew.baselines.pvtMeanMs - 32,
        lapses: 0,
        falseStarts: 0,
        trials: 5,
      },
    };
  });

  const activeCrewId = CREW_ROSTER[0].id;
  const active = crewStates[activeCrewId];

  const initialCmoLogs = [
    {
      id: 'CMO-142-01',
      crewId: activeCrewId,
      crewName: CREW_ROSTER[0].name,
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      met: '142d 06:15:00',
      symptoms: ['None'],
      hydrationMl: 2100,
      nutritionKcal: 2650,
      vitaminDIu: 1000,
      calciumMg: 1150,
      moodScore: 9,
      aredCompletionPct: 94,
      notes: 'Post-ARED lower-body resistive block nominal.',
      commsMode: 'AUTONOMOUS',
    },
  ];

  const initialDtnBundles = [
    {
      bundleId: 'DTN-142-8841',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      source: 'ARES-IV/CMO-EDGE',
      destination: 'MCC-HOUSTON/FLIGHT-SURGEON',
      status: 'QUEUED_BLACKOUT',
      payloadBytes: 4128,
      summary: 'MET 142d Multi-Crew Biometrics Snapshot',
    },
  ];

  const initialAuditLogs = [
    {
      id: 'AUD-INIT-01',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      actor: 'System',
      action: 'EDGE_BOOT',
      detail: 'Initialized 14-day Mars transit baseline & 3-crew roster (ARES-IV)',
    },
  ];

  return {
    version: 4,
    activeCrewId,
    crewRoster: CREW_ROSTER.map((c) => ({ ...c, baselines: { ...c.baselines } })),
    thresholds: { ...DEFAULT_THRESHOLDS },
    activeScenario: 'NOMINAL',
    commsMode: 'AUTONOMOUS',
    metOffsetSeconds: 142 * 86400 + 10 * 3600 + 22 * 60 + 14,
    telemetry: active.telemetry,
    simulationTargets: active.simulationTargets,
    history14d: active.history14d,
    liveWaveforms: active.liveWaveforms,
    checkedCountermeasures: {},
    crewStates,
    enabledAddons: [],
    customMetrics: [],
    cmoLogs: initialCmoLogs,
    dtnBundles: initialDtnBundles,
    auditLogs: initialAuditLogs,
    lastPvtSession: active.lastPvtSession,
    updatedAt: new Date().toISOString(),
  };
}
