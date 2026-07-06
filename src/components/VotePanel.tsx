import { cn } from "@/lib/utils";
import { Users, Check } from "lucide-react";
import type { VoteCounts } from "@/hooks/useVotes";

interface VotePanelProps {
  votes: VoteCounts;
  gladiatorAName: string;
  gladiatorBName: string;
  hasVoted?: boolean;
  votedSide?: "a" | "b" | null;
  isVoting?: boolean;
  onCastVote?: (side: "a" | "b") => void;
  className?: string;
}

const VotePanel = ({
  votes,
  gladiatorAName,
  gladiatorBName,
  hasVoted = false,
  votedSide = null,
  isVoting = false,
  onCastVote,
  className,
}: VotePanelProps) => {
  const leadingSide = votes.a > votes.b ? "a" : votes.b > votes.a ? "b" : null;

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="w-8 h-px bg-primary/40" />
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-primary/70" />
          <span className="mono-label text-primary/80">VOTOS DO PÚBLICO</span>
        </div>
        <span className="w-8 h-px bg-primary/40" />
        <span className="mono-label-sm text-muted-foreground/60">
          {votes.total} {votes.total === 1 ? "VOTO" : "VOTOS"}
        </span>
      </div>

      {/* Names row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-display text-sm tracking-wider truncate max-w-[120px] transition-colors",
              leadingSide === "a" ? "text-primary text-glow" : "text-muted-foreground"
            )}
          >
            {gladiatorAName}
          </span>
          {leadingSide === "a" && (
            <span className="mono-label-sm text-primary animate-pulse">▲</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {leadingSide === "b" && (
            <span className="mono-label-sm text-primary animate-pulse">▲</span>
          )}
          <span
            className={cn(
              "font-display text-sm tracking-wider truncate max-w-[120px] transition-colors text-right",
              leadingSide === "b" ? "text-primary text-glow" : "text-muted-foreground"
            )}
          >
            {gladiatorBName}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-5 bg-secondary/60 border border-border/40 overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-700 ease-out",
            leadingSide === "a"
              ? "bg-gradient-to-r from-primary to-primary/70"
              : "bg-gradient-to-r from-primary/50 to-primary/30"
          )}
          style={{ width: `${votes.percentA}%` }}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full transition-all duration-700 ease-out",
            leadingSide === "b"
              ? "bg-gradient-to-l from-primary to-primary/70"
              : "bg-gradient-to-l from-primary/50 to-primary/30"
          )}
          style={{ width: `${votes.percentB}%` }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-background/60 z-10" />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 mono-label-sm text-foreground z-20">
          {votes.percentA}%
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 mono-label-sm text-foreground z-20">
          {votes.percentB}%
        </span>
      </div>

      {/* Raw count row */}
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="mono-label-sm text-muted-foreground/50">{votes.a} votos</span>
        <span className="mono-label-sm text-muted-foreground/50">{votes.b} votos</span>
      </div>

      {/* Voting buttons */}
      {onCastVote && (
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => onCastVote("a")}
            disabled={hasVoted || isVoting}
            className={cn(
              "flex-1 py-2 border font-display text-sm tracking-wider transition-all",
              hasVoted && votedSide === "a"
                ? "border-primary bg-primary/20 text-primary"
                : hasVoted
                ? "border-border/20 text-muted-foreground/30 cursor-not-allowed"
                : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 active:scale-95"
            )}
          >
            {hasVoted && votedSide === "a" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> VOTOU
              </span>
            ) : (
              gladiatorAName
            )}
          </button>
          <button
            onClick={() => onCastVote("b")}
            disabled={hasVoted || isVoting}
            className={cn(
              "flex-1 py-2 border font-display text-sm tracking-wider transition-all",
              hasVoted && votedSide === "b"
                ? "border-primary bg-primary/20 text-primary"
                : hasVoted
                ? "border-border/20 text-muted-foreground/30 cursor-not-allowed"
                : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 active:scale-95"
            )}
          >
            {hasVoted && votedSide === "b" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> VOTOU
              </span>
            ) : (
              gladiatorBName
            )}
          </button>
        </div>
      )}

      {isVoting && (
        <p className="text-center mono-label-sm text-muted-foreground/50 mt-2 animate-pulse">
          A REGISTAR VOTO...
        </p>
      )}
    </div>
  );
};

export default VotePanel;
