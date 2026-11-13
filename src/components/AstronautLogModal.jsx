import React, { useState } from 'react';
import { X, FileJson, FileSpreadsheet, Send, History } from 'lucide-react';

const SYMPTOM_OPTIONS = [
  'None',
  'Headache',
  'Sinus Congestion',
  'Fatigue',
  'Motion Sickness',
  'Visual Shift',
];

export default function AstronautLogModal({
  isOpen,
  onClose,
  telemetry,
  cmoLogs,
  dtnBundles,
  commsMode,
  onSubmitLog,
  onExportJson,
  onExportCsv,
}) {
  const [activeTab, setActiveTab] = useState('LOG');
  const [symptoms, setSymptoms] = useState(['None']);
  const [hydrationMl, setHydrationMl] = useState(2200);
  const [nutritionKcal, setNutritionKcal] = useState(2650);
  const [vitaminDIu, setVitaminDIu] = useState(telemetry.bone.vitaminDIu);
  const [calciumMg, setCalciumMg] = useState(telemetry.bone.calciumMg);
  const [moodScore, setMoodScore] = useState(telemetry.cognitive.moodScore);
  const [aredCompletionPct, setAredCompletionPct] = useState(telemetry.cardio.aredCompletionPct);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const toggleSymptom = (sym) => {
    if (sym === 'None') {
      setSymptoms(['None']);
      return;
    }
    const withoutNone = symptoms.filter((s) => s !== 'None');
    if (withoutNone.includes(sym)) {
      const next = withoutNone.filter((s) => s !== sym);
      setSymptoms(next.length ? next : ['None']);
    } else {
      setSymptoms([...withoutNone, sym]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitLog({
      symptoms,
      hydrationMl: Number(hydrationMl),
      nutritionKcal: Number(nutritionKcal),
      vitaminDIu: Number(vitaminDIu),
      calciumMg: Number(calciumMg),
      moodScore: Number(moodScore),
      aredCompletionPct: Number(aredCompletionPct),
      notes: notes.trim() || '30s self-check logged.',
    });
    setActiveTab('HISTORY');
    setNotes('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Check-In and Logs"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141821] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Daily Health Check-In</h2>
            <p className="text-xs text-slate-400">
              {commsMode === 'AUTONOMOUS' ? 'Saved locally · Queued for next Earth link' : 'DTN Sync ready'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-nav */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-2.5">
          <div className="inline-flex rounded-full bg-[#1B202C] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('LOG')}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition cursor-pointer ${
                activeTab === 'LOG' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Check-In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition cursor-pointer ${
                activeTab === 'HISTORY' ? 'bg-[#2A3244] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Logs ({cmoLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#1B202C] px-3 text-xs font-medium text-sky-300 hover:bg-[#252C3B] cursor-pointer"
            >
              <FileJson className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#1B202C] px-3 text-xs font-medium text-emerald-300 hover:bg-[#252C3B] cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'LOG' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-300">Symptoms</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOM_OPTIONS.map((sym) => {
                    const active = symptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`min-h-[38px] rounded-full border px-3.5 text-xs font-medium transition cursor-pointer ${
                          active
                            ? sym === 'None'
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                              : 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                            : 'border-white/[0.08] bg-[#1B202C] text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="card-surface-inner p-3.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Hydration</span>
                    <span className="font-mono-num text-white">{hydrationMl} mL</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="3500"
                    step="100"
                    value={hydrationMl}
                    onChange={(e) => setHydrationMl(e.target.value)}
                    className="mt-2.5 w-full cursor-pointer accent-sky-400"
                  />
                </div>

                <div className="card-surface-inner p-3.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ARED Exercise</span>
                    <span className="font-mono-num text-white">{aredCompletionPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={aredCompletionPct}
                    onChange={(e) => setAredCompletionPct(e.target.value)}
                    className="mt-2.5 w-full cursor-pointer accent-emerald-400"
                  />
                </div>

                <div className="card-surface-inner p-3.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Calories</span>
                    <span className="font-mono-num text-white">{nutritionKcal} kcal</span>
                  </div>
                  <input
                    type="range"
                    min="1400"
                    max="3600"
                    step="50"
                    value={nutritionKcal}
                    onChange={(e) => setNutritionKcal(e.target.value)}
                    className="mt-2.5 w-full cursor-pointer accent-amber-400"
                  />
                </div>

                <div className="card-surface-inner p-3.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Mood &amp; Focus</span>
                    <span className="font-mono-num text-white">{moodScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={moodScore}
                    onChange={(e) => setMoodScore(e.target.value)}
                    className="mt-2.5 w-full cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card-surface-inner p-3">
                  <label className="block text-[11px] text-slate-400">Vitamin D3 (IU)</label>
                  <input
                    type="number"
                    min="0"
                    max="4000"
                    step="100"
                    value={vitaminDIu}
                    onChange={(e) => setVitaminDIu(e.target.value)}
                    className="font-mono-num mt-1 w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div className="card-surface-inner p-3">
                  <label className="block text-[11px] text-slate-400">Calcium (mg)</label>
                  <input
                    type="number"
                    min="0"
                    max="2500"
                    step="50"
                    value={calciumMg}
                    onChange={(e) => setCalciumMg(e.target.value)}
                    className="font-mono-num mt-1 w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional clinical note..."
                className="w-full rounded-2xl border border-white/10 bg-[#1B202C] p-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] rounded-full px-4 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-sky-500 px-5 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Save Check-In
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-medium text-slate-400">DTN Downlink Queue</h3>
                <div className="space-y-2">
                  {dtnBundles.slice(0, 5).map((b) => (
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

              <div>
                <h3 className="mb-2 text-xs font-medium text-slate-400">Recent Check-Ins</h3>
                <div className="space-y-2">
                  {cmoLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="card-surface-inner p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-num font-medium text-sky-300">MET {log.met}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-300">
                        Symptoms: {(log.symptoms || []).join(', ')} · {log.hydrationMl} mL · ARED {log.aredCompletionPct}%
                      </div>
                      {log.notes && <p className="mt-1 text-slate-400">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
