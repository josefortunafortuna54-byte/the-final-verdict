import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBattleHistory } from "@/hooks/useBattleHistory";
import { Trophy, Flame, Heart, Zap, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import JudgmentScorecard from "./JudgmentScorecard";

interface BattleHistoryProps {
  className?: string;
}

const BattleHistory = ({ className }: BattleHistoryProps) => {
  const { history, loading } = useBattleHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <p className="text-muted-foreground text-sm">Nenhuma batalha registrada ainda</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg tracking-wider text-primary flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        HISTÓRICO DE BATALHAS
      </h3>
      
      <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {history.map((battle) => (
          <div
            key={battle.id}
            className="bg-card/50 border border-border/50 rounded-sm p-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-primary" />
                <span className="font-display text-sm tracking-wider text-glow">
                  {battle.winner}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="w-3 h-3" />
                {format(new Date(battle.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{battle.gladiator_a_name}</span>
              <span className="text-primary">VS</span>
              <span>{battle.gladiator_b_name}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                battle.winner === battle.gladiator_a_name ? "text-primary" : "text-muted-foreground"
              )}>
                {battle.gladiator_a_final_energy}%
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {battle.fire_reactions}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  {battle.heart_reactions}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {battle.impact_reactions}
                </span>
              </div>
              <span className={cn(
                battle.winner === battle.gladiator_b_name ? "text-primary" : "text-muted-foreground"
              )}>
                {battle.gladiator_b_final_energy}%
              </span>
            </div>

              {battle.scorecard && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === battle.id ? null : battle.id)
                    }
                    className="mt-3 w-full flex items-center justify-center gap-1 text-xs mono-label-sm text-primary/80 hover:text-primary border-t border-border/40 pt-2"
                  >
                    {expandedId === battle.id ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> OCULTAR PONTUAÇÃO
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> VER PONTUAÇÃO COMPLETA
                      </>
                    )}
                  </button>
                  {expandedId === battle.id && (
                    <div className="mt-3 -mx-3 px-1 py-2 bg-background/40 border-t border-border/40">
                      <JudgmentScorecard
                        scorecard={battle.scorecard}
                        gladiatorAName={battle.gladiator_a_name}
                        gladiatorBName={battle.gladiator_b_name}
                        visibleRounds={3}
                      />
                    </div>
                  )}
                </>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleHistory;
