import React, { useState } from 'react';
import { X, Plus, Check, Bone, Activity, Zap, Wind, SlidersHorizontal } from 'lucide-react';

export const AVAILABLE_ADDONS = [
  {
    id: 'bone',
    title: 'Bone Density & Calcium',
    subtitle: 'DEXA L1-L4 trend, skeletal load score, Vitamin D3 & Calcium intake',
    icon: Bone,
  },
  {
    id: 'orthostatic',
    title: 'Orthostatic & Fluid Shift',
    subtitle: 'Headward fluid shift index & stand-test tolerance score',
    icon: Activity,
  },
  {
    id: 'pvt',
    title: '3-Min PVT Reaction Test',
    subtitle: 'Pin the interactive Psychomotor Vigilance reaction test to dashboard',
    icon: Zap,
  },
  {
    id: 'voc',
    title: 'Cabin VOCs & Immune Check',
    subtitle: 'Trace volatile organics (ppb), cabin pressure & symptom status',
    icon: Wind,
  },
];

export default function AddMetricModal({
  isOpen,
  onClose,
  enabledAddons,
  onToggleAddon,
  onAddCustomMetric,
}) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState('');

  if (!isOpen) return null;

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!label.trim() || value === '') return;
    onAddCustomMetric({
      id: `custom-${Date.now()}`,
      label: label.trim(),
      value: Number(value),
      unit: unit.trim() || 'units',
      target: target.trim() || 'Nominal',
      step: Math.abs(Number(value)) >= 100 ? 10 : Math.abs(Number(value)) >= 10 ? 1 : 0.1,
    });
    setLabel('');
    setValue('');
    setUnit('');
    setTarget('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Add Health Metrics"
    >
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141821] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Customize Health Metrics</h2>
            <p className="text-xs text-slate-400">
              Keep your dashboard simple or pin additional spaceflight telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Built-in Spaceflight Add-ons */}
          <div>
            <div className="mb-2.5 text-xs font-medium text-slate-400">
              Optional Spaceflight Modules
            </div>
            <div className="space-y-2">
              {AVAILABLE_ADDONS.map((addon) => {
                const Icon = addon.icon;
                const enabled = enabledAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => onToggleAddon(addon.id)}
                    className={`flex min-h-[58px] w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${
                      enabled
                        ? 'border-sky-400/40 bg-sky-500/10'
                        : 'border-white/[0.06] bg-[#1B202C] hover:border-white/15'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sky-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{addon.title}</div>
                      <div className="text-xs text-slate-400">{addon.subtitle}</div>
                    </div>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                        enabled
                          ? 'bg-sky-400 text-slate-950'
                          : 'bg-white/[0.08] text-slate-300'
                      }`}
                    >
                      {enabled ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Metric Creator */}
          <div className="border-t border-white/[0.07] pt-4">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
              <span>Track a Custom Metric</span>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3 rounded-2xl bg-[#1B202C] p-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  placeholder="Metric name (e.g. Core Temp)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Value (36.8)"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="font-mono-num rounded-xl border border-white/10 bg-[#11151E] px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Unit (°C)"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Target range (e.g. 36.5–37.2 °C)"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
