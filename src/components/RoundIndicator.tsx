import { cn } from "@/lib/utils";

interface RoundIndicatorProps {
  currentRound: number;
  totalRounds?: number;
  roundNames?: string[];
  className?: string;
}

const RoundIndicator = ({
  currentRound,
  totalRounds = 3,
  roundNames = ["BARRAS", "ENTREGA", "ARENA"],
  className,
}: RoundIndicatorProps) => {
  return (
    <div className={cn("text-center", className)}>
      {/* Editorial header with section markers */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="w-12 md:w-20 h-px bg-primary/40" />
        <span className="mono-label text-primary/80">PROTOCOLO DE COMBATE</span>
        <span className="w-12 md:w-20 h-px bg-primary/40" />
      </div>

      {/* Round chips */}
      <div className="flex items-center justify-center gap-3 md:gap-5 mb-5">
        {Array.from({ length: totalRounds }).map((_, index) => {
          const isActive = index + 1 === currentRound;
          const isPast = index + 1 < currentRound;
          return (
            <div key={index} className="flex items-center gap-3 md:gap-5">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-all duration-500",
                    isActive
                      ? "border-2 border-primary bg-primary/15 box-glow"
                      : isPast
                      ? "border border-primary/40 bg-primary/5"
                      : "border border-border/60 bg-card/40"
                  )}
                  style={isActive ? { clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" } : undefined}
                >
                  <span
                    className={cn(
                      "font-display text-2xl md:text-3xl leading-none",
                      isActive && "text-glow text-primary",
                      isPast && "text-primary/70",
                      !isActive && !isPast && "text-muted-foreground/50"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
                  )}
                </div>
                <span
                  className={cn(
                    "mono-label-sm transition-colors",
                    isActive ? "text-primary" : isPast ? "text-primary/50" : "text-muted-foreground/50"
                  )}
                >
                  {roundNames[index]}
                </span>
              </div>
              {index < totalRounds - 1 && (
                <div
                  className={cn(
                    "w-6 md:w-12 h-px transition-colors -mt-6",
                    isPast ? "bg-primary/60" : "bg-border/60"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="font-display text-base md:text-lg tracking-[0.3em] text-muted-foreground">
        EM CURSO ·{" "}
        <span className="text-primary text-glow">
          ROUND {String(currentRound).padStart(2, "0")} / {String(totalRounds).padStart(2, "0")}
        </span>
      </p>
    </div>
  );
};

export default RoundIndicator;
