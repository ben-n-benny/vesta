import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'mission-store.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.VESTA_PORT || 4170);

const DEFAULT_THRESHOLDS = {
  co2WarningPpm: 2200,
  co2CriticalPpm: 3500,
  radCriticalMSvDay: 4.0,
  hrWarningBpm: 85,
  hrvDropPctWarning: 15,
  pvtSlowingWarningMs: 40,
};

function ensureStoreDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore() {
  ensureStoreDir();
  if (!fs.existsSync(STORE_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeStore(payload) {
  ensureStoreDir();
  const stamped = {
    ...payload,
    serverPersistedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(stamped, null, 2), 'utf8');
  return stamped;
}

function appendAudit(store, action, detail, actor = 'CMO / Admin') {
  const existing = Array.isArray(store.auditLogs) ? store.auditLogs : [];
  const entry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    detail,
  };
  return [entry, ...existing].slice(0, 120);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 4 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function serveStaticIfBuilt(urlPath, res) {
  if (!fs.existsSync(DIST_DIR)) return false;
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const fullPath = path.join(DIST_DIR, safePath);
  if (!fullPath.startsWith(DIST_DIR) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return false;
  }
  const ext = path.extname(fullPath).toLowerCase();
  const mime =
    ext === '.html'
      ? 'text/html'
      : ext === '.js'
      ? 'application/javascript'
      : ext === '.css'
      ? 'text/css'
      : ext === '.svg'
      ? 'image/svg+xml'
      : ext === '.json'
      ? 'application/json'
      : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(fullPath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  // Health & Edge telemetry status
  if (req.method === 'GET' && pathname === '/api/health') {
    const store = readStore();
    const stat = fs.existsSync(STORE_PATH) ? fs.statSync(STORE_PATH) : null;
    const dtnQueue = store?.dtnBundles || [];
    const queuedCount = dtnQueue.filter((b) => b.status !== 'DELIVERED_ACK').length;
    return sendJson(res, 200, {
      status: 'NOMINAL',
      mode: 'AIR_GAPPED_LOCAL_EDGE',
      port: PORT,
      uptimeSeconds: Math.round(process.uptime()),
      storageBytes: stat ? stat.size : 0,
      serverPersistedAt: store?.serverPersistedAt || null,
      crewCount: store?.crewRoster?.length || 0,
      queuedDtnCount: queuedCount,
      auditCount: store?.auditLogs?.length || 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Full mission state read
  if (req.method === 'GET' && pathname === '/api/state') {
    const state = readStore();
    if (!state) {
      return sendJson(res, 404, { error: 'UNINITIALIZED' });
    }
    return sendJson(res, 200, state);
  }

  // Full mission state write
  if (req.method === 'PUT' && pathname === '/api/state') {
    try {
      const body = await collectBody(req);
      const existing = readStore() || {};
      const merged = writeStore({
        ...body,
        auditLogs: body.auditLogs || existing.auditLogs || [],
      });
      return sendJson(res, 200, { ok: true, savedAt: merged.serverPersistedAt });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Admin overview
  if (req.method === 'GET' && pathname === '/api/admin/overview') {
    const store = readStore();
    const stat = fs.existsSync(STORE_PATH) ? fs.statSync(STORE_PATH) : null;
    return sendJson(res, 200, {
      online: true,
      port: PORT,
      storagePath: STORE_PATH,
      storageBytes: stat ? stat.size : 0,
      serverPersistedAt: store?.serverPersistedAt || null,
      thresholds: store?.thresholds || DEFAULT_THRESHOLDS,
      crewCount: store?.crewRoster?.length || 0,
      dtnBundles: store?.dtnBundles || [],
      auditLogs: store?.auditLogs || [],
    });
  }

  // Admin update thresholds
  if (req.method === 'PUT' && pathname === '/api/admin/thresholds') {
    try {
      const nextThresholds = await collectBody(req);
      const current = readStore() || {};
      const mergedThresholds = {
        ...DEFAULT_THRESHOLDS,
        ...(current.thresholds || {}),
        ...nextThresholds,
      };
      const auditLogs = appendAudit(
        current,
        'THRESHOLDS_UPDATED',
        `CO₂ warn ${mergedThresholds.co2WarningPpm} ppm, Rad ${mergedThresholds.radCriticalMSvDay} mSv/d, HR ${mergedThresholds.hrWarningBpm} bpm`
      );
      const saved = writeStore({ ...current, thresholds: mergedThresholds, auditLogs });
      return sendJson(res, 200, { ok: true, thresholds: saved.thresholds, auditLogs: saved.auditLogs });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Admin flush DTN downlink queue
  if (req.method === 'POST' && pathname === '/api/admin/dtn/sync') {
    const current = readStore() || { dtnBundles: [] };
    const prevBundles = current.dtnBundles || [];
    let syncedCount = 0;
    const nextBundles = prevBundles.map((b) => {
      if (b.status !== 'DELIVERED_ACK') {
        syncedCount += 1;
        return { ...b, status: 'DELIVERED_ACK', syncedAt: new Date().toISOString() };
      }
      return b;
    });
    const auditLogs = appendAudit(
      current,
      'DTN_DOWNLINK_SYNC',
      `Flushed ${syncedCount} queued DTN bundle(s) to MCC Houston`
    );
    const saved = writeStore({ ...current, dtnBundles: nextBundles, auditLogs });
    return sendJson(res, 200, {
      ok: true,
      syncedCount,
      dtnBundles: saved.dtnBundles,
      auditLogs: saved.auditLogs,
    });
  }

  // Append audit event explicitly
  if (req.method === 'POST' && pathname === '/api/admin/audit') {
    try {
      const { action, detail, actor } = await collectBody(req);
      const current = readStore() || {};
      const auditLogs = appendAudit(current, action || 'ADMIN_ACTION', detail || '', actor);
      const saved = writeStore({ ...current, auditLogs });
      return sendJson(res, 201, { ok: true, auditLogs: saved.auditLogs });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Append CMO check-in log
  if (req.method === 'POST' && pathname === '/api/logs') {
    try {
      const entry = await collectBody(req);
      const current = readStore() || { cmoLogs: [], dtnBundles: [] };
      const cmoLogs = [entry, ...(current.cmoLogs || [])].slice(0, 100);
      const bundle = {
        bundleId: `DTN-${Date.now()}`,
        createdAt: new Date().toISOString(),
        source: 'ARES-IV/CMO-EDGE',
        destination: 'MCC-HOUSTON/FLIGHT-SURGEON',
        status: entry.commsMode === 'AUTONOMOUS' ? 'QUEUED_BLACKOUT' : 'QUEUED_DTN_SYNC',
        payloadBytes: Buffer.byteLength(JSON.stringify(entry), 'utf8'),
        summary: entry.summary || 'CMO Telemetry Check-In',
      };
      const dtnBundles = [bundle, ...(current.dtnBundles || [])].slice(0, 100);
      const auditLogs = appendAudit(current, 'CMO_CHECKIN', `Logged ${entry.id || 'check-in'}`);
      const next = writeStore({ ...current, cmoLogs, dtnBundles, auditLogs });
      return sendJson(res, 201, { ok: true, bundle, auditLogs: next.auditLogs });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Reset backend store
  if (req.method === 'POST' && pathname === '/api/reset') {
    ensureStoreDir();
    if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH);
    }
    return sendJson(res, 200, { ok: true, reset: true });
  }

  // Serve built static assets if available
  if (req.method === 'GET' && !pathname.startsWith('/api/')) {
    if (serveStaticIfBuilt(pathname, res)) return;
  }

  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[VESTA Edge Server] Local air-gapped telemetry & admin API listening on http://127.0.0.1:${PORT}`);
});
