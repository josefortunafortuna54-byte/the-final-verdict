import { useState, useEffect, useCallback, useRef } from "react";

export type TimerState = "idle" | "running" | "paused" | "finished";

export interface UseRoundTimerReturn {
  seconds: number;
  totalSeconds: number;
  state: TimerState;
  progress: number; // 0-100, decreasing
  isWarning: boolean; // last 30s
  isDanger: boolean; // last 10s
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (duration?: number) => void;
}

const DEFAULT_DURATION = 120; // 2 minutos por round

export const useRoundTimer = (
  durationSeconds: number = DEFAULT_DURATION,
  onExpire?: () => void
): UseRoundTimerReturn => {
  const [seconds, setSeconds] = useState(durationSeconds);
  const [state, setState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Manter callback actualizado sem re-criar o intervalo
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setSeconds(durationSeconds);
    setState("running");
  }, [durationSeconds, clearTimer]);

  const pause = useCallback(() => {
    if (state !== "running") return;
    clearTimer();
    setState("paused");
  }, [state, clearTimer]);

  const resume = useCallback(() => {
    if (state !== "paused") return;
    setState("running");
  }, [state]);

  const reset = useCallback((duration?: number) => {
    clearTimer();
    setSeconds(duration ?? durationSeconds);
    setState("idle");
  }, [durationSeconds, clearTimer]);

  // Tick
  useEffect(() => {
    if (state !== "running") return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          setState("finished");
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [state, clearTimer]);

  // Reset quando muda de round (durationSeconds muda)
  useEffect(() => {
    clearTimer();
    setSeconds(durationSeconds);
    setState("idle");
  }, [durationSeconds, clearTimer]);

  const progress = Math.round((seconds / durationSeconds) * 100);
  const isWarning = seconds <= 30 && seconds > 10;
  const isDanger = seconds <= 10;

  return { seconds, totalSeconds: durationSeconds, state, progress, isWarning, isDanger, start, pause, resume, reset };
};
