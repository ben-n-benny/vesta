import React, { useEffect, useMemo, useRef, useState } from 'react';
import TelemetryHeader from './components/TelemetryHeader.jsx';
import ExplainableTriagePanel from './components/ExplainableTriagePanel.jsx';
import HumanBodyModel from './components/HumanBodyModel.jsx';
import RiskDomainCards from './components/RiskDomainCards.jsx';
import ScenarioSimulator from './components/ScenarioSimulator.jsx';
import AstronautLogModal from './components/AstronautLogModal.jsx';
import AddMetricModal from './components/AddMetricModal.jsx';
import AdminManagementModal from './components/AdminManagementModal.jsx';
import {
  CREW_ROSTER,
  DEFAULT_THRESHOLDS,
  build14DayHistoryForCrew,
  buildCrewMemberTelemetry,
  buildInitialLiveWaveforms,
  createSeedState,
} from './data/missionSeed.js';
import { evaluateEdgeTelemetry } from './engine/anomalyEngine.js';
import {
  appendAuditApi,
  exportCmoLogsCsv,
  exportDtnBundleJson,
  fetchBackendHealth,
  flushDtnQueueApi,
  loadMissionState,
  resetMissionState,
  saveMissionState,
  saveThresholdsApi,
} from './storage/localStore.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function formatMetShort(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const rem = totalSeconds % 86400;
  const hrs = Math.floor(rem / 3600);
  const mins = Math.floor((rem % 3600) / 60);
  const secs = Math.floor(rem % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function buildScenarioTargetsForCrew(crew, scenarioId) {
  const base = buildCrewMemberTelemetry(crew);
  if (scenarioId === 'SPE') {
    return {
      ...base,
      cardio: { ...base.cardio, restingHr: crew.baselines.restingHr + 8, hrvRmssd: crew.baselines.hrvRmssd - 9, aredCompletionPct: 80 },
      immuneRad: { ...base.immuneRad, radiationRateMSvDay: 18.4, cabinCo2Ppm: 1320, cabinVocPpb: 140, immuneSymptomScore: 1 },
      cognitive: { ...base.cognitive, sleepHours: 6.8, circadianAlignmentPct: 84, pvtMeanMs: crew.baselines.pvtMeanMs + 20, moodScore: 7.0 },
    };
  }
  if (scenarioId === 'CO2_SCRUBBER') {
    return {
      ...base,
      cardio: { ...base.cardio, restingHr: crew.baselines.restingHr + 9, hrvRmssd: Math.round(crew.baselines.hrvRmssd * 0.74), aredCompletionPct: 88 },
      immuneRad: { ...base.immuneRad, radiationRateMSvDay: 1.51, cabinCo2Ppm: 4200, cabinVocPpb: 235, immuneSymptomScore: 1 },
      cognitive: { ...base.cognitive, sleepHours: 6.4, circadianAlignmentPct: 82, pvtMeanMs: crew.baselines.pvtMeanMs + 68, moodScore: 6.0 },
    };
  }
  if (scenarioId === 'CIRCADIAN_BONE') {
    return {
      ...base,
      cardio: { ...base.cardio, restingHr: crew.baselines.restingHr + 5, hrvRmssd: Math.round(crew.baselines.hrvRmssd * 0.81), orthostaticIndex: 78, aredCompletionPct: 48 },
      bone: { ...base.bone, skeletalLoadScore: 56, vitaminDIu: 600, calciumMg: 800 },
      immuneRad: { ...base.immuneRad, cabinCo2Ppm: 1410, cabinVocPpb: 135, immuneSymptomScore: 1 },
      cognitive: { ...base.cognitive, sleepHours: 5.2, deepSleepHours: 0.8, remSleepHours: 1.0, lightSleepHours: 3.4, circadianAlignmentPct: 58, pvtMeanMs: crew.baselines.pvtMeanMs + 50, moodScore: 5.5 },
    };
  }
  return base;
}

function hydrateStateSafely(rawState) {
  const seed = createSeedState();
  if (!rawState || !rawState.crewStates) {
    return seed;
  }
  const roster = rawState.crewRoster && rawState.crewRoster.length ? rawState.crewRoster : seed.crewRoster;
  const activeCrewId = rawState.crewStates[rawState.activeCrewId]
    ? rawState.activeCrewId
    : roster[0].id;
  const activeEntry = rawState.crewStates[activeCrewId] || seed.crewStates[seed.activeCrewId];

  return {
    ...seed,
    ...rawState,
    crewRoster: roster,
    thresholds: { ...DEFAULT_THRESHOLDS, ...(rawState.thresholds || {}) },
    activeCrewId,
    telemetry: activeEntry.telemetry,
    simulationTargets: activeEntry.simulationTargets,
    history14d: activeEntry.history14d,
    liveWaveforms: activeEntry.liveWaveforms,
    checkedCountermeasures: activeEntry.checkedCountermeasures || {},
    lastPvtSession: activeEntry.lastPvtSession,
    enabledAddons: rawState.enabledAddons || [],
    customMetrics: rawState.customMetrics || [],
    auditLogs: rawState.auditLogs || seed.auditLogs,
  };
}

function makeAuditEntry(action, detail, actor = 'CMO / Admin') {
  return {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    detail,
  };
}

export default function App() {
  const [missionState, setMissionState] = useState(() => createSeedState());
  const [metSeconds, setMetSeconds] = useState(() => createSeedState().metOffsetSeconds);
  const [backendHealth, setBackendHealth] = useState({ online: false });
  const [isSelfCheckOpen, setIsSelfCheckOpen] = useState(false);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('vesta_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('vesta_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const missionRef = useRef(missionState);
  missionRef.current = missionState;

  useEffect(() => {
    let active = true;
    loadMissionState().then(({ state }) => {
      if (!active) return;
      const hydrated = hydrateStateSafely(state);
      setMissionState(hydrated);
      setMetSeconds(hydrated.metOffsetSeconds);
    });
    fetchBackendHealth().then((health) => {
      if (active) setBackendHealth(health);
    });
    return () => {
      active = false;
    };
  }, []);

  // Periodic backend health heartbeat (every 10s)
  useEffect(() => {
    const id = setInterval(() => {
      fetchBackendHealth().then((health) => setBackendHealth(health));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMetSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Live 2-second telemetry ticker across all crew members in crewRoster
  useEffect(() => {
    const id = setInterval(() => {
      setMissionState((prev) => {
        const roster = prev.crewRoster || CREW_ROSTER;
        const activeCrew = roster.find((c) => c.id === prev.activeCrewId) || roster[0];
        const activeEntry = prev.crewStates[activeCrew.id];
        const envTarget = activeEntry?.simulationTargets?.immuneRad || prev.telemetry.immuneRad;

        const nextCo2 = Math.round(
          clamp(envTarget.cabinCo2Ppm + (Math.random() - 0.5) * 40, 500, 6000)
        );
        const nextRadRate = Number(
          clamp(envTarget.radiationRateMSvDay + (Math.random() - 0.5) * 0.12, 0.5, 30).toFixed(2)
        );
        const radDelta = nextRadRate / 43200;
        const nowLabel = new Date().toTimeString().slice(0, 8);

        const nextCrewStates = {};
        roster.forEach((crew) => {
          const entry = prev.crewStates[crew.id];
          if (!entry) return;
          const target = entry.simulationTargets || entry.telemetry;
          const { cardio, immuneRad, cognitive } = entry.telemetry;

          const nextHr = Number(
            clamp(target.cardio.restingHr + (Math.random() - 0.5) * 2.4, 40, 140).toFixed(1)
          );
          const nextHrv = Number(
            clamp(target.cardio.hrvRmssd + (Math.random() - 0.5) * 3.0, 15, 110).toFixed(1)
          );
          const nextCumRad = Number((immuneRad.cumulativeRadMSv + radDelta).toFixed(2));
          const nextPvt = Math.round(
            clamp(cognitive.pvtMeanMs * 0.6 + target.cognitive.pvtMeanMs * 0.4 + (Math.random() - 0.5) * 4, 150, 500)
          );

          const nextSample = {
            time: nowLabel,
            hr: nextHr,
            hrv: nextHrv,
            co2: nextCo2,
            radRate: nextRadRate,
            pvt: nextPvt,
          };

          nextCrewStates[crew.id] = {
            ...entry,
            telemetry: {
              ...entry.telemetry,
              cardio: { ...cardio, restingHr: nextHr, hrvRmssd: nextHrv },
              immuneRad: {
                ...immuneRad,
                cabinCo2Ppm: nextCo2,
                radiationRateMSvDay: nextRadRate,
                cumulativeRadMSv: nextCumRad,
              },
              cognitive: { ...cognitive, pvtMeanMs: nextPvt },
            },
            liveWaveforms: [...entry.liveWaveforms.slice(-23), nextSample],
          };
        });

        const updatedActive = nextCrewStates[prev.activeCrewId];
        if (!updatedActive) return prev;
        return {
          ...prev,
          crewStates: nextCrewStates,
          telemetry: updatedActive.telemetry,
          liveWaveforms: updatedActive.liveWaveforms,
        };
      });
    }, 2000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      saveMissionState({
        ...missionRef.current,
        metOffsetSeconds: metSeconds,
      });
    }, 6000);
    return () => clearInterval(id);
  }, [metSeconds]);

  const { activeTriage, crewSummaries, activeCrew } = useMemo(() => {
    const roster = missionState.crewRoster || CREW_ROSTER;
    const perCrewRaw = {};
    let affectedCount = 0;

    roster.forEach((crew) => {
      const entry = missionState.crewStates[crew.id];
      if (!entry) return;
      const evalRes = evaluateEdgeTelemetry(
        {
          telemetry: entry.telemetry,
          thresholds: missionState.thresholds,
          checkedCountermeasures: entry.checkedCountermeasures || {},
          activeScenario: missionState.activeScenario,
        },
        crew.baselines
      );
      perCrewRaw[crew.id] = {
        score: evalRes.currentEffectiveScore,
        status: evalRes.overallStatus,
      };
      if (evalRes.overallStatus !== 'NOMINAL') {
        affectedCount += 1;
      }
    });

    const currentCrew = roster.find((c) => c.id === missionState.activeCrewId) || roster[0];
    const triageWithCrossCrew = evaluateEdgeTelemetry(
      missionState,
      currentCrew.baselines,
      { affectedCount, totalCrew: roster.length }
    );

    return {
      activeTriage: triageWithCrossCrew,
      crewSummaries: perCrewRaw,
      activeCrew: currentCrew,
    };
  }, [missionState]);

  const handleSelectCrew = (crewId) => {
    setMissionState((prev) => {
      const entry = prev.crewStates[crewId];
      if (!entry) return prev;
      const next = {
        ...prev,
        activeCrewId: crewId,
        telemetry: entry.telemetry,
        simulationTargets: entry.simulationTargets,
        history14d: entry.history14d,
        liveWaveforms: entry.liveWaveforms,
        checkedCountermeasures: entry.checkedCountermeasures || {},
        lastPvtSession: entry.lastPvtSession,
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleSelectScenario = (scenarioId) => {
    setMissionState((prev) => {
      const roster = prev.crewRoster || CREW_ROSTER;
      const nowLabel = new Date().toTimeString().slice(0, 8);
      const nextCrewStates = { ...prev.crewStates };
      const isHabitatWide = scenarioId === 'NOMINAL' || scenarioId === 'SPE' || scenarioId === 'CO2_SCRUBBER';

      roster.forEach((crew) => {
        const shouldUpdateCrew = isHabitatWide || crew.id === prev.activeCrewId;
        if (!shouldUpdateCrew) return;

        const target = buildScenarioTargetsForCrew(crew, scenarioId);
        const prevEntry = prev.crewStates[crew.id];
        const nextSample = {
          time: nowLabel,
          hr: target.cardio.restingHr,
          hrv: target.cardio.hrvRmssd,
          co2: target.immuneRad.cabinCo2Ppm,
          radRate: target.immuneRad.radiationRateMSvDay,
          pvt: target.cognitive.pvtMeanMs,
        };

        nextCrewStates[crew.id] = {
          ...prevEntry,
          telemetry: target,
          simulationTargets: target,
          checkedCountermeasures: {},
          liveWaveforms: [...prevEntry.liveWaveforms.slice(-23), nextSample],
        };
      });

      const activeEntry = nextCrewStates[prev.activeCrewId];
      const auditEntry = makeAuditEntry('SCENARIO_INJECTED', `Activated scenario ${scenarioId}`, 'Simulator');
      const next = {
        ...prev,
        activeScenario: scenarioId,
        crewStates: nextCrewStates,
        telemetry: activeEntry.telemetry,
        simulationTargets: activeEntry.simulationTargets,
        checkedCountermeasures: activeEntry.checkedCountermeasures,
        liveWaveforms: activeEntry.liveWaveforms,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleUpdateSimulationValue = (domain, field, rawValue) => {
    const numValue = Number(rawValue);
    if (Number.isNaN(numValue)) return;

    const isSharedHabitatField =
      domain === 'immuneRad' && (field === 'cabinCo2Ppm' || field === 'radiationRateMSvDay');

    setMissionState((prev) => {
      const roster = prev.crewRoster || CREW_ROSTER;
      const nowLabel = new Date().toTimeString().slice(0, 8);
      const nextCrewStates = { ...prev.crewStates };

      roster.forEach((crew) => {
        const shouldUpdate = isSharedHabitatField || crew.id === prev.activeCrewId;
        if (!shouldUpdate) return;

        const entry = prev.crewStates[crew.id];
        const nextTargets = {
          ...entry.simulationTargets,
          [domain]: {
            ...entry.simulationTargets[domain],
            [field]: numValue,
          },
        };
        const nextTelemetry = {
          ...entry.telemetry,
          [domain]: {
            ...entry.telemetry[domain],
            [field]: numValue,
          },
        };

        if (domain === 'cardio' && field === 'aredCompletionPct') {
          const syncedLoad = Math.round(numValue * 0.94);
          nextTargets.bone = { ...nextTargets.bone, skeletalLoadScore: syncedLoad };
          nextTelemetry.bone = { ...nextTelemetry.bone, skeletalLoadScore: syncedLoad };
        }

        const nextSample = {
          time: nowLabel,
          hr: nextTelemetry.cardio.restingHr,
          hrv: nextTelemetry.cardio.hrvRmssd,
          co2: nextTelemetry.immuneRad.cabinCo2Ppm,
          radRate: nextTelemetry.immuneRad.radiationRateMSvDay,
          pvt: nextTelemetry.cognitive.pvtMeanMs,
        };

        nextCrewStates[crew.id] = {
          ...entry,
          simulationTargets: nextTargets,
          telemetry: nextTelemetry,
          liveWaveforms: [...entry.liveWaveforms.slice(-23), nextSample],
        };
      });

      const activeEntry = nextCrewStates[prev.activeCrewId];
      const next = {
        ...prev,
        activeScenario: 'CUSTOM',
        crewStates: nextCrewStates,
        telemetry: activeEntry.telemetry,
        simulationTargets: activeEntry.simulationTargets,
        liveWaveforms: activeEntry.liveWaveforms,
      };
      saveMissionState(next);
      return next;
    });
  };

  // Admin: Crew Management
  const handleAddCrewMember = ({ name, role, restingHr, hrvRmssd, pvtMeanMs }) => {
    const firstWord = name.replace(/^(Cmdr\.|Dr\.|Spec\.|Lt\.|Maj\.)\s*/i, '').split(' ')[0] || name;
    const id = `CRW-${firstWord.toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;
    const newCrew = {
      id,
      shortName: firstWord.slice(0, 12),
      name,
      role,
      vehicle: 'ARES-IV Deep Space Transit Habitat',
      missionDay: 142,
      baselines: {
        ...CREW_ROSTER[0].baselines,
        restingHr,
        hrvRmssd,
        pvtMeanMs,
      },
    };
    const tel = buildCrewMemberTelemetry(newCrew);
    // Match current shared habitat CO2 / rad rate
    tel.immuneRad.cabinCo2Ppm = missionState.telemetry.immuneRad.cabinCo2Ppm;
    tel.immuneRad.radiationRateMSvDay = missionState.telemetry.immuneRad.radiationRateMSvDay;

    const newEntry = {
      telemetry: tel,
      simulationTargets: tel,
      history14d: build14DayHistoryForCrew(newCrew),
      liveWaveforms: buildInitialLiveWaveforms(tel),
      checkedCountermeasures: {},
      lastPvtSession: {
        completedAt: new Date().toISOString(),
        meanMs: pvtMeanMs,
        fastestMs: pvtMeanMs - 30,
        lapses: 0,
        falseStarts: 0,
        trials: 5,
      },
    };

    const auditEntry = makeAuditEntry('CREW_ADDED', `Added ${name} (${role}) to roster`);
    setMissionState((prev) => {
      const next = {
        ...prev,
        crewRoster: [...(prev.crewRoster || CREW_ROSTER), newCrew],
        crewStates: { ...prev.crewStates, [id]: newEntry },
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
    appendAuditApi('CREW_ADDED', `Added ${name} (${role})`);
  };

  const handleUpdateCrewBaselines = (crewId, patch) => {
    setMissionState((prev) => {
      const nextRoster = (prev.crewRoster || CREW_ROSTER).map((c) =>
        c.id === crewId ? { ...c, baselines: { ...c.baselines, ...patch } } : c
      );
      const auditEntry = makeAuditEntry('BASELINE_UPDATED', `Updated baseline for ${crewId}`);
      const next = {
        ...prev,
        crewRoster: nextRoster,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleRemoveCrewMember = (crewId) => {
    setMissionState((prev) => {
      const roster = prev.crewRoster || CREW_ROSTER;
      if (roster.length <= 1) return prev;
      const target = roster.find((c) => c.id === crewId);
      const nextRoster = roster.filter((c) => c.id !== crewId);
      const nextCrewStates = { ...prev.crewStates };
      delete nextCrewStates[crewId];

      const nextActiveId = prev.activeCrewId === crewId ? nextRoster[0].id : prev.activeCrewId;
      const activeEntry = nextCrewStates[nextActiveId];
      const auditEntry = makeAuditEntry('CREW_REMOVED', `Removed ${target?.name || crewId}`);
      const next = {
        ...prev,
        crewRoster: nextRoster,
        crewStates: nextCrewStates,
        activeCrewId: nextActiveId,
        telemetry: activeEntry.telemetry,
        simulationTargets: activeEntry.simulationTargets,
        history14d: activeEntry.history14d,
        liveWaveforms: activeEntry.liveWaveforms,
        checkedCountermeasures: activeEntry.checkedCountermeasures || {},
        lastPvtSession: activeEntry.lastPvtSession,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
  };

  // Admin: Thresholds & DTN Flush
  const handleUpdateThresholds = async (nextThresholds) => {
    const auditEntry = makeAuditEntry(
      'THRESHOLDS_UPDATED',
      `CO₂ warn ${nextThresholds.co2WarningPpm} ppm, Rad ${nextThresholds.radCriticalMSvDay} mSv/d, HR ${nextThresholds.hrWarningBpm} bpm`
    );
    setMissionState((prev) => {
      const next = {
        ...prev,
        thresholds: nextThresholds,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
    await saveThresholdsApi(nextThresholds);
  };

  const handleFlushDtnQueue = async () => {
    const apiRes = await flushDtnQueueApi();
    setMissionState((prev) => {
      const syncedBundles = apiRes?.dtnBundles
        ? apiRes.dtnBundles
        : prev.dtnBundles.map((b) => ({
            ...b,
            status: 'DELIVERED_ACK',
            syncedAt: new Date().toISOString(),
          }));
      const auditEntry = makeAuditEntry(
        'DTN_DOWNLINK_SYNC',
        `Synced ${prev.dtnBundles.filter((b) => b.status !== 'DELIVERED_ACK').length} bundle(s) to MCC Houston`
      );
      const next = {
        ...prev,
        dtnBundles: syncedBundles,
        auditLogs: apiRes?.auditLogs || [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleToggleCountermeasure = (cmId) => {
    setMissionState((prev) => {
      const activeEntry = prev.crewStates[prev.activeCrewId];
      const nextChecked = {
        ...(activeEntry.checkedCountermeasures || {}),
        [cmId]: !activeEntry.checkedCountermeasures?.[cmId],
      };
      const next = {
        ...prev,
        checkedCountermeasures: nextChecked,
        crewStates: {
          ...prev.crewStates,
          [prev.activeCrewId]: {
            ...activeEntry,
            checkedCountermeasures: nextChecked,
          },
        },
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleCompletePvt = (session) => {
    setMissionState((prev) => {
      const activeEntry = prev.crewStates[prev.activeCrewId];
      const nextTelemetry = {
        ...activeEntry.telemetry,
        cognitive: {
          ...activeEntry.telemetry.cognitive,
          pvtMeanMs: session.meanMs,
          pvtLapses: session.lapses,
        },
      };
      const nextTargets = {
        ...activeEntry.simulationTargets,
        cognitive: {
          ...activeEntry.simulationTargets.cognitive,
          pvtMeanMs: session.meanMs,
        },
      };
      const next = {
        ...prev,
        lastPvtSession: session,
        telemetry: nextTelemetry,
        simulationTargets: nextTargets,
        crewStates: {
          ...prev.crewStates,
          [prev.activeCrewId]: {
            ...activeEntry,
            lastPvtSession: session,
            telemetry: nextTelemetry,
            simulationTargets: nextTargets,
          },
        },
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleAdjustNutrition = (field, delta) => {
    setMissionState((prev) => {
      const activeEntry = prev.crewStates[prev.activeCrewId];
      const currentVal = activeEntry.telemetry.bone[field] || 0;
      const nextVal = Math.min(2000, currentVal + delta);
      const nextTelemetry = {
        ...activeEntry.telemetry,
        bone: { ...activeEntry.telemetry.bone, [field]: nextVal },
      };
      const next = {
        ...prev,
        telemetry: nextTelemetry,
        crewStates: {
          ...prev.crewStates,
          [prev.activeCrewId]: { ...activeEntry, telemetry: nextTelemetry },
        },
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleToggleAddon = (addonId) => {
    setMissionState((prev) => {
      const list = prev.enabledAddons || [];
      const exists = list.includes(addonId);
      const nextList = exists ? list.filter((id) => id !== addonId) : [...list, addonId];
      const next = { ...prev, enabledAddons: nextList };
      saveMissionState(next);
      return next;
    });
  };

  const handleAddCustomMetric = (metric) => {
    setMissionState((prev) => {
      const next = {
        ...prev,
        customMetrics: [...(prev.customMetrics || []), metric],
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleAdjustCustomMetric = (metricId, delta) => {
    setMissionState((prev) => {
      const next = {
        ...prev,
        customMetrics: (prev.customMetrics || []).map((m) =>
          m.id === metricId ? { ...m, value: Number((m.value + delta).toFixed(2)) } : m
        ),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleRemoveCustomMetric = (metricId) => {
    setMissionState((prev) => {
      const next = {
        ...prev,
        customMetrics: (prev.customMetrics || []).filter((m) => m.id !== metricId),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleSubmitSelfCheck = (form) => {
    const symptomCount = form.symptoms.includes('None') ? 0 : form.symptoms.length;
    const metLabel = formatMetShort(metSeconds);
    const entryId = `CMO-142-${String(missionState.cmoLogs.length + 1).padStart(2, '0')}`;
    const newLog = {
      id: entryId,
      crewId: activeCrew.id,
      crewName: activeCrew.name,
      timestamp: new Date().toISOString(),
      met: metLabel,
      ...form,
      commsMode: missionState.commsMode,
    };
    const newBundle = {
      bundleId: `DTN-142-${Math.floor(1000 + Math.random() * 8999)}`,
      createdAt: new Date().toISOString(),
      source: 'ARES-IV/CMO-EDGE',
      destination: 'MCC-HOUSTON/FLIGHT-SURGEON',
      status: 'QUEUED_BLACKOUT',
      payloadBytes: JSON.stringify(newLog).length + 256,
      summary: `${activeCrew.shortName} Check-In: ${form.symptoms.join(', ')} · ARED ${form.aredCompletionPct}%`,
    };
    const auditEntry = makeAuditEntry('CMO_CHECKIN', `Logged ${entryId} for ${activeCrew.shortName}`, activeCrew.name);

    setMissionState((prev) => {
      const activeEntry = prev.crewStates[prev.activeCrewId];
      const nextTelemetry = {
        ...activeEntry.telemetry,
        cardio: {
          ...activeEntry.telemetry.cardio,
          aredCompletionPct: form.aredCompletionPct,
          orthostaticIndex:
            form.hydrationMl >= 2000
              ? Math.max(activeEntry.telemetry.cardio.orthostaticIndex, 91)
              : Math.min(activeEntry.telemetry.cardio.orthostaticIndex, 83),
        },
        bone: {
          ...activeEntry.telemetry.bone,
          vitaminDIu: form.vitaminDIu,
          calciumMg: form.calciumMg,
          skeletalLoadScore: Math.max(
            activeEntry.telemetry.bone.skeletalLoadScore,
            Math.round(form.aredCompletionPct * 0.92)
          ),
        },
        immuneRad: {
          ...activeEntry.telemetry.immuneRad,
          immuneSymptomScore: symptomCount,
        },
        cognitive: {
          ...activeEntry.telemetry.cognitive,
          moodScore: form.moodScore,
        },
      };

      const next = {
        ...prev,
        telemetry: nextTelemetry,
        crewStates: {
          ...prev.crewStates,
          [prev.activeCrewId]: {
            ...activeEntry,
            telemetry: nextTelemetry,
          },
        },
        cmoLogs: [newLog, ...prev.cmoLogs],
        dtnBundles: [newBundle, ...prev.dtnBundles],
        auditLogs: [auditEntry, ...(prev.auditLogs || [])].slice(0, 120),
      };
      saveMissionState(next);
      return next;
    });
  };

  const handleResetMission = async () => {
    const fresh = await resetMissionState();
    setMissionState(fresh);
    setMetSeconds(fresh.metOffsetSeconds);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100">
      <TelemetryHeader
        metSeconds={metSeconds}
        crewRoster={missionState.crewRoster}
        activeCrewId={missionState.activeCrewId}
        crewSummaries={crewSummaries}
        backendOnline={backendHealth.online}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onSelectCrew={handleSelectCrew}
        onOpenSelfCheck={() => setIsSelfCheckOpen(true)}
        onOpenAddMetric={() => setIsAddMetricOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onResetMission={handleResetMission}
      />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-24 pt-6 sm:px-6">
        <ExplainableTriagePanel
          triage={activeTriage}
          checkedCountermeasures={missionState.checkedCountermeasures}
          onToggleCountermeasure={handleToggleCountermeasure}
        />

        <HumanBodyModel
          telemetry={missionState.telemetry}
          domainStatuses={activeTriage.domainStatuses}
          deltas={activeTriage.deltas}
          crew={activeCrew}
          overallStatus={activeTriage.overallStatus}
        />

        <RiskDomainCards
          telemetry={missionState.telemetry}
          history14d={missionState.history14d}
          liveWaveforms={missionState.liveWaveforms}
          domainStatuses={activeTriage.domainStatuses}
          deltas={activeTriage.deltas}
          lastPvtSession={missionState.lastPvtSession}
          crewBaselines={activeCrew.baselines}
          enabledAddons={missionState.enabledAddons || []}
          customMetrics={missionState.customMetrics || []}
          onCompletePvt={handleCompletePvt}
          onAdjustNutrition={handleAdjustNutrition}
          onToggleAddon={handleToggleAddon}
          onAdjustCustomMetric={handleAdjustCustomMetric}
          onRemoveCustomMetric={handleRemoveCustomMetric}
          onOpenAddMetric={() => setIsAddMetricOpen(true)}
        />
      </main>

      <ScenarioSimulator
        activeScenario={missionState.activeScenario}
        telemetry={missionState.telemetry}
        onSelectScenario={handleSelectScenario}
        onUpdateSimValue={handleUpdateSimulationValue}
      />

      <AddMetricModal
        isOpen={isAddMetricOpen}
        onClose={() => setIsAddMetricOpen(false)}
        enabledAddons={missionState.enabledAddons || []}
        onToggleAddon={handleToggleAddon}
        onAddCustomMetric={handleAddCustomMetric}
      />

      <AdminManagementModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        crewRoster={missionState.crewRoster || CREW_ROSTER}
        activeCrewId={missionState.activeCrewId}
        thresholds={missionState.thresholds || DEFAULT_THRESHOLDS}
        dtnBundles={missionState.dtnBundles}
        auditLogs={missionState.auditLogs || []}
        backendHealth={backendHealth}
        onAddCrewMember={handleAddCrewMember}
        onUpdateCrewBaselines={handleUpdateCrewBaselines}
        onRemoveCrewMember={handleRemoveCrewMember}
        onUpdateThresholds={handleUpdateThresholds}
        onFlushDtnQueue={handleFlushDtnQueue}
        onExportJson={() => exportDtnBundleJson(missionState, activeTriage)}
      />

      <AstronautLogModal
        isOpen={isSelfCheckOpen}
        onClose={() => setIsSelfCheckOpen(false)}
        telemetry={missionState.telemetry}
        cmoLogs={missionState.cmoLogs}
        dtnBundles={missionState.dtnBundles}
        commsMode={missionState.commsMode}
        onSubmitLog={handleSubmitSelfCheck}
        onExportJson={() => exportDtnBundleJson(missionState, activeTriage)}
        onExportCsv={() => exportCmoLogsCsv(missionState.cmoLogs)}
      />
    </div>
  );
}
