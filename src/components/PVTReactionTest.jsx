import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';

export default function PVTReactionTest({
  currentPvtMs,
  baselinePvtMs,
  lastSession,
  onCompleteSession,
}) {
  const [mode, setMode] = useState('SPRINT');
  const [phase, setPhase] = useState('IDLE');
  const [trials, setTrials] = useState([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [lastReaction, setLastReaction] = useState(null);
  const [remainingSec, setRemainingSec] = useState(180);

  const stimulusStartRef = useRef(0);
  const waitTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const targetTrials = mode === 'SPRINT' ? 5 : 24;

  const clearTimers = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const finishTest = (finalTrials, finalFalseStarts) => {
    clearTimers();
    setPhase('COMPLETE');
    if (finalTrials.length === 0) return;
    const meanMs = Math.round(finalTrials.reduce((a, b) => a + b, 0) / finalTrials.length);
    const fastestMs = Math.min(...finalTrials);
    const lapses = finalTrials.filter((ms) => ms >= 500).length;
    onCompleteSession({
      completedAt: new Date().toISOString(),
      meanMs,
      fastestMs,
      lapses,
      falseStarts: finalFalseStarts,
      trials: finalTrials.length,
    });
  };

  const scheduleNextStimulus = (currentTrials, currentFalseStarts) => {
    if (currentTrials.length >= targetTrials) {
      finishTest(currentTrials, currentFalseStarts);
      return;
    }
    setPhase('WAITING');
    const delayMs = 1200 + Math.floor(Math.random() * 2200);
    waitTimerRef.current = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setPhase('STIMULUS');
    }, delayMs);
  };

  const startTest = () => {
    clearTimers();
    setTrials([]);
    setFalseStarts(0);
    setLastReaction(null);
    setRemainingSec(180);

    if (mode === 'STANDARD') {
      countdownTimerRef.current = setInterval(() => {
        setRemainingSec((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }

    scheduleNextStimulus([], 0);
  };

  useEffect(() => {
    if (mode === 'STANDARD' && remainingSec === 0 && (phase === 'WAITING' || phase === 'STIMULUS' || phase === 'FEEDBACK')) {
      finishTest(trials, falseStarts);
    }
  }, [remainingSec, mode, phase]);

  const handlePadPress = () => {
    if (phase === 'WAITING') {
      clearTimeout(waitTimerRef.current);
      const nextFalse = falseStarts + 1;
      setFalseStarts(nextFalse);
      setLastReaction({ type: 'FALSE_START' });
      setPhase('FEEDBACK');
      feedbackTimerRef.current = setTimeout(() => scheduleNextStimulus(trials, nextFalse), 900);
      return;
    }

    if (phase === 'STIMULUS') {
      const rt = Math.max(120, Math.round(performance.now() - stimulusStartRef.current));
      const nextTrials = [...trials, rt];
      setTrials(nextTrials);
      setLastReaction({ type: 'HIT', ms: rt });
      setPhase('FEEDBACK');
      feedbackTimerRef.current = setTimeout(() => scheduleNextStimulus(nextTrials, falseStarts), 750);
    }
  };

  const resetTest = () => {
    clearTimers();
    setPhase('IDLE');
    setTrials([]);
    setFalseStarts(0);
    setLastReaction(null);
    setRemainingSec(180);
  };

  const sessionMean =
    trials.length > 0 ? Math.round(trials.reduce((a, b) => a + b, 0) / trials.length) : null;

  return (
    <div className="card-surface-inner p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-200">Psychomotor Vigilance Test</span>

        <div className="inline-flex rounded-full bg-[#11151E] p-0.5 text-[11px]">
          <button
            type="button"
            disabled={phase !== 'IDLE' && phase !== 'COMPLETE'}
            onClick={() => setMode('SPRINT')}
            className={`rounded-full px-2.5 py-1 font-medium transition cursor-pointer disabled:opacity-50 ${
              mode === 'SPRINT' ? 'bg-[#252C3B] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5-Trial Quick
          </button>
          <button
            type="button"
            disabled={phase !== 'IDLE' && phase !== 'COMPLETE'}
            onClick={() => setMode('STANDARD')}
            className={`rounded-full px-2.5 py-1 font-medium transition cursor-pointer disabled:opacity-50 ${
              mode === 'STANDARD' ? 'bg-[#252C3B] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3-Min Standard
          </button>
        </div>
      </div>

      {phase === 'IDLE' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <div>
              Current mean: <span className="font-mono-num font-semibold text-white">{Math.round(currentPvtMs)} ms</span>{' '}
              (baseline {baselinePvtMs} ms)
            </div>
            {lastSession && (
              <div className="mt-0.5 text-[11px] text-slate-500">
                Last session: {lastSession.meanMs} ms · {lastSession.lapses} lapses
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={startTest}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            Start Test
          </button>
        </div>
      )}

      {(phase === 'WAITING' || phase === 'STIMULUS' || phase === 'FEEDBACK') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono-num text-[11px] text-slate-400">
            <span>Trial {Math.min(trials.length + 1, targetTrials)} / {targetTrials}</span>
            {mode === 'STANDARD' && (
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Timer className="h-3 w-3" />
                {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}
              </span>
            )}
            <span>False starts: {falseStarts}</span>
          </div>

          <button
            type="button"
            onPointerDown={handlePadPress}
            className={`flex min-h-[90px] w-full flex-col items-center justify-center rounded-2xl border p-4 text-center transition select-none cursor-pointer ${
              phase === 'STIMULUS'
                ? 'border-sky-300 bg-sky-500 text-slate-950'
                : phase === 'FEEDBACK' && lastReaction?.type === 'FALSE_START'
                ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                : 'border-white/10 bg-[#121620] text-slate-300'
            }`}
          >
            {phase === 'WAITING' && (
              <>
                <span className="text-sm font-medium text-slate-300">Wait for signal...</span>
                <span className="mt-1 text-[11px] text-slate-500">Tap as soon as this area turns blue</span>
              </>
            )}
            {phase === 'STIMULUS' && (
              <span className="text-xl font-bold tracking-tight">Tap Now</span>
            )}
            {phase === 'FEEDBACK' && lastReaction?.type === 'HIT' && (
              <span className="font-mono-num text-xl font-semibold text-emerald-300">{lastReaction.ms} ms</span>
            )}
            {phase === 'FEEDBACK' && lastReaction?.type === 'FALSE_START' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-300">
                <AlertTriangle className="h-4 w-4" /> Too early — wait for blue signal
              </span>
            )}
          </button>

          <div className="flex justify-end">
            <button type="button" onClick={resetTest} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'COMPLETE' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Saved to Sleep &amp; Focus
            </span>
            <button
              type="button"
              onClick={startTest}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-white hover:bg-white/[0.14] cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono-num">
            <div className="rounded-xl bg-[#121620] p-2">
              <div className="text-[10px] text-slate-400">Mean</div>
              <div className="text-sm font-semibold text-white">{sessionMean} ms</div>
            </div>
            <div className="rounded-xl bg-[#121620] p-2">
              <div className="text-[10px] text-slate-400">Fastest</div>
              <div className="text-sm font-semibold text-emerald-300">
                {trials.length ? Math.min(...trials) : '--'} ms
              </div>
            </div>
            <div className="rounded-xl bg-[#121620] p-2">
              <div className="text-[10px] text-slate-400">Lapses</div>
              <div className="text-sm font-semibold text-amber-300">
                {trials.filter((m) => m >= 500).length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
