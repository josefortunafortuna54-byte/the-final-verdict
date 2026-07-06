import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useRoundTimer } from "@/hooks/useRoundTimer";

interface RoundTimerProps {
  durationSeconds?: number;
  isActive?: boolean; // só mostra quando a batalha está activa
  onExpire?: () => void;
  className?: string;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const RoundTimer = ({
  durationSeconds = 120,
  isActive = true,
  onExpire,
  className,
}: RoundTimerProps) => {
  const { seconds, state, progress, isWarning, isDanger, start, pause, resume, reset } =
    useRoundTimer(durationSeconds, onExpire);

  if (!isActive) return null;

  const isRunning = state === "running";
  const isPaused = state === "paused";
  const isFinished = state === "finished";
  const isIdle = state === "idle";

  // Cor da barra e do tempo conforme urgência
  const colorClass = isDanger
    ? "text-red-500"
    : isWarning
    ? "text-yellow-400"
    : "text-primary";

  const barColorClass = isDanger
    ? "bg-red-500"
    : isWarning
    ? "bg-yellow-400"
    : "bg-primary";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="w-6 h-px bg-primary/40" />
        <Timer className="w-3 h-3 text-primary/60" />
        <span className="mono-label-sm text-primary/70">TEMPO DO ROUND</span>
        <span className="w-6 h-px bg-primary/40" />
      </div>

      {/* Main clock */}
      <div
        className={cn(
          "relative flex items-center justify-center w-36 h-16 border transition-all duration-300",
          isDanger && isRunning
            ? "border-red-500/80 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
            : isWarning && isRunning
            ? "border-yellow-400/60 bg-yellow-400/5"
            : isFinished
            ? "border-muted-foreground/30 bg-card/20"
            : "border-primary/30 bg-card/20"
        )}
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
      >
        {/* Corner ticks */}
        <span className="absolute top-1 left-1 w-2 h-2 border-l border-t border-primary/30" />
        <span className="absolute top-1 right-1 w-2 h-2 border-r border-t border-primary/30" />
        <span className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-primary/30" />
        <span className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-primary/30" />

        <span
          className={cn(
            "font-display text-3xl tabular-nums tracking-widest transition-colors duration-300",
            isFinished ? "text-muted-foreground/50" : colorClass,
            isDanger && isRunning && "animate-pulse"
          )}
        >
          {formatTime(seconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-36 h-1.5 bg-secondary/60 border border-border/40 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            barColorClass,
            isFinished && "opacity-20"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        {(isIdle || isFinished) && (
          <ControlButton
            onClick={start}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            label="INICIAR"
            variant="primary"
          />
        )}
        {isRunning && (
          <ControlButton
            onClick={pause}
            icon={<Pause className="w-3.5 h-3.5 fill-current" />}
            label="PAUSA"
            variant="default"
          />
        )}
        {isPaused && (
          <ControlButton
            onClick={resume}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            label="RETOMAR"
            variant="primary"
          />
        )}

        {/* Reset — sempre disponível excepto idle */}
        {!isIdle && (
          <ControlButton
            onClick={() => reset()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            label="RESET"
            variant="ghost"
          />
        )}
      </div>

      {/* Expired message */}
      {isFinished && (
        <span className="mono-label-sm text-red-400/80 animate-pulse">
          ⏰ TEMPO ESGOTADO
        </span>
      )}
    </div>
  );
};

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "primary" | "default" | "ghost";
}

const ControlButton = ({ onClick, icon, label, variant }: ControlButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 border transition-all duration-200 mono-label-sm",
      "hover:scale-105 active:scale-95",
      variant === "primary"
        ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
        : variant === "ghost"
        ? "border-border/40 bg-transparent text-muted-foreground/60 hover:text-primary/70 hover:border-primary/30"
        : "border-border/60 bg-card/30 text-muted-foreground hover:border-primary/40"
    )}
  >
    {icon}
    {label}
  </button>
);

export default RoundTimer;
