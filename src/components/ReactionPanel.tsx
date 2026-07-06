import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  label: string;
  count: number;
}

interface ReactionPanelProps {
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
  isInteractive?: boolean;
  className?: string;
}

const defaultReactions: Reaction[] = [
  { emoji: "🔥", label: "FOGO",    count: 0 },
  { emoji: "❤️", label: "CORAÇÃO", count: 0 },
  { emoji: "⚡", label: "IMPACTO", count: 0 },
];

const ReactionPanel = ({
  reactions = defaultReactions,
  onReact,
  isInteractive = true,
  className,
}: ReactionPanelProps) => {
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});

  // Optimistic local bump — resets when real Firestore count arrives
  const [bumps, setBumps] = useState<Record<string, number>>({});

  // Reset bumps when Firestore counts update (they've caught up)
  useEffect(() => {
    setBumps({});
  }, [reactions]);

  const handleReaction = (emoji: string) => {
    if (cooldowns[emoji] || !isInteractive) return;

    // Cooldown to prevent spam
    setCooldowns((prev) => ({ ...prev, [emoji]: true }));
    setTimeout(() => setCooldowns((prev) => ({ ...prev, [emoji]: false })), 1000);

    // Optimistic bump — will be overwritten by next Firestore update
    setBumps((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));

    onReact?.(emoji);
  };

  // Displayed count = Firestore count + local optimistic bump
  const displayCount = (r: Reaction) => r.count + (bumps[r.emoji] ?? 0);

  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-px bg-primary/40" />
        <span className="mono-label text-primary/80">REAÇÕES AO VIVO</span>
        <span className="w-10 h-px bg-primary/40" />
      </div>

      <div className="flex gap-6 md:gap-8">
        {reactions.map((reaction) => (
          <div key={reaction.emoji} className="flex flex-col items-center gap-2">
            {isInteractive ? (
              <Button
                variant="reaction"
                size="reaction"
                onClick={() => handleReaction(reaction.emoji)}
                disabled={!!cooldowns[reaction.emoji]}
                className={cn(
                  "transition-all duration-150",
                  cooldowns[reaction.emoji]
                    ? "opacity-50 cursor-not-allowed scale-95"
                    : "hover:scale-110 active:scale-95"
                )}
              >
                {reaction.emoji}
              </Button>
            ) : (
              <div className="h-16 w-16 flex items-center justify-center text-4xl bg-card/60 border border-border/60 rounded-sm">
                {reaction.emoji}
              </div>
            )}

            {/* Count — synced with Firestore, optimistically bumped */}
            <span
              className={cn(
                "font-display text-2xl text-primary text-glow leading-none tabular-nums transition-all duration-300",
                bumps[reaction.emoji] ? "scale-110" : "scale-100"
              )}
            >
              {String(displayCount(reaction)).padStart(3, "0")}
            </span>
            <span className="mono-label-sm">{reaction.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReactionPanel;
