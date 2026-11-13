import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  Sliders,
  Server,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { DEFAULT_THRESHOLDS } from '../data/missionSeed.js';
import { fetchAdminOverview } from '../storage/localStore.js';

export default function AdminManagementModal({
  isOpen,
  onClose,
  crewRoster,
  activeCrewId,
  thresholds,
  dtnBundles,
  auditLogs,
  backendHealth,
  onAddCrewMember,
  onUpdateCrewBaselines,
  onRemoveCrewMember,
  onUpdateThresholds,
  onFlushDtnQueue,
  onExportJson,
}) {
  const [tab, setTab] = useState('CREW'); // 'CREW' | 'THRESHOLDS' | 'BACKEND' | 'AUDIT'
  const [adminOverview, setAdminOverview] = useState(null);

  // Add crew form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Mission Specialist');
  const [newHr, setNewHr] = useState(60);
  const [newHrv, setNewHrv] = useState(62);
  const [newPvt, setNewPvt] = useState(240);

  // Local editable thresholds draft
  const [draftThresholds, setDraftThresholds] = useState(thresholds || DEFAULT_THRESHOLDS);
  const [savedBanner, setSavedBanner] = useState('');

  useEffect(() => {
    setDraftThresholds(thresholds || DEFAULT_THRESHOLDS);
  }, [thresholds, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAdminOverview().then((data) => setAdminOverview(data));
  }, [isOpen, dtnBundles.length, auditLogs.length]);

  if (!isOpen) return null;

  const queuedCount = dtnBundles.filter((b) => b.status !== 'DELIVERED_ACK').length;

  const flashNotice = (msg) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 2400);
  };

  const handleCreateCrew = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCrewMember({
      name: newName.trim(),
      role: newRole.trim() || 'Mission Specialist',
      restingHr: Number(newHr),
      hrvRmssd: Number(newHrv),
      pvtMeanMs: Number(newPvt),
    });
    setNewName('');
    flashNotice('Crew member added');
  };

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    onUpdateThresholds({
      co2WarningPpm: Number(draftThresholds.co2WarningPpm),
      co2CriticalPpm: Number(draftThresholds.co2CriticalPpm),
      radCriticalMSvDay: Number(draftThresholds.radCriticalMSvDay),
      hrWarningBpm: Number(draftThresholds.hrWarningBpm),
      hrvDropPctWarning: Number(draftThresholds.hrvDropPctWarning),
      pvtSlowingWarningMs: Number(draftThresholds.pvtSlowingWarningMs),
    });
    flashNotice('Alert thresholds updated');
  };

  const handleFlushDtn = async () => {
    await onFlushDtnQueue();
    const refreshed = await fetchAdminOverview();
    setAdminOverview(refreshed);
    flashNotice('DTN queue marked synced');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Admin and Management Console"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141821] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Admin &amp; Mission Management</h2>
              <p className="text-xs text-slate-400">
                Crew roster, Edge-AI alert rules, DTN downlink sync, and audit ledger
              </p>
            </div>
            {savedBanner && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {savedBanner}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-2.5">
          <div className="inline-flex flex-wrap gap-1 rounded-full bg-[#1B202C] p-1">
            {[
              { id: 'CREW', label: `Crew (${crewRoster.length})`, icon: Users },
              { id: 'THRESHOLDS', label: 'Thresholds', icon: Sliders },
              { id: 'BACKEND', label: `Backend & DTN (${queuedCount})`, icon: Server },
              { id: 'AUDIT', label: `Audit (${auditLogs.length})`, icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-medium transition cursor-pointer ${
                    active ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px]">
            <span
              className={`h-2 w-2 rounded-full ${
                backendHealth?.online ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {backendHealth?.online ? 'Edge API Online' : 'Browser Offline Mode'}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'CREW' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                {crewRoster.map((crew) => (
                  <div
                    key={crew.id}
                    className="card-surface-inner flex flex-wrap items-center justify-between gap-3 p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{crew.name}</span>
                        {crew.id === activeCrewId && (
                          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {crew.role} · {crew.id}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[11px] text-slate-400">
                        HR
                        <input
                          type="number"
                          min="40"
                          max="100"
                          value={crew.baselines.restingHr}
                          onChange={(e) =>
                            onUpdateCrewBaselines(crew.id, { restingHr: Number(e.target.value) })
                          }
                          className="font-mono-num ml-1.5 w-14 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                        />
                      </label>
                      <label className="text-[11px] text-slate-400">
                        HRV
                        <input
                          type="number"
                          min="25"
                          max="110"
                          value={crew.baselines.hrvRmssd}
                          onChange={(e) =>
                            onUpdateCrewBaselines(crew.id, { hrvRmssd: Number(e.target.value) })
                          }
                          className="font-mono-num ml-1.5 w-14 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                        />
                      </label>
                      <label className="text-[11px] text-slate-400">
                        PVT
                        <input
                          type="number"
                          min="160"
                          max="340"
                          value={crew.baselines.pvtMeanMs}
                          onChange={(e) =>
                            onUpdateCrewBaselines(crew.id, { pvtMeanMs: Number(e.target.value) })
                          }
                          className="font-mono-num ml-1.5 w-16 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                        />
                      </label>

                      {crewRoster.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveCrewMember(crew.id)}
                          aria-label={`Remove ${crew.name}`}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Crew Member Form */}
              <form onSubmit={handleCreateCrew} className="card-surface-inner space-y-3 p-4">
                <div className="text-xs font-medium text-slate-200">Add Crew Member</div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Full name (e.g. Lt. Sofia Reyes)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Payload Specialist)"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap gap-2">
                    <label className="text-[11px] text-slate-400">
                      Base HR
                      <input
                        type="number"
                        value={newHr}
                        onChange={(e) => setNewHr(e.target.value)}
                        className="font-mono-num ml-1.5 w-14 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                      />
                    </label>
                    <label className="text-[11px] text-slate-400">
                      Base HRV
                      <input
                        type="number"
                        value={newHrv}
                        onChange={(e) => setNewHrv(e.target.value)}
                        className="font-mono-num ml-1.5 w-14 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                      />
                    </label>
                    <label className="text-[11px] text-slate-400">
                      Base PVT
                      <input
                        type="number"
                        value={newPvt}
                        onChange={(e) => setNewPvt(e.target.value)}
                        className="font-mono-num ml-1.5 w-16 rounded-lg border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-white"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Crew
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'THRESHOLDS' && (
            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { key: 'co2WarningPpm', label: 'Cabin CO₂ Elevated (ppm)', min: 1000, max: 4000, step: 100 },
                  { key: 'co2CriticalPpm', label: 'Cabin CO₂ Critical (ppm)', min: 2000, max: 5000, step: 100 },
                  { key: 'radCriticalMSvDay', label: 'Radiation Alert (mSv/day)', min: 2.0, max: 20.0, step: 0.5 },
                  { key: 'hrWarningBpm', label: 'Heart Rate Alert (bpm)', min: 70, max: 120, step: 1 },
                  { key: 'hrvDropPctWarning', label: 'HRV Drop Alert (%)', min: 5, max: 40, step: 1 },
                  { key: 'pvtSlowingWarningMs', label: 'Reaction Slowing (+ms)', min: 15, max: 100, step: 5 },
                ].map((item) => (
                  <div key={item.key} className="card-surface-inner p-3.5">
                    <label className="block text-xs text-slate-300">{item.label}</label>
                    <input
                      type="number"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={draftThresholds[item.key]}
                      onChange={(e) =>
                        setDraftThresholds((prev) => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="font-mono-num mt-1.5 w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm font-semibold text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDraftThresholds(DEFAULT_THRESHOLDS);
                    onUpdateThresholds(DEFAULT_THRESHOLDS);
                    flashNotice('Default thresholds restored');
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-xs font-medium text-slate-300 hover:bg-white/[0.1] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Defaults
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-sky-500 px-5 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
                >
                  Apply Rules
                </button>
              </div>
            </form>
          )}

          {tab === 'BACKEND' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="card-surface-inner p-3.5">
                  <div className="text-[11px] text-slate-400">Edge Server</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {backendHealth?.online ? 'Connected (127.0.0.1:4170)' : 'Offline Browser Fallback'}
                  </div>
                </div>
                <div className="card-surface-inner p-3.5">
                  <div className="text-[11px] text-slate-400">Server Store Size</div>
                  <div className="font-mono-num mt-1 text-sm font-semibold text-white">
                    {adminOverview?.storageBytes ? `${(adminOverview.storageBytes / 1024).toFixed(1)} KB` : 'Local IDB'}
                  </div>
                </div>
                <div className="card-surface-inner p-3.5">
                  <div className="text-[11px] text-slate-400">Queued DTN Packets</div>
                  <div className="font-mono-num mt-1 text-sm font-semibold text-white">
                    {queuedCount} pending
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleFlushDtn}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  Flush DTN Queue (Sync to Earth)
                </button>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-xs font-medium text-slate-200 hover:bg-white/[0.12] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Export Full Bundle JSON
                </button>
              </div>

              <div className="space-y-2">
                {dtnBundles.slice(0, 8).map((b) => (
                  <div
                    key={b.bundleId}
                    className="card-surface-inner flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-mono-num font-medium text-white">{b.bundleId}</div>
                      <div className="text-slate-400">{b.summary}</div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        b.status === 'DELIVERED_ACK'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {b.status === 'DELIVERED_ACK' ? 'Synced' : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'AUDIT' && (
            <div className="space-y-2">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="card-surface-inner flex items-start justify-between gap-3 p-3.5 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-semibold text-sky-300">{entry.action}</span>
                      <span className="text-slate-400">by {entry.actor}</span>
                    </div>
                    <div className="mt-1 text-slate-300">{entry.detail}</div>
                  </div>
                  <span className="font-mono-num shrink-0 text-[11px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
