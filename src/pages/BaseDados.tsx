import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGladiators, Gladiator } from "@/hooks/useGladiators";
import { useBattleHistory } from "@/hooks/useBattleHistory";
import { useActiveBattle } from "@/hooks/useActiveBattle";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, Pencil, Trash2, Trophy, Swords,
  TrendingUp, Search, Check, Loader2, X,
  Database, History, BarChart2, RefreshCw, Flame, Heart, Zap, Radio, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Tab = "gladiadores" | "historico" | "ranking";

const BaseDados = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("gladiadores");

  return (
    <div className="min-h-screen bg-background scanlines">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-primary/15 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          <span className="mono-label-sm hidden md:inline">VOLTAR</span>
        </Button>
        <div className="flex items-center gap-3">
          <span className="w-6 h-px bg-primary/40" />
          <Database className="w-4 h-4 text-primary/70" />
          <span className="font-display text-xl tracking-widest text-glow">BASE DE DADOS</span>
          <span className="w-6 h-px bg-primary/40" />
        </div>
        <div className="w-20" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border/30 bg-background/60 sticky top-[53px] z-10">
        {([ 
          { id: "gladiadores", label: "GLADIADORES", icon: <Swords className="w-3.5 h-3.5" /> },
          { id: "historico",   label: "HISTÓRICO",   icon: <History className="w-3.5 h-3.5" /> },
          { id: "ranking",     label: "RANKING",     icon: <Trophy className="w-3.5 h-3.5" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 flex-1 px-4 py-3 mono-label-sm transition-all duration-200 border-b-2",
              tab === t.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground/60 hover:text-primary/70 hover:border-primary/30"
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === "gladiadores" && <TabGladiadores />}
        {tab === "historico"   && <TabHistorico />}
        {tab === "ranking"     && <TabRanking />}
      </main>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB — GLADIADORES
══════════════════════════════════════════════════════════════ */
// ── Fuzzy matching ────────────────────────────────────────────────────────
// Normaliza: maiúsculas, sem acentos, sem pontuação, sem espaços duplos
const normalize = (s: string): string =>
  s.toUpperCase()
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")   // remove diacríticos (ã→A, é→E, etc.)
   .replace(/[^A-Z0-9 ]/g, " ")       // pontuação → espaço
   .replace(/\s+/g, " ")              // espaços duplos → simples
   .trim();

// Trigramas de uma string
const trigrams = (s: string): Set<string> => {
  const padded = `  ${s}  `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++)
    set.add(padded.slice(i, i + 3));
  return set;
};

// Similaridade de Dice com trigramas (0–1)
const diceSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let overlap = 0;
  ta.forEach((t) => { if (tb.has(t)) overlap++; });
  return (2 * overlap) / (ta.size + tb.size);
};

// Retorna true se os nomes forem suficientemente parecidos
// Threshold: 0.45 — apanha "MC FURY" vs "MCFURY", "SHADOW KING" vs "SHADOWKING", etc.
const FUZZY_THRESHOLD = 0.45;

const namesMatch = (a: string, b: string): boolean => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;                      // exacto
  if (na.includes(nb) || nb.includes(na)) return true; // substring
  return diceSimilarity(na, nb) >= FUZZY_THRESHOLD;
};

// Verifica se um gladiador está em batalha (compara contra os dois nomes)
const gladiatorInBattle = (gladName: string, battleNames: string[]): boolean =>
  battleNames.some((bn) => namesMatch(gladName, bn));

// ──────────────────────────────────────────────────────────────────────────

const TabGladiadores = () => {
  const navigate = useNavigate();
  const { gladiators, loading, saving, addGladiator, updateGladiator, deleteGladiator } = useGladiators();
  const { battle } = useActiveBattle();
  const activeName = battle
    ? [battle.gladiator_a_name.toUpperCase(), battle.gladiator_b_name.toUpperCase()]
    : [];
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [fname, setFname]     = useState("");
  const [falias, setFalias]   = useState("");
  const [favatar, setFavatar] = useState("");
  const [imgErr, setImgErr]   = useState(false);
  const [fError, setFError]   = useState("");

  const reset = () => { setFname(""); setFalias(""); setFavatar(""); setImgErr(false); setFError(""); setEditId(null); setShowForm(false); };

  const openAdd = () => { reset(); setShowForm(true); };
  const openEdit = (g: Gladiator) => { setFname(g.name); setFalias(g.alias ?? ""); setFavatar(g.avatarUrl ?? ""); setImgErr(false); setFError(""); setEditId(g.id); setShowForm(true); };

  const save = async () => {
    if (!fname.trim()) { setFError("Nome obrigatório"); return; }
    if (fname.trim().length < 2) { setFError("Mínimo 2 caracteres"); return; }
    setFError("");
    if (editId) {
      await updateGladiator(editId, { name: fname, alias: falias, avatarUrl: favatar });
    } else {
      await addGladiator({ name: fname, alias: falias, avatarUrl: favatar });
    }
    reset();
  };

  const filtered = gladiators.filter((g) => {
    const q = search.trim().toUpperCase();
    return !q || g.name.includes(q) || (g.alias ?? "").toUpperCase().includes(q);
  });

  return (
    <div className="space-y-5">

      {/* Banner batalha activa */}
      {battle && (
        <div className="flex items-center gap-3 px-4 py-3 border border-primary/50 bg-primary/10">
          <Radio className="w-4 h-4 text-primary animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="mono-label-sm text-primary/80 mb-0.5">EM BATALHA AGORA — ROUND {battle.current_round}/3</p>
            <p className="font-display text-sm tracking-wider truncate">
              <span className="text-primary text-glow">{battle.gladiator_a_name}</span>
              <span className="text-muted-foreground/40 mx-2">VS</span>
              <span className="text-primary text-glow">{battle.gladiator_b_name}</span>
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="TOTAL"    value={gladiators.length}                                    icon={<Swords className="w-4 h-4" />} />
        <KpiCard label="BATALHAS" value={gladiators.reduce((s, g) => s + g.totalBattles, 0)}  icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="VITÓRIAS" value={gladiators.reduce((s, g) => s + g.wins, 0)}           icon={<Trophy className="w-4 h-4" />} />
      </div>

      {/* Barra de pesquisa + botão */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="PESQUISAR..."
            className="w-full bg-card/30 border border-border/50 pl-9 pr-4 py-2.5 font-display text-sm tracking-wider outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30" />
        </div>
        <Button variant="arena" size="sm" onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> NOVO
        </Button>
      </div>

      {/* Form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm border border-primary/30 bg-background p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg tracking-wider text-glow">{editId ? "EDITAR" : "NOVO GLADIADOR"}</span>
              <button onClick={reset} className="text-muted-foreground hover:text-primary"><X className="w-5 h-5" /></button>
            </div>

            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 border border-border/50 bg-card/30 flex items-center justify-center overflow-hidden relative"
                style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
                {favatar && !imgErr
                  ? <img src={favatar} alt="avatar" onError={() => setImgErr(true)} className="absolute inset-0 w-full h-full object-cover object-top" />
                  : <span className="font-display text-2xl text-muted-foreground/20">{fname[0] || "?"}</span>}
              </div>
              <div className="flex-1">
                <label className="mono-label-sm text-muted-foreground/50 block mb-1">URL DA FOTO</label>
                <input value={favatar} onChange={(e) => { setFavatar(e.target.value); setImgErr(false); }}
                  placeholder="https://..."
                  className="w-full bg-transparent border-b border-border/40 py-1 text-sm font-body outline-none focus:border-primary/40 placeholder:text-muted-foreground/25 transition-colors" />
                {imgErr && favatar && <p className="mono-label-sm text-destructive/60 mt-0.5">URL inválido</p>}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="mono-label-sm text-muted-foreground/50 block mb-1">NOME DO MC *</label>
              <input value={fname} onChange={(e) => { setFname(e.target.value.toUpperCase()); setFError(""); }}
                maxLength={20} placeholder="EX: MC FURY"
                className="w-full bg-transparent border-b-2 border-border/60 py-2 font-display text-lg tracking-wider outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/25" />
              {fError && <p className="mono-label-sm text-destructive/70 mt-1">{fError}</p>}
            </div>

            {/* Alcunha */}
            <div>
              <label className="mono-label-sm text-muted-foreground/50 block mb-1">ALCUNHA</label>
              <input value={falias} onChange={(e) => setFalias(e.target.value)}
                maxLength={30} placeholder="Ex: O Rei das Rimas"
                className="w-full bg-transparent border-b border-border/40 py-1.5 text-sm font-body outline-none focus:border-primary/40 placeholder:text-muted-foreground/25 transition-colors" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={reset} className="flex-1">CANCELAR</Button>
              <Button variant="arena" onClick={save} disabled={saving} className="flex-1 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? "GUARDAR" : "ADICIONAR"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4">
          <Swords className="w-12 h-12 text-muted-foreground/20" />
          <p className="font-display text-xl text-muted-foreground/40 tracking-wider">
            {search ? "NENHUM RESULTADO" : "SEM GLADIADORES"}
          </p>
          {!search && <Button variant="arena" size="sm" onClick={openAdd}>ADICIONAR PRIMEIRO</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g, i) => {
            const isActive = gladiatorInBattle(g.name, activeName);
            return (
            <div key={g.id} className={cn(
              "flex items-center gap-3 px-4 py-3 border transition-colors group",
              isActive
                ? "border-primary/60 bg-primary/5 shadow-[0_0_12px_hsl(var(--arena-glow)/0.2)]"
                : "border-border/30 hover:border-primary/20"
            )}>
              {/* Pos */}
              <span className={cn("font-display text-sm w-6 text-center shrink-0",
                i === 0 ? "text-primary text-glow" : i <= 2 ? "text-yellow-500/60" : "text-muted-foreground/30")}>
                {i + 1}
              </span>

              {/* Avatar */}
              <div className={cn(
                "w-11 h-11 shrink-0 border bg-card/30 flex items-center justify-center overflow-hidden relative",
                isActive ? "border-primary/80" : "border-border/40"
              )}
                style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}>
                {g.avatarUrl
                  ? <img src={g.avatarUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e) => (e.currentTarget.style.display = "none")} />
                  : <span className="font-display text-lg text-muted-foreground/25">{g.name[0]}</span>}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-primary/40 animate-pulse" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-display text-sm tracking-wider truncate", isActive && "text-primary")}>{g.name}</span>
                  {i === 0 && <Trophy className="w-3 h-3 text-primary shrink-0" />}
                  {isActive && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-primary shrink-0">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span className="mono-label-sm">EM BATALHA</span>
                    </span>
                  )}
                </div>
                {g.alias && <p className="text-xs text-muted-foreground/40 font-body truncate">{g.alias}</p>}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-display text-primary">{g.wins}</p>
                  <p className="mono-label-sm text-muted-foreground/40">V</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-display text-muted-foreground/50">{g.losses}</p>
                  <p className="mono-label-sm text-muted-foreground/40">D</p>
                </div>
                <div className="text-center">
                  <p className={cn("font-display", g.winRate >= 60 ? "text-primary" : "text-muted-foreground/60")}>{g.winRate}%</p>
                  <p className="mono-label-sm text-muted-foreground/40">WIN</p>
                </div>
                <div className="w-14 hidden md:block">
                  <div className="h-1 bg-secondary/60 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${g.winRate}%` }} />
                  </div>
                </div>
              </div>

              {/* Acções */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => navigate(`/gladiador/${g.id}`)}
                  className="w-7 h-7 border border-border/40 flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors"
                  title="Ver perfil">
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button onClick={() => openEdit(g)}
                  className="w-7 h-7 border border-border/40 flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
                {confirmDel === g.id ? (
                  <button onClick={async () => { await deleteGladiator(g.id); setConfirmDel(null); }}
                    className="w-7 h-7 border border-destructive/60 bg-destructive/10 flex items-center justify-center text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                ) : (
                  <button onClick={() => setConfirmDel(g.id)}
                    className="w-7 h-7 border border-border/40 flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB — HISTÓRICO
══════════════════════════════════════════════════════════════ */
const TabHistorico = () => {
  const {
    history, loading, loadingMore,
    totalCount, totalPages, currentPage, hasMore,
    fetchHistory, nextPage, prevPage, goToPage,
  } = useBattleHistory();

  const startIdx = (currentPage - 1) * 10;

  // Gera array de páginas para mostrar (max 5 botões)
  const pageButtons = (() => {
    if (!totalPages || totalPages <= 1) return [];
    const pages: (number | "...")[] = [];
    const delta = 1; // páginas à volta da actual
    const range: number[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    pages.push(1);
    if (range[0] > 2) pages.push("...");
    range.forEach((p) => pages.push(p));
    if (range[range.length - 1] < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="mono-label text-primary/70">
            {totalCount > 0 ? `${totalCount} BATALHAS` : `${history.length} BATALHAS`}
          </span>
          {totalPages && (
            <span className="mono-label-sm text-muted-foreground/40">
              · PÁG. {currentPage}{totalPages ? `/${totalPages}` : ""}
            </span>
          )}
        </div>
        <button onClick={fetchHistory} disabled={loading || loadingMore}
          className="flex items-center gap-1.5 mono-label-sm text-muted-foreground/50 hover:text-primary/70 transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-3 h-3", (loading || loadingMore) && "animate-spin")} />
          ACTUALIZAR
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <History className="w-12 h-12 text-muted-foreground/20" />
          <p className="font-display text-xl text-muted-foreground/40 tracking-wider">SEM HISTÓRICO</p>
          <p className="text-sm text-muted-foreground/30 font-body">Completa a primeira batalha para ver o registo</p>
        </div>
      ) : (
        <>
          <div className={cn("space-y-2 transition-opacity duration-200", loadingMore && "opacity-50 pointer-events-none")}>
            {history.map((b, i) => (
              <div key={b.id} className="border border-border/30 hover:border-primary/20 transition-colors">
                {/* Header da batalha */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="mono-label-sm text-muted-foreground/30 w-6 shrink-0">
                    {startIdx + i + 1}
                  </span>
                  <span className={cn("font-display text-sm tracking-wider flex-1 truncate",
                    b.winner === b.gladiator_a_name ? "text-primary text-glow" : "text-muted-foreground/60")}>
                    {b.gladiator_a_name}
                  </span>
                  <span className="mono-label-sm text-muted-foreground/30 shrink-0">VS</span>
                  <span className={cn("font-display text-sm tracking-wider flex-1 truncate text-right",
                    b.winner === b.gladiator_b_name ? "text-primary text-glow" : "text-muted-foreground/60")}>
                    {b.gladiator_b_name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="font-display text-xs text-primary tracking-wider hidden sm:inline">{b.winner}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-border/20 bg-card/20">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                    <Flame className="w-3 h-3 text-primary/60" />{b.fire_reactions}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                    <Heart className="w-3 h-3 text-red-500/60" />{b.heart_reactions}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                    <Zap className="w-3 h-3 text-yellow-500/60" />{b.impact_reactions}
                  </span>
                  <span className="flex-1" />
                  <span className="mono-label-sm text-muted-foreground/30">
                    {format(new Date(b.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Scorecard */}
                {b.scorecard && (
                  <div className="px-4 py-2 border-t border-border/20 bg-card/10">
                    <p className="mono-label-sm text-muted-foreground/40 mb-2">SCORECARD</p>
                    <div className="grid grid-cols-5 gap-2">
                      {["rimas","punchlines","flow","criatividade","agressividade"].map((crit) => {
                        const avgA = b.scorecard!.rounds.reduce((s, r) => s + (r.a[crit as keyof typeof r.a] ?? 0), 0) / b.scorecard!.rounds.length;
                        const avgB = b.scorecard!.rounds.reduce((s, r) => s + (r.b[crit as keyof typeof r.b] ?? 0), 0) / b.scorecard!.rounds.length;
                        return (
                          <div key={crit} className="text-center">
                            <p className="mono-label-sm text-muted-foreground/30 mb-1 uppercase text-[9px]">{crit.slice(0,4)}</p>
                            <p className={cn("font-display text-xs", avgA > avgB ? "text-primary" : "text-muted-foreground/50")}>{avgA.toFixed(1)}</p>
                            <p className={cn("font-display text-xs", avgB > avgA ? "text-primary" : "text-muted-foreground/50")}>{avgB.toFixed(1)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Paginação ── */}
          {(hasMore || currentPage > 1) && (
            <div className="flex items-center justify-between pt-2">
              {/* Prev */}
              <button
                onClick={prevPage}
                disabled={currentPage <= 1 || loadingMore}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 border mono-label-sm transition-all",
                  currentPage > 1 && !loadingMore
                    ? "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary"
                    : "border-border/20 text-muted-foreground/20 cursor-not-allowed"
                )}
              >
                ← ANTERIOR
              </button>

              {/* Páginas numeradas */}
              <div className="flex items-center gap-1">
                {pageButtons.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="mono-label-sm text-muted-foreground/30 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      disabled={p === currentPage || loadingMore}
                      className={cn(
                        "w-8 h-8 mono-label-sm border transition-all",
                        p === currentPage
                          ? "border-primary bg-primary/10 text-primary cursor-default"
                          : "border-border/30 text-muted-foreground/60 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                {/* Se não temos total, mostra só "Página X" */}
                {!totalPages && (
                  <span className="mono-label-sm text-muted-foreground/50 px-2">PÁG. {currentPage}</span>
                )}
              </div>

              {/* Next */}
              <button
                onClick={nextPage}
                disabled={!hasMore || loadingMore}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 border mono-label-sm transition-all",
                  hasMore && !loadingMore
                    ? "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary"
                    : "border-border/20 text-muted-foreground/20 cursor-not-allowed"
                )}
              >
                SEGUINTE →
              </button>
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB — RANKING
══════════════════════════════════════════════════════════════ */
const TabRanking = () => {
  const navigate = useNavigate();
  const { gladiators, loading } = useGladiators();
  const { battle } = useActiveBattle();
  const activeName = battle
    ? [battle.gladiator_a_name.toUpperCase(), battle.gladiator_b_name.toUpperCase()]
    : [];
  const sorted = [...gladiators].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-4 h-px bg-primary/40" />
        <span className="mono-label text-primary/80">RANKING GERAL — {gladiators.length} GLADIADORES</span>
        <span className="flex-1 h-px bg-border/30" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Trophy className="w-12 h-12 text-muted-foreground/20" />
          <p className="font-display text-xl text-muted-foreground/40 tracking-wider">SEM DADOS</p>
          <p className="text-sm text-muted-foreground/30 font-body">Cadastra gladiadores e realiza batalhas</p>
        </div>
      ) : (
        <>
          {/* Pódio top 3 */}
          {sorted.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[sorted[1], sorted[0], sorted[2]].map((g, podiumIdx) => {
                const realIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                const heights = ["h-24", "h-32", "h-20"];
                return (
                  <div key={g.id} className={cn(
                    "flex flex-col items-center justify-end pb-3 border transition-all",
                    realIdx === 0 ? "border-primary/50 bg-primary/5" : "border-border/30 bg-card/20",
                    heights[podiumIdx]
                  )}>
                    <span className="text-2xl mb-1">{medals[realIdx]}</span>
                    <div className="w-8 h-8 border border-border/40 bg-card/30 flex items-center justify-center overflow-hidden relative mb-1"
                      style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>
                      {g.avatarUrl
                        ? <img src={g.avatarUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                        : <span className="font-display text-xs text-muted-foreground/30">{g.name[0]}</span>}
                    </div>
                    <p className={cn("font-display text-xs tracking-wider truncate px-1 text-center",
                      realIdx === 0 ? "text-primary text-glow" : "text-muted-foreground/70")}>
                      {g.name.length > 8 ? g.name.slice(0, 7) + "…" : g.name}
                    </p>
                    <p className="mono-label-sm text-primary/70">{g.wins}V</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista completa */}
          <div className="space-y-1.5">
            {sorted.map((g, i) => {
              const inBattle = gladiatorInBattle(g.name, activeName);
              return (
              <div key={g.id} className={cn(
                "flex items-center gap-3 px-4 py-2.5 border transition-colors",
                inBattle ? "border-primary/60 bg-primary/8" :
                i === 0 ? "border-primary/30 bg-primary/5" : "border-border/25 hover:border-primary/15"
              )}>
                <span className={cn("font-display text-base w-7 text-center shrink-0",
                  i === 0 ? "text-primary text-glow" : i === 1 ? "text-yellow-400/70" : i === 2 ? "text-orange-400/60" : "text-muted-foreground/30")}>
                  {i < 3 ? medals[i] : i + 1}
                </span>

                <div className="w-9 h-9 shrink-0 border border-border/40 bg-card/30 flex items-center justify-center overflow-hidden relative"
                  style={{ clipPath: "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)" }}>
                  {g.avatarUrl
                    ? <img src={g.avatarUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e) => (e.currentTarget.style.display = "none")} />
                    : <span className="font-display text-sm text-muted-foreground/25">{g.name[0]}</span>}
                  {inBattle && <div className="absolute inset-0 border-2 border-primary/60 animate-pulse" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/gladiador/${g.id}`)}
                      className={cn("font-display text-sm tracking-wider truncate hover:text-primary transition-colors text-left", i === 0 && "text-primary")}>
                      {g.name}
                    </button>
                    {inBattle && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-primary shrink-0">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span className="mono-label-sm">AO VIVO</span>
                      </span>
                    )}
                  </div>
                  {g.alias && <p className="text-xs text-muted-foreground/35 font-body truncate">{g.alias}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {Array.from({ length: Math.min(g.wins, 10) }).map((_, j) => (
                    <div key={j} className={cn("w-1.5 h-4 transition-all",
                      j < 3 ? "bg-primary" : j < 6 ? "bg-primary/60" : "bg-primary/30")} />
                  ))}
                  {g.wins > 10 && <span className="mono-label-sm text-primary/60 ml-1">+{g.wins - 10}</span>}
                </div>

                <div className="text-right shrink-0 ml-2">
                  <p className="font-display text-sm text-primary">{g.wins}<span className="text-muted-foreground/40 text-xs">V</span> {g.losses}<span className="text-muted-foreground/40 text-xs">D</span></p>
                  <p className="mono-label-sm text-muted-foreground/50">{g.winRate}% WIN</p>
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Componente KPI ──────────────────────────────────────────── */
const KpiCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 p-3 border border-border/40 bg-card/30">
    <div className="flex items-center gap-1.5 text-muted-foreground/50">{icon}<span className="mono-label-sm">{label}</span></div>
    <span className="font-display text-2xl text-primary text-glow">{value}</span>
  </div>
);

export default BaseDados;
