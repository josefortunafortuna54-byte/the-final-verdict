import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBattleHistory } from "@/hooks/useBattleHistory";
import { useGladiators } from "@/hooks/useGladiators";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Trophy, Flame, Heart, Zap, ArrowLeft, TrendingUp, Swords, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const C_PRIMARY = "hsl(0 80% 55%)";
const C_DIM     = "hsl(0 30% 35%)";
const C_MUTED   = "hsl(0 10% 25%)";
const C_GOLD    = "hsl(45 90% 55%)";

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

const Stats = () => {
  const navigate = useNavigate();
  const { history, loading: histLoading } = useBattleHistory();
  const { gladiators, loading: gladLoading } = useGladiators();

  const loading = histLoading || gladLoading;

  // ── Dados derivados ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Ranking — usa gladiators (fonte primária) e enriquece com histórico
    const ranking = [...gladiators]
      .filter((g) => g.totalBattles > 0)
      .sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.winRate - a.winRate)
      .slice(0, 10)
      .map((g) => ({
        name:     g.name,
        wins:     g.wins,
        losses:   g.losses,
        winRate:  g.winRate,
        reactions: g.totalReactions,
        avatar:   g.avatarUrl,
      }));

    // Fallback: se não há gladiadores cadastrados, usa histórico
    const rankingFallback = (() => {
      if (ranking.length > 0) return ranking;
      const winMap: Record<string, number> = {};
      history.forEach((b) => { if (b.winner) winMap[b.winner] = (winMap[b.winner] ?? 0) + 1; });
      return Object.entries(winMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, wins]) => ({ name, wins, losses: 0, winRate: 0, reactions: 0, avatar: "" }));
    })();

    // Reações por batalha (últimas 8)
    const reactionData = [...history].slice(0, 8).reverse().map((b, i) => ({
      name:     `#${i + 1}`,
      label:    `${b.gladiator_a_name} vs ${b.gladiator_b_name}`,
      fogo:     b.fire_reactions,
      coração:  b.heart_reactions,
      impacto:  b.impact_reactions,
      total:    b.total_reactions,
    }));

    // Totais globais
    const totalFire   = history.reduce((s, b) => s + b.fire_reactions, 0);
    const totalHeart  = history.reduce((s, b) => s + b.heart_reactions, 0);
    const totalImpact = history.reduce((s, b) => s + b.impact_reactions, 0);
    const totalRx     = totalFire + totalHeart + totalImpact;

    const rxPie = [
      { name: "🔥 Fogo",    value: totalFire,   color: C_PRIMARY },
      { name: "❤️ Coração", value: totalHeart,  color: C_DIM },
      { name: "⚡ Impacto", value: totalImpact, color: C_GOLD },
    ].filter((d) => d.value > 0);

    // Radar — scorecard médio por critério
    const withScorecard = history.filter((b) => b.scorecard).slice(0, 5);
    let radarData: { criterion: string; média: number }[] = [];
    if (withScorecard.length) {
      const criteria = ["rimas", "punchlines", "flow", "criatividade", "agressividade"];
      radarData = criteria.map((key) => {
        const avg = withScorecard.reduce((sum, b) => {
          const rounds = b.scorecard?.rounds ?? [];
          const roundAvg = rounds.reduce(
            (rs, r) => rs + (r.a[key as keyof typeof r.a] ?? 0) + (r.b[key as keyof typeof r.b] ?? 0), 0
          ) / (rounds.length * 2 || 1);
          return sum + roundAvg;
        }, 0) / withScorecard.length;
        return { criterion: key.toUpperCase(), média: Math.round(avg * 10) / 10 };
      });
    }

    // Win rate evolution — top 5 gladiadores ao longo do tempo
    const top5 = rankingFallback.slice(0, 5).map((g) => g.name);
    const winRateEvolution = history
      .slice()
      .reverse()
      .reduce((acc: Record<string, number | string>[], b, idx) => {
        const prev = acc[idx - 1] ?? {};
        const point: Record<string, number | string> = { battle: `B${idx + 1}` };
        top5.forEach((name) => {
          point[name] = prev[name] ?? 0;
          if (b.winner === name) point[name] = Math.min(100, (prev[name] ?? 0) + 10);
        });
        acc.push(point);
        return acc;
      }, [])
      .slice(-8);

    // Gladiador mais activo (mais reações totais)
    const mvp = gladiators.length
      ? [...gladiators].sort((a, b) => b.totalReactions - a.totalReactions)[0]
      : null;

    return {
      ranking: rankingFallback,
      reactionData,
      totalFire, totalHeart, totalImpact, totalRx,
      rxPie, radarData, winRateEvolution, top5, mvp,
      totalGladiators: gladiators.length,
      totalBattles:    history.length,
    };
  }, [history, gladiators]);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: "BATALHAS",      value: stats?.totalBattles ?? 0,    icon: <Swords className="w-4 h-4" /> },
    { label: "GLADIADORES",   value: stats?.totalGladiators ?? 0, icon: <Users className="w-4 h-4" /> },
    { label: "REAÇÕES",       value: stats?.totalRx ?? 0,         icon: <TrendingUp className="w-4 h-4" /> },
    { label: "🔥 FOGO",       value: stats?.totalFire ?? 0,       icon: <Flame className="w-4 h-4" /> },
    { label: "❤️ CORAÇÃO",    value: stats?.totalHeart ?? 0,      icon: <Heart className="w-4 h-4" /> },
    { label: "⚡ IMPACTO",    value: stats?.totalImpact ?? 0,     icon: <Zap className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-display text-xl text-primary animate-pulse-glow">CARREGANDO DADOS...</p>
        </div>
      </div>
    );
  }

  const noData = !history.length && !gladiators.length;

  return (
    <div className="min-h-screen bg-background scanlines">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-primary/15 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          <span className="mono-label-sm">VOLTAR</span>
        </Button>
        <div className="flex items-center gap-3">
          <span className="w-8 h-px bg-primary/40" />
          <span className="font-display text-xl tracking-widest text-glow">ESTATÍSTICAS</span>
          <span className="w-8 h-px bg-primary/40" />
        </div>
        <span className="mono-label-sm text-muted-foreground/60">{history.length} BATALHAS</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {noData ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Swords className="w-16 h-16 text-muted-foreground/30" />
            <p className="font-display text-2xl text-muted-foreground/50 tracking-wider">SEM DADOS AINDA</p>
            <p className="text-sm text-muted-foreground/40 font-body">Completa a primeira batalha para ver estatísticas</p>
            <Button variant="arena" size="sm" onClick={() => navigate("/arena")} className="mt-4">
              IR PARA A ARENA
            </Button>
          </div>
        ) : stats && (
          <>
            {/* KPIs */}
            <section>
              <SectionLabel>RESUMO GERAL</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
              </div>
            </section>

            {/* MVP */}
            {stats.mvp && stats.mvp.wins > 0 && (
              <section>
                <SectionLabel icon={<Star className="w-4 h-4 text-primary" />}>MVP — GLADIADOR COM MAIS REAÇÕES</SectionLabel>
                <div className="mt-4 flex items-center gap-4 px-5 py-4 border border-primary/30 bg-primary/5">
                  <div className="w-14 h-14 shrink-0 border border-primary/40 bg-card/30 flex items-center justify-center overflow-hidden relative"
                    style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
                    {stats.mvp.avatarUrl
                      ? <img src={stats.mvp.avatarUrl} alt={stats.mvp.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                      : <span className="font-display text-2xl text-muted-foreground/30">{stats.mvp.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl tracking-wider text-primary text-glow truncate">{stats.mvp.name}</p>
                    {stats.mvp.alias && <p className="text-sm text-muted-foreground/50 font-body">{stats.mvp.alias}</p>}
                  </div>
                  <div className="flex gap-6 shrink-0">
                    <div className="text-center">
                      <p className="font-display text-2xl text-primary">{stats.mvp.wins}</p>
                      <p className="mono-label-sm text-muted-foreground/50">VITÓRIAS</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl text-primary">{stats.mvp.winRate}%</p>
                      <p className="mono-label-sm text-muted-foreground/50">WIN RATE</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl text-yellow-400">{stats.mvp.totalReactions}</p>
                      <p className="mono-label-sm text-muted-foreground/50">REAÇÕES</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Ranking de gladiadores — fonte: colecção gladiators */}
            {stats.ranking.length > 0 && (
              <section>
                <SectionLabel icon={<Trophy className="w-4 h-4 text-primary" />}>RANKING DE GLADIADORES</SectionLabel>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ranking} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 60%)", fontSize: 10, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(0 0% 40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 80% 55% / 0.05)" }} />
                      <Bar dataKey="wins" name="Vitórias" radius={[2, 2, 0, 0]}>
                        {stats.ranking.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? C_PRIMARY : i === 1 ? C_DIM : C_MUTED} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-3 space-y-1">
                  {stats.ranking.slice(0, 5).map((r, i) => (
                    <div key={r.name} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 border transition-colors",
                      i === 0 ? "border-primary/30 bg-primary/5" : "border-border/30 hover:border-primary/20"
                    )}>
                      <span className={cn("font-display text-sm w-5 text-center shrink-0",
                        i === 0 ? "text-primary text-glow" : i === 1 ? "text-yellow-400/70" : i === 2 ? "text-orange-400/60" : "text-muted-foreground/40")}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      {r.avatar && (
                        <div className="w-7 h-7 shrink-0 border border-border/40 overflow-hidden relative"
                          style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>
                          <img src={r.avatar} alt={r.name} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e) => (e.currentTarget.style.display = "none")} />
                        </div>
                      )}
                      <span className="flex-1 font-display text-sm tracking-wider truncate">{r.name}</span>
                      {/* Win rate bar */}
                      <div className="w-20 hidden sm:block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="mono-label-sm text-muted-foreground/40">{r.winRate}%</span>
                        </div>
                        <div className="h-1 bg-secondary/60 overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${r.winRate}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-display text-sm text-primary">{r.wins}<span className="text-muted-foreground/40 text-xs">V</span></span>
                        {r.losses > 0 && <span className="font-display text-sm text-muted-foreground/50">{r.losses}<span className="text-muted-foreground/40 text-xs">D</span></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reações por batalha */}
            {stats.reactionData.length > 0 && (
              <section>
                <SectionLabel icon={<Flame className="w-4 h-4 text-primary" />}>REAÇÕES POR BATALHA</SectionLabel>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.reactionData} barCategoryGap="25%">
                      <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(0 0% 40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 80% 55% / 0.05)" }} />
                      <Bar dataKey="fogo"    name="🔥 Fogo"    fill={C_PRIMARY}        radius={[2,2,0,0]} />
                      <Bar dataKey="coração" name="❤️ Coração" fill="hsl(350 60% 45%)" radius={[2,2,0,0]} />
                      <Bar dataKey="impacto" name="⚡ Impacto" fill={C_GOLD}           radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Pie + Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.rxPie.length > 0 && (
                <section>
                  <SectionLabel>DISTRIBUIÇÃO DE REAÇÕES</SectionLabel>
                  <div className="mt-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.rxPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80} paddingAngle={4}
                          label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                          labelLine={{ stroke: "hsl(0 0% 40%)", strokeWidth: 1 }}>
                          {stats.rxPie.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {stats.radarData.length > 0 && (
                <section>
                  <SectionLabel>CRITÉRIOS MÉDIOS</SectionLabel>
                  <div className="mt-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius={70}>
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
            </div>

            {/* Últimas batalhas */}
            <section>
              <SectionLabel icon={<Swords className="w-4 h-4 text-primary" />}>ÚLTIMAS BATALHAS</SectionLabel>
              <div className="mt-4 space-y-2">
                {history.slice(0, 10).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 border border-border/30 hover:border-primary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("font-display text-sm tracking-wider truncate",
                          b.winner === b.gladiator_a_name ? "text-primary text-glow" : "text-muted-foreground")}>
                          {b.gladiator_a_name}
                        </span>
                        <span className="mono-label-sm text-muted-foreground/40 shrink-0">VS</span>
                        <span className={cn("font-display text-sm tracking-wider truncate",
                          b.winner === b.gladiator_b_name ? "text-primary text-glow" : "text-muted-foreground")}>
                          {b.gladiator_b_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{b.fire_reactions}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{b.heart_reactions}</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{b.impact_reactions}</span>
                        <span>{format(new Date(b.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Trophy className="w-3 h-3 text-primary" />
                      <span className="font-display text-xs text-primary tracking-wider">{b.winner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const SectionLabel = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="w-4 h-px bg-primary/50" />
    {icon}
    <span className="mono-label text-primary/80">{children}</span>
    <span className="flex-1 h-px bg-border/30" />
  </div>
);

const KpiCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 p-3 border border-border/40 bg-card/30 hover:border-primary/30 transition-colors">
    <div className="flex items-center gap-1.5 text-muted-foreground/60">
      {icon}
      <span className="mono-label-sm leading-tight">{label}</span>
    </div>
    <span className="font-display text-2xl text-primary text-glow">{value}</span>
  </div>
);

export default Stats;
