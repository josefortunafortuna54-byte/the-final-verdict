import { useState } from "react";
import { cn } from "@/lib/utils";
import EnergyBar from "./EnergyBar";

interface GladiatorCardProps {
  name: string;
  side: "left" | "right";
  energy: number;
  avatarUrl?: string | null;
  isWinner?: boolean;
  showEnergy?: boolean;
  className?: string;
}

const GladiatorCard = ({
  name,
  side,
  energy,
  avatarUrl,
  isWinner = false,
  showEnergy = true,
  className,
}: GladiatorCardProps) => {
  const sideLabel = side === "left" ? "LADO A · 01" : "LADO B · 02";
  const [imgError, setImgError] = useState(false);
  const showImage = !!avatarUrl && !imgError;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-5 md:p-7 bg-card/30 backdrop-blur-[2px] border border-border/60 transition-all duration-500",
        isWinner ? "border-glow-intense bg-primary/5" : "hover:border-primary/40",
        className
      )}
    >
      {/* Top tag */}
      <div className="absolute -top-px left-0 right-0 flex items-center justify-between px-3 py-1 bg-background/80 border-b border-primary/20">
        <span className={cn("mono-label-sm", isWinner && "text-primary")}>{sideLabel}</span>
        <span className="mono-label-sm text-primary/70">●</span>
      </div>

      {/* Avatar */}
      <div
        className={cn(
          "relative w-32 h-32 md:w-44 md:h-44 mt-6 mb-5 flex items-center justify-center transition-all duration-500 overflow-hidden",
          isWinner
            ? "border-2 border-primary box-glow bg-primary/15"
            : "border border-border bg-gradient-to-br from-card to-background"
        )}
        style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
      >
        {/* Corner ticks */}
        <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-primary/40 z-10" />
        <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-primary/40 z-10" />
        <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-primary/40 z-10" />
        <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-primary/40 z-10" />

        {showImage ? (
          <>
            <img
              src={avatarUrl!}
              alt={name}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            {/* Overlay gradient — subtle vignette over photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent z-[1]" />
            {/* Scanline overlay */}
            <div className="absolute inset-0 scanlines opacity-30 z-[2]" />
            {/* Winner glow pulse */}
            {isWinner && (
              <div className="absolute inset-0 bg-primary/20 animate-pulse z-[3]" />
            )}
          </>
        ) : (
          <span
            className={cn(
              "text-7xl md:text-9xl font-display transition-colors select-none",
              isWinner ? "text-primary text-glow" : "text-muted-foreground/30"
            )}
          >
            {side === "left" ? "A" : "B"}
          </span>
        )}
      </div>

      {/* Name */}
      <h2
        className={cn(
          "font-display text-2xl md:text-4xl tracking-[0.15em] mb-3 transition-all duration-500 text-center leading-tight",
          isWinner ? "text-glow crack-text" : "text-foreground"
        )}
      >
        {name}
      </h2>

      {/* Energy */}
      <div className="w-full">
        {showEnergy ? (
          <EnergyBar value={energy} side={side} />
        ) : (
          <div className="h-8 flex items-center justify-center gap-2">
            <span className="mono-label-sm">SCORE</span>
            <span className="font-mono text-primary/70 tracking-[0.4em] animate-pulse">— — —</span>
          </div>
        )}
      </div>

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 animate-crack-reveal shadow-[0_0_20px_hsl(var(--arena-glow))]">
          <span className="font-display text-sm tracking-[0.4em] text-primary-foreground">◢ VENCEDOR ◣</span>
        </div>
      )}
    </div>
  );
};

export default GladiatorCard;
