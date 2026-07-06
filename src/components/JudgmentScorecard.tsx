import { CRITERIA, BattleScorecard } from "@/lib/battleScoring";
import { cn } from "@/lib/utils";

interface JudgmentScorecardProps {
  scorecard: BattleScorecard;
  gladiatorAName: string;
  gladiatorBName: string;
  visibleRounds?: number; // 1, 2 or 3 — for staged reveal
}

const JudgmentScorecard = ({
  scorecard,
  gladiatorAName,
  gladiatorBName,
  visibleRounds = 3,
}: JudgmentScorecardProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-4">
        <span className="mono-label text-primary/80">— ANÁLISE TÉCNICA DA IA —</span>
        <p className="font-display text-2xl md:text-3xl tracking-[0.25em] text-glow mt-2">
          PONTUAÇÃO POR RONDA
        </p>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1.4fr_repeat(5,1fr)_1fr] gap-1 md:gap-2 mb-2 px-2">
        <span className="mono-label-sm text-primary/70 truncate">GLADIADOR</span>
        {CRITERIA.map((c) => (
          <span key={c.key} className="mono-label-sm text-primary/70 text-center truncate">
            {c.label}
          </span>
        ))}
        <span className="mono-label-sm text-primary text-center">TOTAL</span>
      </div>

      {scorecard.rounds.slice(0, visibleRounds).map((r, idx) => (
        <div
          key={r.round}
          className="mb-3 border border-primary/30 bg-card/40 backdrop-blur-sm animate-fade-up"
          style={{ animationDelay: `${idx * 200}ms` }}
        >
          <div className="flex items-center justify-between px-3 py-1 border-b border-primary/20 bg-primary/5">
            <span className="mono-label text-primary">RONDA {r.round}</span>
            <span className="mono-label-sm text-muted-foreground">
              {r.totalA > r.totalB ? "▲ A" : r.totalA < r.totalB ? "▼ B" : "= EMPATE"}
            </span>
          </div>

          {/* Gladiator A row */}
          <ScoreRow
            name={gladiatorAName}
            scores={r.a}
            total={r.totalA}
            winning={r.totalA >= r.totalB}
          />
          {/* Gladiator B row */}
          <ScoreRow
            name={gladiatorBName}
            scores={r.b}
            total={r.totalB}
            winning={r.totalB > r.totalA}
          />
        </div>
      ))}

      {visibleRounds >= 3 && (
        <div className="mt-4 border-t-2 border-primary/40 pt-3 grid grid-cols-2 gap-3 text-center animate-fade-up">
          <div
            className={cn(
              "p-3 border",
              scorecard.winnerSide === "A"
                ? "border-primary text-glow"
                : "border-primary/20 text-muted-foreground"
            )}
          >
            <span className="mono-label-sm block">{gladiatorAName}</span>
            <span className="font-display text-3xl">{scorecard.finalA}</span>
          </div>
          <div
            className={cn(
              "p-3 border",
              scorecard.winnerSide === "B"
                ? "border-primary text-glow"
                : "border-primary/20 text-muted-foreground"
            )}
          >
            <span className="mono-label-sm block">{gladiatorBName}</span>
            <span className="font-display text-3xl">{scorecard.finalB}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreRow = ({
  name,
  scores,
  total,
  winning,
}: {
  name: string;
  scores: Record<string, number>;
  total: number;
  winning: boolean;
}) => (
  <div
    className={cn(
      "grid grid-cols-[1.4fr_repeat(5,1fr)_1fr] gap-1 md:gap-2 items-center px-2 py-2",
      winning ? "bg-primary/10" : ""
    )}
  >
    <span
      className={cn(
        "font-display text-sm md:text-base tracking-wider truncate",
        winning ? "text-primary text-glow" : "text-foreground"
      )}
    >
      {name}
    </span>
    {CRITERIA.map((c) => (
      <span
        key={c.key}
        className={cn(
          "font-mono text-sm text-center",
          winning ? "text-primary" : "text-muted-foreground"
        )}
      >
        {scores[c.key]}
      </span>
    ))}
    <span
      className={cn(
        "font-display text-base md:text-lg text-center",
        winning ? "text-primary text-glow" : "text-muted-foreground"
      )}
    >
      {total}
    </span>
  </div>
);

export default JudgmentScorecard;