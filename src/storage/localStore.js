import { createSeedState } from '../data/missionSeed.js';

const DB_NAME = 'vesta_space_health_db';
const DB_VERSION = 1;
const STORE_NAME = 'mission_state';
const STATE_KEY = 'active_mission';
const LS_FALLBACK_KEY = 'vesta_mission_state_v1';

function openIndexedDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB unavailable'));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, val) {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(val, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(key) {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function loadMissionState() {
  // 1. Try IndexedDB first (true offline-first local edge persistence)
  try {
    const idbData = await idbGet(STATE_KEY);
    if (idbData && idbData.telemetry) {
      return { state: idbData, source: 'IndexedDB' };
    }
  } catch {
    // Fallback below
  }

  // 2. Try LocalStorage fallback
  try {
    const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.telemetry) {
        return { state: parsed, source: 'LocalStorage' };
      }
    }
  } catch {
    // Fallback below
  }

  // 3. Seed fresh mission state
  const seeded = createSeedState();
  await saveMissionState(seeded);
  return { state: seeded, source: 'FreshSeed' };
}

export async function saveMissionState(state) {
  const stamped = { ...state, updatedAt: new Date().toISOString() };
  try {
    await idbSet(STATE_KEY, stamped);
  } catch {
    // ignore if IDB unavailable
  }
  try {
    window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(stamped));
  } catch {
    // ignore quota errors
  }
  return stamped;
}

export async function resetMissionState() {
  try {
    await idbClear(STATE_KEY);
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // ignore
  }
  const seeded = createSeedState();
  await saveMissionState(seeded);
  return seeded;
}

export async function fetchBackendHealth() {
  return { online: false };
}

export async function fetchAdminOverview() {
  return { online: false };
}

export async function saveThresholdsApi() {
  return null;
}

export async function flushDtnQueueApi() {
  return null;
}

export async function appendAuditApi() {
  return null;
}

export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDtnBundleJson(state, triage) {
  const payload = {
    protocol: 'CCSDS-DTN-BPv7',
    generatedAt: new Date().toISOString(),
    vehicle: 'ARES-IV',
    crewId: 'CDR-VANCE-01',
    commsMode: state.commsMode,
    oneWayLightTimeSeconds: state.commsMode === 'AUTONOMOUS' ? 1334 : 0,
    activeScenario: state.activeScenario,
    resilienceScore: triage.currentEffectiveScore,
    projectedScore: triage.projectedScore,
    telemetrySnapshot: state.telemetry,
    activeInsights: triage.insights,
    cmoLogs: state.cmoLogs,
    dtnQueue: state.dtnBundles,
  };
  downloadTextFile(
    `vesta-dtn-bundle-met142-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

export function exportCmoLogsCsv(cmoLogs) {
  const headers = [
    'id',
    'timestamp',
    'met',
    'symptoms',
    'hydrationMl',
    'nutritionKcal',
    'vitaminDIu',
    'calciumMg',
    'moodScore',
    'aredCompletionPct',
    'commsMode',
    'notes',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = cmoLogs.map((log) =>
    [
      log.id,
      log.timestamp,
      log.met,
      (log.symptoms || []).join('; '),
      log.hydrationMl,
      log.nutritionKcal,
      log.vitaminDIu,
      log.calciumMg,
      log.moodScore,
      log.aredCompletionPct,
      log.commsMode,
      log.notes,
    ]
      .map(escape)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  downloadTextFile(`vesta-cmo-logs-met142-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
}
