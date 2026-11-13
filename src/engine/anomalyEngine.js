import { CREW_PROFILE, DEFAULT_THRESHOLDS } from '../data/missionSeed.js';

/**
 * Deterministic, Explainable Edge-AI Clinical Correlation Engine.
 * Runs 100% locally in-browser with zero cloud dependencies so astronauts
 * receive transparent multi-domain differential triage even without an active Earth link.
 */
export function evaluateEdgeTelemetry(state, crewBaselines = null, crossCrewContext = null) {
  const BASE = crewBaselines || CREW_PROFILE.baselines;
  const T = { ...DEFAULT_THRESHOLDS, ...(state.thresholds || {}) };
  const { telemetry, checkedCountermeasures = {}, activeScenario } = state;
  const { cardio, bone, immuneRad, cognitive } = telemetry;

  const hrvDropPct = ((BASE.hrvRmssd - cardio.hrvRmssd) / BASE.hrvRmssd) * 100;
  const pvtSlowingMs = cognitive.pvtMeanMs - BASE.pvtMeanMs;
  const bmdChangePct = ((bone.currentBmd - bone.preFlightBmd) / bone.preFlightBmd) * 100;

  const insights = [];
  const countermeasures = [];

  const isHypercapniaCombo =
    hrvDropPct > T.hrvDropPctWarning &&
    pvtSlowingMs > T.pvtSlowingWarningMs &&
    immuneRad.cabinCo2Ppm > T.co2CriticalPpm;

  // 1. Differential Rule: Hypercapnia Fatigue vs Cardiac Pathology
  if (isHypercapniaCombo) {
    insights.push({
      id: 'HYPERCAPNIA_FATIGUE',
      severity: 'WARNING',
      confidence: 94,
      title: 'Mild Hypercapnia Fatigue (Not Cardiac)',
      differentialNote:
        'Blood pressure is stable; HRV drop and slower reaction speed match rising cabin CO₂ rather than cardiac strain.',
      clinicalSummary: `HRV fell ${hrvDropPct.toFixed(0)}% and reaction slowed +${pvtSlowingMs.toFixed(0)} ms while Cabin CO₂ reached ${Math.round(immuneRad.cabinCo2Ppm).toLocaleString()} ppm.`,
      signals: [
        { label: 'HRV Change', value: `-${hrvDropPct.toFixed(0)}%`, threshold: '> 15% drop', status: 'WARNING' },
        { label: 'Reaction Time', value: `+${pvtSlowingMs.toFixed(0)} ms`, threshold: '> +40 ms', status: 'WARNING' },
        { label: 'Cabin CO₂', value: `${Math.round(immuneRad.cabinCo2Ppm)} ppm`, threshold: '> 3,500 ppm', status: 'CRITICAL' },
      ],
      domains: ['Heart', 'Cabin Air', 'Focus'],
    });

    countermeasures.push(
      {
        id: 'CM-CO2-SCRUBBER',
        insightId: 'HYPERCAPNIA_FATIGUE',
        label: 'Set cabin CO₂ scrubber to high-flow',
        riskReduction: 16,
        eta: 'Now',
      },
      {
        id: 'CM-HYDRATE-500',
        insightId: 'HYPERCAPNIA_FATIGUE',
        label: 'Drink 500 mL electrolytes',
        riskReduction: 7,
        eta: '10 min',
      },
      {
        id: 'CM-DEFER-EVA',
        insightId: 'HYPERCAPNIA_FATIGUE',
        label: 'Pause EVA & precision tasks for 2 hrs',
        riskReduction: 9,
        eta: '2 hrs',
      },
      {
        id: 'CM-RETEST-PVT',
        insightId: 'HYPERCAPNIA_FATIGUE',
        label: 'Re-test reaction speed when CO₂ < 2,000 ppm',
        riskReduction: 4,
        eta: '45 min',
      }
    );
  }

  // 1b. Single-Domain Elevated Cabin CO₂
  if (!isHypercapniaCombo && immuneRad.cabinCo2Ppm > T.co2WarningPpm) {
    const isCriticalCo2 = immuneRad.cabinCo2Ppm > T.co2CriticalPpm;
    insights.push({
      id: 'ELEVATED_CO2_ONLY',
      severity: isCriticalCo2 ? 'CRITICAL' : 'WARNING',
      confidence: 92,
      title: `Elevated Cabin CO₂ (${Math.round(immuneRad.cabinCo2Ppm).toLocaleString()} ppm)`,
      differentialNote:
        `Cabin CO₂ exceeded the ${T.co2WarningPpm.toLocaleString()} ppm threshold. Boost scrubbing before cognitive fatigue develops.`,
      clinicalSummary: `Cabin CO₂ is ${Math.round(immuneRad.cabinCo2Ppm).toLocaleString()} ppm (threshold ${T.co2WarningPpm.toLocaleString()} ppm).`,
      signals: [
        { label: 'Cabin CO₂', value: `${Math.round(immuneRad.cabinCo2Ppm)} ppm`, threshold: `> ${T.co2WarningPpm} ppm`, status: isCriticalCo2 ? 'CRITICAL' : 'WARNING' },
        { label: 'HRV', value: `${Math.round(cardio.hrvRmssd)} ms`, threshold: '>= 55 ms', status: 'NOMINAL' },
        { label: 'Reaction', value: `${Math.round(cognitive.pvtMeanMs)} ms`, threshold: '< 275 ms', status: 'NOMINAL' },
      ],
      domains: ['Cabin Air'],
    });

    countermeasures.push(
      {
        id: 'CM-CO2-SCRUBBER',
        insightId: 'ELEVATED_CO2_ONLY',
        label: 'Set cabin CO₂ scrubber to high-flow',
        riskReduction: 14,
        eta: 'Now',
      },
      {
        id: 'CM-CO2-FANS',
        insightId: 'ELEVATED_CO2_ONLY',
        label: 'Check inter-module ventilation fans',
        riskReduction: 6,
        eta: '5 min',
      },
      {
        id: 'CM-RETEST-PVT',
        insightId: 'ELEVATED_CO2_ONLY',
        label: 'Re-test reaction speed in 30 min',
        riskReduction: 4,
        eta: '30 min',
      }
    );
  }

  // 1c. Cardiovascular Strain (Elevated HR or Low HRV)
  if (!isHypercapniaCombo && (cardio.restingHr > T.hrWarningBpm || hrvDropPct > T.hrvDropPctWarning)) {
    const isHighHr = cardio.restingHr > T.hrWarningBpm + 20 || hrvDropPct > T.hrvDropPctWarning + 13;
    insights.push({
      id: 'CARDIO_AUTONOMIC_STRAIN',
      severity: isHighHr ? 'CRITICAL' : 'WARNING',
      confidence: 90,
      title: cardio.restingHr > T.hrWarningBpm ? 'Elevated Heart Rate & Autonomic Strain' : 'Low HRV Recovery Alert',
      differentialNote:
        'Autonomic stress detected without elevated cabin CO₂; likely dehydration, exertion, or acute stress.',
      clinicalSummary: `Resting HR ${Math.round(cardio.restingHr)} bpm and HRV ${Math.round(cardio.hrvRmssd)} ms.`,
      signals: [
        { label: 'Heart Rate', value: `${Math.round(cardio.restingHr)} bpm`, threshold: `< ${T.hrWarningBpm} bpm`, status: cardio.restingHr > T.hrWarningBpm ? 'WARNING' : 'NOMINAL' },
        { label: 'HRV', value: `${Math.round(cardio.hrvRmssd)} ms`, threshold: `-${T.hrvDropPctWarning}% max`, status: hrvDropPct > T.hrvDropPctWarning ? 'WARNING' : 'NOMINAL' },
        { label: 'Blood Pressure', value: `${Math.round(cardio.systolicBp)}/${Math.round(cardio.diastolicBp)}`, threshold: 'Normal', status: 'NOMINAL' },
      ],
      domains: ['Heart'],
    });

    countermeasures.push(
      {
        id: 'CM-HYDRATE-500',
        insightId: 'CARDIO_AUTONOMIC_STRAIN',
        label: 'Rest & drink 500 mL electrolytes',
        riskReduction: 10,
        eta: '10 min',
      },
      {
        id: 'CM-PACED-BREATH',
        insightId: 'CARDIO_AUTONOMIC_STRAIN',
        label: 'Do 5-min paced breathing (6 breaths/min)',
        riskReduction: 6,
        eta: '5 min',
      },
      {
        id: 'CM-PAUSE-STRAIN',
        insightId: 'CARDIO_AUTONOMIC_STRAIN',
        label: 'Pause strenuous ARED or EVA tasks',
        riskReduction: 8,
        eta: '1 hr',
      }
    );
  }

  // 1d. Slow Reaction Time Alone
  if (!isHypercapniaCombo && pvtSlowingMs > T.pvtSlowingWarningMs) {
    insights.push({
      id: 'COGNITIVE_PVT_SLOWING',
      severity: pvtSlowingMs > T.pvtSlowingWarningMs + 35 ? 'CRITICAL' : 'WARNING',
      confidence: 89,
      title: `Slower Reaction Time (+${pvtSlowingMs.toFixed(0)} ms)`,
      differentialNote:
        'Psychomotor vigilance is slower than personal baseline; defer high-precision control until alert.',
      clinicalSummary: `PVT reaction time is ${Math.round(cognitive.pvtMeanMs)} ms vs ${BASE.pvtMeanMs} ms baseline.`,
      signals: [
        { label: 'Reaction Time', value: `${Math.round(cognitive.pvtMeanMs)} ms`, threshold: `< ${BASE.pvtMeanMs + T.pvtSlowingWarningMs} ms`, status: 'WARNING' },
        { label: 'Circadian', value: `${cognitive.circadianAlignmentPct}%`, threshold: '>= 75%', status: cognitive.circadianAlignmentPct < 75 ? 'WARNING' : 'NOMINAL' },
        { label: 'Cabin CO₂', value: `${Math.round(immuneRad.cabinCo2Ppm)} ppm`, threshold: `< ${T.co2WarningPpm} ppm`, status: immuneRad.cabinCo2Ppm > T.co2WarningPpm ? 'WARNING' : 'NOMINAL' },
      ],
      domains: ['Focus'],
    });

    countermeasures.push(
      {
        id: 'CM-REST-BREAK',
        insightId: 'COGNITIVE_PVT_SLOWING',
        label: 'Take a 20-min recovery rest break',
        riskReduction: 9,
        eta: '20 min',
      },
      {
        id: 'CM-DEFER-EVA',
        insightId: 'COGNITIVE_PVT_SLOWING',
        label: 'Defer precision docking or robotics tasks',
        riskReduction: 8,
        eta: '1 hr',
      },
      {
        id: 'CM-RETEST-PVT',
        insightId: 'COGNITIVE_PVT_SLOWING',
        label: 'Re-run 5-trial PVT alertness check',
        riskReduction: 4,
        eta: '30 min',
      }
    );
  }

  // 2. Solar Particle Event (SPE) Acute Radiation Protocol
  if (immuneRad.radiationRateMSvDay >= T.radCriticalMSvDay) {
    insights.push({
      id: 'SPE_RADIATION_SPIKE',
      severity: 'CRITICAL',
      confidence: 98,
      title: 'Solar Particle Event — High Radiation',
      differentialNote:
        'Proton flux jumped sharply above transit baseline. Local shelter protocol active without waiting for Earth.',
      clinicalSummary: `Dosimeter rate spiked to ${immuneRad.radiationRateMSvDay.toFixed(2)} mSv/day (total ${immuneRad.cumulativeRadMSv.toFixed(1)} mSv).`,
      signals: [
        { label: 'Dose Rate', value: `${immuneRad.radiationRateMSvDay.toFixed(1)} mSv/d`, threshold: `>= ${T.radCriticalMSvDay} mSv/d`, status: 'CRITICAL' },
        { label: 'Total Dose', value: `${immuneRad.cumulativeRadMSv.toFixed(1)} mSv`, threshold: 'ALARA', status: 'WARNING' },
        { label: 'Cabin VOCs', value: `${Math.round(immuneRad.cabinVocPpb)} ppb`, threshold: 'Normal', status: 'NOMINAL' },
      ],
      domains: ['Radiation'],
    });

    countermeasures.push(
      {
        id: 'CM-SPE-SHELTER',
        insightId: 'SPE_RADIATION_SPIKE',
        label: 'Move to shielded sleep quarters',
        riskReduction: 22,
        eta: 'Now',
      },
      {
        id: 'CM-SPE-ANTIOXIDANT',
        insightId: 'SPE_RADIATION_SPIKE',
        label: 'Take antioxidant & immune pack',
        riskReduction: 8,
        eta: '15 min',
      },
      {
        id: 'CM-SPE-DOSIMETER',
        insightId: 'SPE_RADIATION_SPIKE',
        label: 'Verify personal dosimeter reading',
        riskReduction: 5,
        eta: '20 min',
      }
    );
  }

  // 3. Circadian Phase Shift & Musculoskeletal Unloading Deficit
  if (cognitive.circadianAlignmentPct < 75 || bone.skeletalLoadScore < 70 || cardio.aredCompletionPct < 70) {
    insights.push({
      id: 'CIRCADIAN_BONE_DEFICIT',
      severity: 'WARNING',
      confidence: 91,
      title: 'Circadian Shift & Low Exercise Load',
      differentialNote:
        'Cabin air is normal; lower HRV and slower reaction reflect sleep phase drift and missed resistive workouts.',
      clinicalSummary: `Circadian alignment is ${cognitive.circadianAlignmentPct}% (${cognitive.sleepHours.toFixed(1)}h sleep) and ARED completion is ${cardio.aredCompletionPct}%.`,
      signals: [
        { label: 'Circadian', value: `${cognitive.circadianAlignmentPct}%`, threshold: '< 75%', status: cognitive.circadianAlignmentPct < 75 ? 'WARNING' : 'NOMINAL' },
        { label: 'Bone Load', value: `${bone.skeletalLoadScore}/100`, threshold: '< 70', status: bone.skeletalLoadScore < 70 ? 'WARNING' : 'NOMINAL' },
        { label: 'ARED Goal', value: `${cardio.aredCompletionPct}%`, threshold: '< 70%', status: cardio.aredCompletionPct < 70 ? 'WARNING' : 'NOMINAL' },
      ],
      domains: ['Sleep', 'Exercise'],
    });

    countermeasures.push(
      {
        id: 'CM-LIGHT-THERAPY',
        insightId: 'CIRCADIAN_BONE_DEFICIT',
        label: 'Run 45-min bright wake light session',
        riskReduction: 12,
        eta: 'Next wake',
      },
      {
        id: 'CM-ARED-LOWER',
        insightId: 'CIRCADIAN_BONE_DEFICIT',
        label: 'Complete lower-body ARED squats & deadlifts',
        riskReduction: 14,
        eta: '45 min',
      },
      {
        id: 'CM-VITD-CALCIUM',
        insightId: 'CIRCADIAN_BONE_DEFICIT',
        label: 'Log Vitamin D3 (1,000 IU) & Calcium',
        riskReduction: 5,
        eta: 'Next meal',
      }
    );
  }

  // 4. Immune / Viral Reactivation or Self-Reported Symptom Watch
  if (immuneRad.immuneSymptomScore >= 2 || immuneRad.cabinVocPpb > 260) {
    insights.push({
      id: 'IMMUNE_SYMPTOM_WATCH',
      severity: 'WARNING',
      confidence: 86,
      title: 'Mild Immune / Cabin Air Stress',
      differentialNote:
        'Recent self-reported symptoms or elevated VOCs warrant a quick immune strip and filter check.',
      clinicalSummary: `${immuneRad.immuneSymptomScore} symptom(s) logged with cabin VOCs at ${Math.round(immuneRad.cabinVocPpb)} ppb.`,
      signals: [
        { label: 'Symptoms', value: `${immuneRad.immuneSymptomScore}/5`, threshold: '>= 2', status: immuneRad.immuneSymptomScore >= 2 ? 'WARNING' : 'NOMINAL' },
        { label: 'Cabin VOCs', value: `${Math.round(immuneRad.cabinVocPpb)} ppb`, threshold: '> 260 ppb', status: immuneRad.cabinVocPpb > 260 ? 'WARNING' : 'NOMINAL' },
      ],
      domains: ['Immune'],
    });

    countermeasures.push({
      id: 'CM-IMMUNE-CHECK',
      insightId: 'IMMUNE_SYMPTOM_WATCH',
      label: 'Run salivary immune strip & cycle air filter',
      riskReduction: 8,
      eta: '15 min',
    });
  }

  // 5. Fallback Nominal Baseline Insight
  if (insights.length === 0) {
    insights.push({
      id: 'NOMINAL_ALL_DOMAINS',
      severity: 'NOMINAL',
      confidence: 97,
      title: 'All Vitals Nominal',
      differentialNote:
        'Heart rate, cabin atmosphere, radiation, and reaction speed are all within Mars transit baseline.',
      clinicalSummary: `HRV ${cardio.hrvRmssd.toFixed(0)} ms · Cabin CO₂ ${Math.round(immuneRad.cabinCo2Ppm)} ppm · Reaction ${cognitive.pvtMeanMs.toFixed(0)} ms.`,
      signals: [
        { label: 'HRV', value: `${cardio.hrvRmssd.toFixed(0)} ms`, threshold: '>= 55 ms', status: 'NOMINAL' },
        { label: 'Cabin CO₂', value: `${Math.round(immuneRad.cabinCo2Ppm)} ppm`, threshold: '< 2,000 ppm', status: 'NOMINAL' },
        { label: 'Reaction', value: `${cognitive.pvtMeanMs.toFixed(0)} ms`, threshold: '< 275 ms', status: 'NOMINAL' },
      ],
      domains: ['All Clear'],
    });

    countermeasures.push(
      {
        id: 'CM-NOMINAL-ARED',
        insightId: 'NOMINAL_ALL_DOMAINS',
        label: 'Complete daily ARED workout & 2.2 L water',
        riskReduction: 2,
        eta: 'Today',
      },
      {
        id: 'CM-NOMINAL-PVT',
        insightId: 'NOMINAL_ALL_DOMAINS',
        label: 'Log Vitamin D3 & evening reaction check',
        riskReduction: 1,
        eta: 'Evening',
      }
    );
  }

  // Deduplicate countermeasures cleanly if multiple rules share an action id
  const uniqueCountermeasures = [];
  const seenCmIds = new Set();
  for (const cm of countermeasures) {
    if (!seenCmIds.has(cm.id)) {
      seenCmIds.add(cm.id);
      uniqueCountermeasures.push(cm);
    }
  }

  // Compute domain statuses
  const cardioStatus =
    cardio.orthostaticIndex < 75 || hrvDropPct > T.hrvDropPctWarning + 10 || cardio.restingHr > T.hrWarningBpm + 20
      ? 'CRITICAL'
      : hrvDropPct > T.hrvDropPctWarning || cardio.restingHr > T.hrWarningBpm || cardio.aredCompletionPct < 70
      ? 'WARNING'
      : 'NOMINAL';

  const boneStatus =
    bone.skeletalLoadScore < 55 || bmdChangePct < -3.0
      ? 'CRITICAL'
      : bone.skeletalLoadScore < 75 || bone.vitaminDIu < 800 || bone.calciumMg < 900
      ? 'WARNING'
      : 'NOMINAL';

  const immuneStatus =
    immuneRad.radiationRateMSvDay >= T.radCriticalMSvDay || immuneRad.cabinCo2Ppm > T.co2CriticalPpm
      ? 'CRITICAL'
      : immuneRad.cabinCo2Ppm > T.co2WarningPpm || immuneRad.immuneSymptomScore >= 2
      ? 'WARNING'
      : 'NOMINAL';

  const cognitiveStatus =
    pvtSlowingMs > T.pvtSlowingWarningMs + 30 || cognitive.circadianAlignmentPct < 60
      ? 'CRITICAL'
      : pvtSlowingMs > T.pvtSlowingWarningMs || cognitive.circadianAlignmentPct < 78 || cognitive.sleepHours < 6.2
      ? 'WARNING'
      : 'NOMINAL';

  // Compute accurate domain sub-scores (0 - 100 each)
  const clamp0100 = (n) => Math.max(0, Math.min(100, n));

  // 1. Heart & Autonomic sub-score
  let heartScore = 100;
  if (cardio.restingHr > 72) heartScore -= (cardio.restingHr - 72) * 1.35;
  if (cardio.restingHr < 45) heartScore -= (45 - cardio.restingHr) * 1.5;
  if (cardio.hrvRmssd < 60) heartScore -= (60 - cardio.hrvRmssd) * 1.5;
  if (cardio.systolicBp > 130) heartScore -= (cardio.systolicBp - 130) * 1.0;
  if (cardio.orthostaticIndex < 88) heartScore -= (88 - cardio.orthostaticIndex) * 1.1;
  heartScore = clamp0100(heartScore);

  // 2. Cabin Air & Radiation sub-score
  let envScore = 100;
  if (immuneRad.cabinCo2Ppm > 1500 && immuneRad.cabinCo2Ppm <= 2200) {
    envScore -= (immuneRad.cabinCo2Ppm - 1500) / 140;
  } else if (immuneRad.cabinCo2Ppm > 2200) {
    envScore -= 5 + (immuneRad.cabinCo2Ppm - 2200) / 35;
  }
  if (immuneRad.radiationRateMSvDay > 2.0) {
    envScore -= (immuneRad.radiationRateMSvDay - 2.0) * 4.2;
  }
  if (immuneRad.cabinVocPpb > 200) {
    envScore -= (immuneRad.cabinVocPpb - 200) / 10;
  }
  envScore = clamp0100(envScore);

  // 3. Sleep & Cognitive sub-score
  let cogScore = 100;
  if (cognitive.pvtMeanMs > 250) cogScore -= (cognitive.pvtMeanMs - 250) * 0.48;
  if (cognitive.circadianAlignmentPct < 90) cogScore -= (90 - cognitive.circadianAlignmentPct) * 1.3;
  if (cognitive.sleepHours < 7.0) cogScore -= (7.0 - cognitive.sleepHours) * 12;
  cogScore = clamp0100(cogScore);

  // 4. Activity, Bone & Symptoms sub-score
  let actScore = 100;
  if (cardio.aredCompletionPct < 95) actScore -= (95 - cardio.aredCompletionPct) * 0.55;
  if (bone.skeletalLoadScore < 85) actScore -= (85 - bone.skeletalLoadScore) * 0.35;
  actScore -= immuneRad.immuneSymptomScore * 9;
  actScore = clamp0100(actScore);

  // Weighted composite with bottleneck protection so one critical system drags Readiness down accurately
  const weightedAvg = (heartScore + envScore + cogScore + actScore) / 4;
  const minDomainScore = Math.min(heartScore, envScore, cogScore, actScore);
  const rawComposite =
    minDomainScore < 72 ? weightedAvg * 0.55 + minDomainScore * 0.45 : weightedAvg;

  const baseResilienceScore = Math.max(10, Math.min(99, Math.round(rawComposite)));

  // Countermeasure completion provides realistic partial mitigation (up to 45% of current deficit, capped at +22)
  const rawCompletedReduction = uniqueCountermeasures.reduce(
    (acc, cm) => (checkedCountermeasures[cm.id] ? acc + cm.riskReduction : acc),
    0
  );
  const totalPossibleReduction = uniqueCountermeasures.reduce((acc, cm) => acc + cm.riskReduction, 0);
  const maxMitigation = Math.min(22, Math.round((100 - baseResilienceScore) * 0.45));

  const effectiveGain =
    totalPossibleReduction > 0
      ? Math.round((rawCompletedReduction / totalPossibleReduction) * maxMitigation)
      : 0;

  const currentEffectiveScore = Math.min(99, baseResilienceScore + effectiveGain);
  const projectedScore = Math.min(99, baseResilienceScore + maxMitigation);

  const overallStatus = insights.some((i) => i.severity === 'CRITICAL')
    ? 'CRITICAL'
    : insights.some((i) => i.severity === 'WARNING')
    ? 'WARNING'
    : 'NOMINAL';

  // Operational Go / No-Go Task Clearances
  const evaHold =
    immuneRad.radiationRateMSvDay >= T.radCriticalMSvDay ||
    immuneRad.cabinCo2Ppm > T.co2CriticalPpm - 500 ||
    pvtSlowingMs > T.pvtSlowingWarningMs ||
    cardio.restingHr > T.hrWarningBpm + 10 ||
    currentEffectiveScore < 68;
  const evaCaution = !evaHold && (currentEffectiveScore < 82 || cardio.aredCompletionPct < 70 || cognitive.circadianAlignmentPct < 78);

  const roboticsHold = pvtSlowingMs > T.pvtSlowingWarningMs || immuneRad.cabinCo2Ppm > T.co2CriticalPpm || currentEffectiveScore < 62;
  const roboticsCaution = !roboticsHold && (pvtSlowingMs > Math.round(T.pvtSlowingWarningMs * 0.65) || cognitive.circadianAlignmentPct < 75 || currentEffectiveScore < 80);

  const dockingHold = pvtSlowingMs > T.pvtSlowingWarningMs - 5 || immuneRad.cabinCo2Ppm > T.co2CriticalPpm || hrvDropPct > T.hrvDropPctWarning + 7 || cardio.restingHr > T.hrWarningBpm + 15;
  const dockingCaution = !dockingHold && (currentEffectiveScore < 78 || cognitive.circadianAlignmentPct < 75);

  const taskClearances = {
    eva: {
      label: 'EVA',
      status: evaHold ? 'HOLD' : evaCaution ? 'CAUTION' : 'CLEARED',
    },
    robotics: {
      label: 'Robotics',
      status: roboticsHold ? 'HOLD' : roboticsCaution ? 'CAUTION' : 'CLEARED',
    },
    docking: {
      label: 'Docking',
      status: dockingHold ? 'HOLD' : dockingCaution ? 'CAUTION' : 'CLEARED',
    },
  };

  let crewCorrelation = null;
  if (crossCrewContext && overallStatus !== 'NOMINAL') {
    const { affectedCount, totalCrew } = crossCrewContext;
    crewCorrelation =
      affectedCount >= 2
        ? `${affectedCount}/${totalCrew} crew affected — shared habitat factor`
        : `1/${totalCrew} crew affected — individual profile`;
  }

  return {
    overallStatus,
    activeScenario,
    baseResilienceScore,
    currentEffectiveScore,
    projectedScore,
    completedCount: uniqueCountermeasures.filter((c) => Boolean(checkedCountermeasures[c.id])).length,
    totalCountermeasures: uniqueCountermeasures.length,
    taskClearances,
    crewCorrelation,
    domainStatuses: {
      cardio: cardioStatus,
      bone: boneStatus,
      immuneRad: immuneStatus,
      cognitive: cognitiveStatus,
    },
    deltas: {
      hrvDropPct: Number(hrvDropPct.toFixed(1)),
      pvtSlowingMs: Number(pvtSlowingMs.toFixed(0)),
      bmdChangePct: Number(bmdChangePct.toFixed(2)),
    },
    insights,
    countermeasures: uniqueCountermeasures,
  };
}
