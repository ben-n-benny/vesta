import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export default function AdminManagementModal({
  isOpen,
  onClose,
  crewRoster,
  activeCrewId,
  onAddCrewMember,
  onUpdateCrewBaselines,
  onRemoveCrewMember,
}) {
  // Add crew form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Mission Specialist');
  const [newHr, setNewHr] = useState(60);
  const [newHrv, setNewHrv] = useState(62);
  const [newPvt, setNewPvt] = useState(240);
  const [savedBanner, setSavedBanner] = useState('');

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crew Management"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141821] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Crew Management</h2>
              <p className="text-xs text-slate-400">
                Manage crew roster and individual clinical baselines ({crewRoster.length})
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
            aria-label="Close Crew Management Modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crew Tab Pill */}
        <div className="flex items-center border-b border-white/[0.07] px-5 py-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2A3244] px-3 py-1.5 text-xs font-medium text-white">
            <Users className="h-3.5 w-3.5" />
            <span>Crew ({crewRoster.length})</span>
          </div>
        </div>

        {/* Crew Content */}
        <div className="flex-1 overflow-y-auto p-5">
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
        </div>
      </div>
    </div>
  );
}
