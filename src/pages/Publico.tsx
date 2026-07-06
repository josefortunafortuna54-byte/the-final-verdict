import { useState } from "react";
import { useBattle } from "@/hooks/useBattle";
import { useVotes } from "@/hooks/useVotes";
import { useGladiators } from "@/hooks/useGladiators";
import { useNotifications, useBattleNotifications } from "@/hooks/useNotifications";
import { NotificationContainer, NotificationPermissionBtn } from "@/components/NotificationToast";
import { cn } from "@/lib/utils";
import { Flame, Heart, Zap, Radio, Trophy, CheckCircle2 } from "lucide-react";

const Publico = () => {
  const { battle, reactionCounts, loading, sendReaction } = useBattle();
  const { votes, hasVoted, votedSide, isVoting, castVote } = useVotes(battle?.id);
  const { gladiators } = useGladiators();
  const { notifications, permission, push, dismiss, requestPermission } = useNotifications();
  const [activeTab, setActiveTab] = useState<"arena" | "ranking">("arena");
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});
  const [pulseEffects, setPulseEffects] = useState<Record<string, boolean>>({});

  // Observa mudanças de estado da batalha e dispara notificações
  useBattleNotifications(battle, push);

  const handleReaction = async (emoji: string, type: string) => {
    if (cooldowns[emoji] || !battle || battle.status !== "active") return;
    setCooldowns((prev) => ({ ...prev, [emoji]: true }));
    setPulseEffects((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => setPulseEffects((prev) => ({ ...prev, [type]: false })), 300);
    setTimeout(() => setCooldowns((prev) => ({ ...prev, [emoji]: false })), 1000);
    await sendReaction(emoji);
  };

  const isActive   = battle?.status === "active";
  const isJudging  = battle?.status === "judging";
  const isFinished = battle?.status === "finished";
  const isRound3   = battle?.current_round === 3;
  const canReact   = isRound3 && isActive;
  const canVote    = isActive && !hasVoted;
  const leadingSide = votes.a > votes.b ? "a" : votes.b > votes.a ? "b" : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-display text-xl text-primary animate-pulse-glow">CONECTANDO À ARENA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Notifications overlay */}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />

      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-primary rounded-full animate-fire-particle"
            style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 2}s` }} />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 text-center border-b border-border/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Radio className={cn("w-4 h-4", isActive ? "text-primary animate-pulse" : "text-muted-foreground")} />
          <span className="font-display text-sm tracking-widest text-muted-foreground">
            {isActive ? "AO VIVO" : isJudging ? "JULGANDO..." : isFinished ? "FINALIZADO" : "EM PAUSA"}
          </span>
        </div>
        <h1 className="font-display text-3xl text-glow tracking-wider">ARENA VERBAL</h1>
        {battle && (
          <p className="text-muted-foreground text-sm mt-1 font-body">
            ROUND {battle.current_round} • {battle.gladiator_a_name} VS {battle.gladiator_b_name}
          </p>
        )}
      </header>

      {/* Status banners */}
      {isJudging && (
        <div className="bg-primary/20 py-4 px-4 text-center border-b border-primary/30">
          <p className="text-lg text-primary font-display tracking-wider animate-pulse">⚖️ A IA ESTÁ JULGANDO...</p>
        </div>
      )}
      {isFinished && battle?.winner && (
        <div className="bg-primary/30 py-6 px-4 text-center border-b border-primary/50">
          <p className="text-sm text-muted-foreground mb-1">VENCEDOR</p>
          <p className="text-3xl font-display text-primary text-glow tracking-wider">🏆 {battle.winner}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border/30 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => setActiveTab("arena")}
          className={cn("flex-1 py-2.5 mono-label-sm transition-all border-b-2",
            activeTab === "arena" ? "border-primary text-primary" : "border-transparent text-muted-foreground/50 hover:text-primary/70")}>
          🎤 ARENA
        </button>
        <button onClick={() => setActiveTab("ranking")}
          className={cn("flex-1 py-2.5 mono-label-sm transition-all border-b-2",
            activeTab === "ranking" ? "border-primary text-primary" : "border-transparent text-muted-foreground/50 hover:text-primary/70")}>
          🏆 RANKING
        </button>
      </div>

      {/* ARENA TAB */}
      {activeTab === "arena" && (
        <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-sm mx-auto w-full">

          {/* Notificações — pede permissão */}
          <NotificationPermissionBtn
            permission={permission}
            onRequest={requestPermission}
          />

          {/* VOTAÇÃO */}
          <section className="w-full">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="mono-label text-primary/80">VOTA NO VENCEDOR</span>
              <span className="w-8 h-px bg-primary/40" />
            </div>

            {battle && (
              <div className="grid grid-cols-2 gap-3">
                <VoteButton side="a" name={battle.gladiator_a_name} percent={votes.percentA} count={votes.a}
                  canVote={canVote} hasVoted={hasVoted} votedSide={votedSide} isVoting={isVoting}
                  isLeading={leadingSide === "a"} isFinished={isFinished} winner={battle.winner} onVote={() => castVote("a")} />
                <VoteButton side="b" name={battle.gladiator_b_name} percent={votes.percentB} count={votes.b}
                  canVote={canVote} hasVoted={hasVoted} votedSide={votedSide} isVoting={isVoting}
                  isLeading={leadingSide === "b"} isFinished={isFinished} winner={battle.winner} onVote={() => castVote("b")} />
              </div>
            )}

            {hasVoted && !isFinished && (
              <div className="mt-3 flex items-center justify-center gap-2 py-2 border border-primary/20 bg-primary/5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="mono-label-sm text-primary/80">
                  VOTASTE EM {votedSide === "a" ? battle?.gladiator_a_name : battle?.gladiator_b_name}
                </span>
              </div>
            )}

            {votes.total > 0 && (
              <div className="mt-4">
                <div className="relative h-4 bg-secondary/60 border border-border/40 overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                    style={{ width: `${votes.percentA}%` }} />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-background/60 z-10" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 mono-label-sm text-foreground z-20">{votes.percentA}%</span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 mono-label-sm text-foreground z-20">{votes.percentB}%</span>
                </div>
                <p className="text-center mono-label-sm text-muted-foreground/50 mt-1">
                  {votes.total} {votes.total === 1 ? "VOTO" : "VOTOS"} REGISTADOS
                </p>
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="w-full flex items-center gap-3">
            <span className="flex-1 h-px bg-border/40" />
            <span className="mono-label-sm text-muted-foreground/40">REAÇÕES AO VIVO</span>
            <span className="flex-1 h-px bg-border/40" />
          </div>

          {/* REAÇÕES */}
          <section className="w-full">
            {!canReact && isActive && (
              <p className="text-center text-sm text-muted-foreground mb-3 font-body">
                ⏳ Reações ativam no <span className="text-primary font-semibold">ROUND 3</span>
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <ReactionButton emoji="🔥" icon={<Flame className="w-8 h-8" />} label="FOGO"
                count={reactionCounts.fire} canReact={canReact} hasCooldown={!!cooldowns["🔥"]} hasPulse={!!pulseEffects["fire"]}
                colorClass="from-primary/20 to-primary/5 border-primary/50 hover:border-primary" iconClass="text-primary" countClass="text-primary"
                onReact={() => handleReaction("🔥", "fire")} />
              <ReactionButton emoji="❤️" icon={<Heart className="w-8 h-8 fill-current" />} label="CORAÇÃO"
                count={reactionCounts.heart} canReact={canReact} hasCooldown={!!cooldowns["❤️"]} hasPulse={!!pulseEffects["heart"]}
                colorClass="from-blood-light/20 to-blood-dark/5 border-blood-light/50 hover:border-blood-light" iconClass="text-blood-light" countClass="text-blood-light"
                onReact={() => handleReaction("❤️", "heart")} />
              <ReactionButton emoji="⚡" icon={<Zap className="w-8 h-8 fill-yellow-500" />} label="IMPACTO"
                count={reactionCounts.impact} canReact={canReact} hasCooldown={!!cooldowns["⚡"]} hasPulse={!!pulseEffects["impact"]}
                colorClass="from-yellow-500/20 to-yellow-600/5 border-yellow-500/50 hover:border-yellow-500" iconClass="text-yellow-500" countClass="text-yellow-500"
                onReact={() => handleReaction("⚡", "impact")} />
            </div>
          </section>

          {/* ENERGIA */}
          {battle && (
            <section className="w-full space-y-3 mt-2">
              {[
                { name: battle.gladiator_a_name, energy: battle.gladiator_a_energy },
                { name: battle.gladiator_b_name, energy: battle.gladiator_b_energy },
              ].map(({ name, energy }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-display text-xs w-24 truncate">{name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500" style={{ width: `${energy}%` }} />
                  </div>
                  <span className="font-display text-xs text-primary w-8">{energy}%</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {/* RANKING TAB */}
      {activeTab === "ranking" && (
        <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-primary/40" />
            <span className="mono-label text-primary/80">RANKING GERAL</span>
            <span className="w-8 h-px bg-primary/40" />
          </div>

          {gladiators.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Trophy className="w-10 h-10 text-muted-foreground/20" />
              <p className="font-display text-lg text-muted-foreground/40 tracking-wider">SEM DADOS</p>
              <p className="text-sm text-muted-foreground/30 font-body text-center">Cadastra gladiadores em Base de Dados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gladiators.map((g, i) => (
                <div key={g.id} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border transition-colors",
                  i === 0 ? "border-primary/40 bg-primary/5" : "border-border/25"
                )}>
                  <span className={cn("font-display text-base w-7 text-center shrink-0",
                    i === 0 ? "text-primary text-glow" : i === 1 ? "text-yellow-400/70" : i === 2 ? "text-orange-400/60" : "text-muted-foreground/30")}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <div className="w-9 h-9 shrink-0 border border-border/40 bg-card/30 flex items-center justify-center overflow-hidden relative"
                    style={{ clipPath: "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)" }}>
                    {g.avatarUrl
                      ? <img src={g.avatarUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                      : <span className="font-display text-sm text-muted-foreground/25">{g.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-display text-sm tracking-wider truncate", i === 0 && "text-primary")}>{g.name}</p>
                    {g.alias && <p className="text-xs text-muted-foreground/35 truncate">{g.alias}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-sm text-primary">
                      {g.wins}<span className="text-muted-foreground/40 text-xs">V</span>
                      {" "}{g.losses}<span className="text-muted-foreground/40 text-xs">D</span>
                    </p>
                    <p className="mono-label-sm text-muted-foreground/40">{g.winRate}% WIN</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="p-4 text-center border-t border-border/20">
        <p className="text-xs text-muted-foreground/60 font-body">ARENA VERBAL • JULGAMENTO DIGITAL</p>
      </footer>
    </div>
  );
};

/* ── Sub-components ── */

interface VoteButtonProps {
  side: "a" | "b"; name: string; percent: number; count: number;
  canVote: boolean; hasVoted: boolean; votedSide: "a" | "b" | null;
  isVoting: boolean; isLeading: boolean; isFinished: boolean;
  winner: string | null; onVote: () => void;
}

const VoteButton = ({ side, name, percent, count, canVote, hasVoted, votedSide, isVoting, isLeading, isFinished, winner, onVote }: VoteButtonProps) => {
  const isMyVote = votedSide === side;
  const isWinner = isFinished && winner === name;
  return (
    <button onClick={onVote} disabled={!canVote || isVoting}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 h-32 border-2 transition-all duration-300 overflow-hidden touch-manipulation active:scale-95",
        isWinner ? "border-primary bg-primary/20 shadow-[0_0_20px_hsl(var(--arena-glow)/0.4)]"
          : isMyVote ? "border-primary/80 bg-primary/10"
          : isLeading && hasVoted ? "border-primary/40 bg-primary/5"
          : canVote ? "border-border/50 bg-card/30 hover:border-primary/60 hover:bg-primary/5"
          : "border-border/30 bg-card/20 opacity-70 cursor-not-allowed"
      )}>
      {hasVoted && <div className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all duration-700" style={{ height: `${percent}%` }} />}
      {isWinner && <Trophy className="absolute top-2 right-2 w-4 h-4 text-primary animate-pulse-glow" />}
      {isMyVote && !isWinner && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary/70" />}
      <span className={cn("font-display text-xl tracking-wider relative z-10 px-2 text-center leading-tight",
        isWinner ? "text-primary text-glow" : isMyVote ? "text-primary/90" : "text-foreground")}>
        {name}
      </span>
      {hasVoted
        ? <span className={cn("font-display text-2xl relative z-10", isLeading ? "text-primary text-glow" : "text-muted-foreground")}>{percent}%</span>
        : canVote ? <span className="mono-label-sm text-muted-foreground/60 relative z-10">VOTAR</span>
        : null}
      {hasVoted && <span className="mono-label-sm text-muted-foreground/50 relative z-10">{count} {count === 1 ? "voto" : "votos"}</span>}
    </button>
  );
};

interface ReactionButtonProps {
  emoji: string; icon: React.ReactNode; label: string; count: number;
  canReact: boolean; hasCooldown: boolean; hasPulse: boolean;
  colorClass: string; iconClass: string; countClass: string; onReact: () => void;
}

const ReactionButton = ({ icon, label, count, canReact, hasCooldown, hasPulse, colorClass, iconClass, countClass, onReact }: ReactionButtonProps) => (
  <button onClick={onReact} disabled={!canReact || hasCooldown}
    className={cn(
      "relative group h-24 rounded-xl transition-all duration-300 border-2 flex flex-col items-center justify-center gap-1 active:scale-95 touch-manipulation",
      canReact ? `bg-gradient-to-br ${colorClass}` : "bg-secondary/30 border-border/30 opacity-50 cursor-not-allowed",
      hasCooldown && "opacity-50 cursor-not-allowed",
      hasPulse && "scale-110"
    )}>
    <span className={cn("transition-all", canReact ? iconClass + " group-hover:scale-110" : "text-muted-foreground")}>{icon}</span>
    <span className="font-display text-xs tracking-wider text-foreground">{label}</span>
    <span className={cn("absolute top-1 right-2 font-display text-sm", canReact ? countClass : "text-muted-foreground/50")}>{count}</span>
  </button>
);

export default Publico;
