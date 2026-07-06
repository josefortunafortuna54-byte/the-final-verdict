import { useParams, useNavigate } from "react-router-dom";
import { useGladiatorProfile } from "@/hooks/useGladiatorProfile";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Trophy, Flame, Heart, Zap,
  TrendingUp, Swords, Star, Target, Loader2,
  CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Cell,
} from "recharts";

const C_PRIMARY = "hsl(0 80% 55%)";
const C_DIM     = "hsl(0 30% 35%)";

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/95 border border-primary/30 px-3 py-2 text-xs font-mono shadow-lg">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? C_PRIMARY }}>
          {p.name}: <span className="text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const GladiadorPerfil = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { profile, loading, error } = useGladiatorProfile(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-display text-xl text-primary animate-pulse-glow">A CARREGAR PERFIL...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Swords className="w-16 h-16 text-muted-foreground/30" />
          <p className="font-display text-2xl text-muted-foreground/50">{error ?? "GLADIADOR NÃO ENCONTRADO"}</p>
          <Button variant="arena" size="sm" onClick={() => navigate("/base-dados")}>VOLTAR</Button>
        </div>
      </div>
    );
  }

  const { gladiator, battles, longestWinStreak, avgReactionsPerBattle,
          bestCriteria, worstCriteria, winsVsTop, reactionBreakdown } = profile;

  // Radar data — scorecard médio por critério
  const criteria = ["rimas", "punchlines", "flow", "criatividade", "agressividade"];
  const radarData = (() => {
    const withCard = battles.filter((b) => b.scorecard);
    if (!withCard.length) return [];
    return criteria.map((key) => {
      let sum = 0, count = 0;
      withCard.forEach((b) => {
        const isA = b.gladiator_a_name.toUpperCase() === gladiator.name.toUpperCase();
        b.scorecard!.rounds.forEach((r) => {
          sum += isA ? (r.a[key as keyof typeof r.a] ?? 0) : (r.b[key as keyof typeof r.b] ?? 0);
          count++;
        });
      });
      return { criterion: key.toUpperCase(), média: count ? Math.round((sum / count) * 10) / 10 : 0 };
    });
  })();

  // H2H chart data
  const h2hData = winsVsTop.map((r) => ({
    name:    r.opponent.length > 10 ? r.opponent.slice(0, 9) + "…" : r.opponent,
    vitórias: r.wins,
    derrotas: r.losses,
  }));

  // Win/loss streak timeline (últimas 10)
  const timeline = battles.slice(0, 10).map((b) => ({
    won: b.winner.toUpperCase() === gladiator.name.toUpperCase(),
    vs:  b.gladiator_a_name.toUpperCase() === gladiator.name.toUpperCase()
      ? b.gladiator_b_name : b.gladiator_a_name,
    date: b.created_at,
    reactions: b.total_reactions,
    id:  b.id,
  }));

  return (
    <div className="min-h-screen bg-background scanlines">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-primary/15 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/base-dados")} className="gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          <span className="mono-label-sm hidden sm:inline">BASE DE DADOS</span>
        </Button>
        <div className="flex items-center gap-3">
          <span className="w-6 h-px bg-primary/40" />
          <span className="mono-label text-primary/70">PERFIL</span>
          <span className="w-6 h-px bg-primary/40" />
        </div>
        <span className="mono-label-sm text-muted-foreground/50">{battles.length} BATALHAS</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* ── HERO ── */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className={cn(
            "w-32 h-32 md:w-40 md:h-40 shrink-0 border-2 flex items-center justify-center overflow-hidden relative",
            gladiator.wins > 0 ? "border-primary bg-primary/10" : "border-border/50 bg-card/30"
          )}
            style={{ clipPath: "polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)" }}>
            {/* Corner ticks */}
            <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-primary/50 z-10" />
            <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-primary/50 z-10" />
            <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-primary/50 z-10" />
            <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-primary/50 z-10" />
            {gladiator.avatarUrl ? (
              <>
                <img src={gladiator.avatarUrl} alt={gladiator.name}
                  className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                <div className="absolute inset-0 scanlines opacity-20" />
              </>
            ) : (
              <span className="font-display text-6xl text-muted-foreground/20">{gladiator.name[0]}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <p className="mono-label text-primary/70 mb-1">GLADIADOR</p>
            <h1 className="font-display text-4xl md:text-6xl tracking-[0.15em] text-glow mb-1">
              {gladiator.name}
            </h1>
            {gladiator.alias && (
              <p className="font-body text-muted-foreground/60 text-sm mb-4 italic">"{gladiator.alias}"</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
              <StatBadge label="VITÓRIAS"  value={gladiator.wins}      color="primary" />
              <StatBadge label="DERROTAS"  value={gladiator.losses}    color="muted" />
              <StatBadge label="WIN RATE"  value={`${gladiator.winRate}%`} color={gladiator.winRate >= 50 ? "primary" : "muted"} />
              <StatBadge label="BATALHAS"  value={gladiator.totalBattles} color="muted" />
              <StatBadge label="REAÇÕES"   value={gladiator.totalReactions} color="muted" />
            </div>
          </div>
        </section>

        {/* ── KPIs rápidos ── */}
        <section>
          <SectionLabel>DESTAQUES</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <KpiCard
              label="MAIOR SÉRIE"
              value={longestWinStreak}
              sub="vitórias seguidas"
              icon={<TrendingUp className="w-4 h-4" />}
              highlight={longestWinStreak >= 3}
            />
            <KpiCard
              label="MÉDIA REAÇÕES"
              value={avgReactionsPerBattle}
              sub="por batalha"
              icon={<Flame className="w-4 h-4" />}
            />
            <KpiCard
              label="MELHOR CRITÉRIO"
              value={bestCriteria ? bestCriteria.toUpperCase() : "—"}
              sub="no scorecard"
              icon={<Star className="w-4 h-4" />}
              isText
              highlight={!!bestCriteria}
            />
            <KpiCard
              label="A MELHORAR"
              value={worstCriteria ? worstCriteria.toUpperCase() : "—"}
              sub="pior critério"
              icon={<Target className="w-4 h-4" />}
              isText
            />
          </div>
        </section>

        {/* ── Radar + H2H ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {radarData.length > 0 && (
            <section>
              <SectionLabel>PERFIL TÉCNICO</SectionLabel>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                    <PolarGrid stroke="hsl(0 0% 20%)" />
                    <PolarAngleAxis dataKey="criterion"
                      tick={{ fill: "hsl(0 0% 55%)", fontSize: 9, fontFamily: "var(--font-display)" }} />
                    <Radar name="Média" dataKey="média" stroke={C_PRIMARY} fill={C_PRIMARY} fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {h2hData.length > 0 && (
            <section>
              <SectionLabel>CONFRONTO DIRECTO</SectionLabel>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={h2hData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(0 0% 40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 80% 55% / 0.05)" }} />
                    <Bar dataKey="vitórias" name="Vitórias" fill={C_PRIMARY}   radius={[2,2,0,0]} />
                    <Bar dataKey="derrotas" name="Derrotas" fill={C_DIM}       radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {/* ── Reações breakdown ── */}
        {gladiator.totalReactions > 0 && (
          <section>
            <SectionLabel>REAÇÕES DO PÚBLICO</SectionLabel>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "FOGO 🔥",    value: reactionBreakdown.fire,   pct: Math.round(reactionBreakdown.fire   / gladiator.totalReactions * 100), color: "from-primary/20 border-primary/40" },
                { label: "CORAÇÃO ❤️", value: reactionBreakdown.heart,  pct: Math.round(reactionBreakdown.heart  / gladiator.totalReactions * 100), color: "from-red-500/20 border-red-500/40" },
                { label: "IMPACTO ⚡", value: reactionBreakdown.impact, pct: Math.round(reactionBreakdown.impact / gladiator.totalReactions * 100), color: "from-yellow-500/20 border-yellow-500/40" },
              ].map((r) => (
                <div key={r.label} className={cn("p-4 border bg-gradient-to-b to-transparent", r.color)}>
                  <p className="mono-label-sm text-muted-foreground/60 mb-1">{r.label}</p>
                  <p className="font-display text-2xl text-primary">{r.value}</p>
                  <div className="mt-2 h-1 bg-secondary/60 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                  <p className="mono-label-sm text-muted-foreground/40 mt-1">{r.pct}%</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Timeline de batalhas ── */}
        {timeline.length > 0 && (
          <section>
            <SectionLabel icon={<Swords className="w-4 h-4 text-primary" />}>ÚLTIMAS BATALHAS</SectionLabel>
            <div className="mt-4 space-y-2">
              {timeline.map((t, i) => (
                <div key={t.id} className={cn(
                  "flex items-center gap-3 px-4 py-3 border transition-colors",
                  t.won ? "border-primary/25 bg-primary/5" : "border-border/30"
                )}>
                  {/* Resultado */}
                  <div className="shrink-0">
                    {t.won
                      ? <CheckCircle2 className="w-5 h-5 text-primary" />
                      : <XCircle      className="w-5 h-5 text-muted-foreground/40" />
                    }
                  </div>

                  {/* VS */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-display text-sm tracking-wider", t.won ? "text-primary" : "text-muted-foreground")}>
                        {t.won ? "VITÓRIA" : "DERROTA"}
                      </span>
                      <span className="mono-label-sm text-muted-foreground/40">VS</span>
                      <span className="font-display text-sm tracking-wider truncate">{t.vs}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="mono-label-sm text-muted-foreground/40">
                        {format(new Date(t.date), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                      </span>
                      {t.reactions > 0 && (
                        <span className="flex items-center gap-1 mono-label-sm text-muted-foreground/40">
                          <Flame className="w-3 h-3" />{t.reactions}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <span className={cn(
                    "mono-label-sm shrink-0 px-2 py-0.5 border",
                    t.won
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground/40"
                  )}>
                    {t.won ? "W" : "L"}
                  </span>
                </div>
              ))}

              {battles.length > 10 && (
                <p className="text-center mono-label-sm text-muted-foreground/40 pt-2">
                  + {battles.length - 10} batalhas anteriores
                </p>
              )}
            </div>
          </section>
        )}

        {battles.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Swords className="w-10 h-10 text-muted-foreground/20" />
            <p className="font-display text-lg text-muted-foreground/40 tracking-wider">SEM BATALHAS REGISTADAS</p>
            <p className="text-sm text-muted-foreground/30 font-body">Este gladiador ainda não combateu</p>
          </div>
        )}
      </main>
    </div>
  );
};

/* ── Sub-components ── */

const SectionLabel = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="w-4 h-px bg-primary/50" />
    {icon}
    <span className="mono-label text-primary/80">{children}</span>
    <span className="flex-1 h-px bg-border/30" />
  </div>
);

const StatBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="text-center">
    <p className={cn("font-display text-2xl", color === "primary" ? "text-primary text-glow" : "text-muted-foreground/70")}>
      {value}
    </p>
    <p className="mono-label-sm text-muted-foreground/50 mt-0.5">{label}</p>
  </div>
);

const KpiCard = ({ label, value, sub, icon, highlight, isText }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; highlight?: boolean; isText?: boolean;
}) => (
  <div className={cn(
    "p-4 border bg-card/30 transition-colors",
    highlight ? "border-primary/30 bg-primary/5" : "border-border/40"
  )}>
    <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-2">
      {icon}
      <span className="mono-label-sm">{label}</span>
    </div>
    <p className={cn(
      highlight ? "text-primary text-glow" : "text-foreground",
      isText ? "font-display text-base tracking-wider" : "font-display text-2xl"
    )}>
      {value}
    </p>
    <p className="mono-label-sm text-muted-foreground/40 mt-1">{sub}</p>
  </div>
);

export default GladiadorPerfil;
