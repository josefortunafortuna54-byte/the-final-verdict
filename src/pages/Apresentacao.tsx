import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBattle } from "@/hooks/useBattle";
import type { Battle } from "@/hooks/useBattle";
import type { ReactionCount } from "@/hooks/useReactions";
import { useVotes } from "@/hooks/useVotes";
import type { VoteCounts } from "@/hooks/useVotes";
import { useGladiators } from "@/hooks/useGladiators";
import type { Gladiator } from "@/hooks/useGladiators";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, X, Radio, Trophy, RotateCcw, Pause, Play, ChevronLeft, ChevronRight, Flame, Heart, Zap } from "lucide-react";

// ── Fullscreen ─────────────────────────────────────────────────────────────
const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* fullscreen may be denied by browser */ }
  }, []);
  return { isFullscreen, toggle };
};

// ── Slide types ────────────────────────────────────────────────────────────
type SlideId = "batalha" | "ranking" | "reacoes" | "votos" | "aguardar";
const SLIDE_DURATIONS: Record<SlideId, number> = {
  batalha: 12000, ranking: 9000, reacoes: 8000, votos: 7000, aguardar: 10000,
};

// ══════════════════════════════════════════════════════════════════════════════
const Apresentacao = () => {
  const navigate = useNavigate();
  const { battle, reactionCounts } = useBattle();
  const { votes } = useVotes(battle?.id);
  const { gladiators } = useGladiators();
  const { isFullscreen, toggle } = useFullscreen();

  // UI state
  const [showUI, setShowUI]       = useState(true);
  const uiTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slide state
  const [rotating, setRotating]           = useState(false);
  const [slideId, setSlideId]             = useState<SlideId>("batalha");
  const [slideIdx, setSlideIdx]           = useState(0);
  const [progress, setProgress]           = useState(0);
  const [entering, setEntering]           = useState(false);
  const rotTimerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progTimerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);

  const status     = battle?.status ?? "active";
  const isFinished = status === "finished";
  const isJudging  = status === "judging";
  const isActive   = status === "active";
  const round      = battle?.current_round ?? 1;
  const winner     = battle?.winner ?? null;

  const topGlads = [...gladiators]
    .filter(g => g.wins > 0)
    .sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.winRate - a.winRate)
    .slice(0, 8);

  const availableSlides: SlideId[] = (() => {
    const s: SlideId[] = [];
    if (battle) s.push("batalha");
    if (topGlads.length > 0) s.push("ranking");
    const rxTotal = reactionCounts.fire + reactionCounts.heart + reactionCounts.impact;
    if (rxTotal > 0) s.push("reacoes");
    if (votes.total > 0) s.push("votos");
    if (!battle) s.push("aguardar");
    return s.length ? s : ["aguardar"];
  })();

  // Transição cinematográfica entre slides
  const goTo = useCallback((idx: number, slides = availableSlides) => {
    const safe = ((idx % slides.length) + slides.length) % slides.length;
    setEntering(true);
    clearTimeout(rotTimerRef.current!);
    clearInterval(progTimerRef.current!);
    setTimeout(() => {
      setSlideIdx(safe);
      setSlideId(slides[safe]);
      setProgress(0);
      setEntering(false);
    }, 500);
  }, [availableSlides]);

  const next = useCallback(() => goTo(slideIdx + 1), [goTo, slideIdx]);
  const prev = useCallback(() => goTo(slideIdx - 1), [goTo, slideIdx]);

  // Motor giratório
  useEffect(() => {
    clearTimeout(rotTimerRef.current!);
    clearInterval(progTimerRef.current!);
    if (!rotating || !availableSlides.length) return;

    const dur = SLIDE_DURATIONS[availableSlides[slideIdx]] ?? 8000;
    const tick = 80;
    let elapsed = 0;
    setProgress(0);

    progTimerRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(100, (elapsed / dur) * 100));
    }, tick);

    rotTimerRef.current = setTimeout(() => {
      clearInterval(progTimerRef.current!);
      goTo(slideIdx + 1);
    }, dur);

    return () => { clearTimeout(rotTimerRef.current!); clearInterval(progTimerRef.current!); };
  }, [rotating, slideIdx, availableSlides, goTo]);

  // Auto-hide UI
  const resetUI = useCallback(() => {
    setShowUI(true);
    clearTimeout(uiTimerRef.current!);
    uiTimerRef.current = setTimeout(() => setShowUI(false), 4000);
  }, []);

  useEffect(() => { resetUI(); return () => clearTimeout(uiTimerRef.current!); }, [resetUI]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) navigate("/arena");
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === " ") { e.preventDefault(); setRotating(r => !r); }
      resetUI();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", resetUI);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousemove", resetUI); };
  }, [next, prev, resetUI, navigate]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none cursor-none"
      onMouseMove={resetUI} onClick={resetUI}
      style={{ cursor: showUI ? "default" : "none" }}>

      {/* ── CINEMATIC LAYERS ── */}
      <CinematicBG round={round} status={status} />

      {/* Film grain overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/></svg>\")" }} />

      {/* Vignette */}
      <div className="absolute inset-0 z-[3] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />

      {/* CinemaScope bars */}
      <div className="absolute top-0 inset-x-0 h-[6vh] bg-black z-[4] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[6vh] bg-black z-[4] pointer-events-none" />

      {/* ── SLIDE CONTENT ── */}
      <div className={cn(
        "absolute inset-0 z-10 flex items-center justify-center px-16",
        "transition-all duration-500",
        entering ? "opacity-0 scale-[0.97] blur-sm" : "opacity-100 scale-100 blur-0"
      )}
        style={{ top: "6vh", bottom: "6vh" }}>
        {isFinished && winner ? <SlideVencedor winner={winner} battle={battle} />
          : isJudging          ? <SlideJulgando />
          : slideId === "batalha"  ? (battle ? <SlideBatalha battle={battle} round={round} votes={votes} rx={reactionCounts} /> : <SlideAguardar />)
          : slideId === "ranking"  ? <SlideRanking gladiators={topGlads} />
          : slideId === "reacoes"  ? <SlideReacoes rx={reactionCounts} battle={battle} />
          : slideId === "votos"    ? (battle ? <SlideVotos votes={votes} battle={battle} /> : <SlideAguardar />)
          : <SlideAguardar />
        }
      </div>

      {/* ── UI OVERLAY (auto-hide) ── */}
      {/* Top bar */}
      <div className={cn(
        "absolute top-[6vh] inset-x-0 z-50 flex items-center justify-between px-8 py-3",
        "transition-opacity duration-700 border-b border-white/5",
        showUI ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button onClick={() => { navigate("/arena"); }}
          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white/80 transition-colors tracking-widest uppercase">
          <X className="w-3.5 h-3.5" /> SAIR
        </button>
        <div className="flex items-center gap-6">
          {/* Slide tabs */}
          <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1">
            {availableSlides.map((s, i) => (
              <button key={s} onClick={() => { setRotating(false); goTo(i); }}
                className={cn("px-3 py-1 text-[10px] font-mono tracking-widest uppercase transition-all",
                  i === slideIdx ? "text-red-400 bg-red-950/50" : "text-white/30 hover:text-white/60")}>
                {s}
              </button>
            ))}
          </div>
          {rotating && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400/70 tracking-widest">
              <RotateCcw className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} /> LIVE
            </span>
          )}
        </div>
        <button onClick={toggle}
          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white/80 transition-colors tracking-widest uppercase">
          {isFullscreen ? <><Minimize2 className="w-3.5 h-3.5" /> EXIT FS</> : <><Maximize2 className="w-3.5 h-3.5" /> FULLSCREEN</>}
        </button>
      </div>

      {/* Bottom bar */}
      <div className={cn(
        "absolute bottom-[6vh] inset-x-0 z-50 transition-opacity duration-700",
        showUI ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Progress bar */}
        {rotating && (
          <div className="h-px bg-white/10 w-full mb-2">
            <div className="h-full bg-red-500/80 transition-none" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between px-8 py-2">
          <button onClick={prev}
            className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white/70 transition-colors tracking-widest uppercase">
            <ChevronLeft className="w-4 h-4" /> ANTERIOR
          </button>

          <div className="flex flex-col items-center gap-2">
            <button onClick={() => setRotating(r => !r)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 text-[11px] font-mono tracking-[0.25em] uppercase",
                "border transition-all duration-300",
                rotating ? "border-red-500/60 bg-red-950/60 text-red-400" : "border-white/20 text-white/40 hover:border-red-500/40 hover:text-red-400/70"
              )}>
              {rotating ? <><Pause className="w-3.5 h-3.5" /> PAUSAR</> : <><RotateCcw className="w-3.5 h-3.5" /> MODO GIRATÓRIO</>}
            </button>
            <div className="flex items-center gap-2">
              {availableSlides.map((_, i) => (
                <button key={i} onClick={() => { setRotating(false); goTo(i); }}
                  className={cn("rounded-full transition-all duration-300",
                    i === slideIdx ? "w-6 h-1.5 bg-red-500" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/50")} />
              ))}
            </div>
          </div>

          <button onClick={next}
            className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white/70 transition-colors tracking-widest uppercase">
            SEGUINTE <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className={cn(
        "absolute bottom-[7vh] left-1/2 -translate-x-1/2 z-40 flex items-center gap-4",
        "text-[10px] font-mono text-white/15 pointer-events-none transition-opacity duration-700",
        showUI ? "opacity-100" : "opacity-0"
      )}>
        <span>← → NAVEGAR</span><span>·</span><span>ESPAÇO ROTAÇÃO</span><span>·</span><span>ESC SAIR</span>
      </div>

      {/* Live indicator */}
      {isActive && (
        <div className={cn(
          "absolute top-[7vh] left-8 z-50 flex items-center gap-2 transition-opacity duration-700",
          showUI ? "opacity-100" : "opacity-40"
        )}>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-mono text-red-400/80 tracking-[0.3em]">AO VIVO</span>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════
const CinematicBG = ({ round, status }: { round: number; status: string }) => (
  <>
    {/* Deep space base */}
    <div className="absolute inset-0 z-0"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a0000 0%, #000000 70%)" }} />

    {/* Animated ember particles */}
    {[...Array(30)].map((_, i) => (
      <div key={i}
        className="absolute rounded-full animate-fire-particle pointer-events-none"
        style={{
          left:   `${10 + (i * 31337) % 80}%`,
          bottom: "-10px",
          width:  `${1 + (i % 3)}px`,
          height: `${1 + (i % 3)}px`,
          background: i % 3 === 0 ? "#ff2200" : i % 3 === 1 ? "#ff6600" : "#ffaa00",
          opacity: 0.4 + (i % 5) * 0.1,
          animationDelay:    `${(i * 0.37) % 4}s`,
          animationDuration: `${3 + (i % 4)}s`,
        }} />
    ))}

    {/* Volumetric light beams */}
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-px h-full opacity-[0.04]"
        style={{ background: "linear-gradient(to bottom, transparent, #ff2200 30%, transparent)", transform: "skewX(-15deg)" }} />
      <div className="absolute top-0 left-1/2 w-px h-full opacity-[0.06]"
        style={{ background: "linear-gradient(to bottom, transparent, #ff2200 40%, transparent)" }} />
      <div className="absolute top-0 right-1/4 w-px h-full opacity-[0.04]"
        style={{ background: "linear-gradient(to bottom, transparent, #ff2200 30%, transparent)", transform: "skewX(15deg)" }} />
    </div>

    {/* Floor glow */}
    <div className="absolute bottom-0 inset-x-0 h-32 z-0 pointer-events-none"
      style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(180,0,0,0.25) 0%, transparent 70%)" }} />

    {/* Round 3 — intensidade máxima */}
    {round === 3 && status === "active" && (
      <>
        <div className="absolute inset-0 z-0 pointer-events-none animate-pulse"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(200,0,0,0.08) 0%, transparent 60%)", animationDuration: "1.5s" }} />
        {[...Array(20)].map((_, i) => (
          <div key={`extra-${i}`} className="absolute rounded-full pointer-events-none"
            style={{
              left:   `${5 + (i * 7919) % 90}%`,
              bottom: "-5px",
              width: "2px", height: "2px",
              background: "#ff4400",
              opacity: 0.6,
              animation: `fire-particle ${2 + (i % 3)}s linear ${(i * 0.2) % 3}s infinite`,
            }} />
        ))}
      </>
    )}
  </>
);

// ══════════════════════════════════════════════════════════════════════════════
// SLIDES
// ══════════════════════════════════════════════════════════════════════════════

interface SlideBatalhaProps {
  battle: Battle;
  round: number;
  votes: VoteCounts;
  rx: ReactionCount;
}

interface CinemaGladiatorProps {
  name: string;
  energy: number;
  avatar?: string | null;
  side: "left" | "right";
  delay: number;
  show: boolean;
}

interface SlideReacoesProps {
  rx: ReactionCount;
  battle: Battle | null;
}

interface SlideVotosProps {
  votes: VoteCounts;
  battle: Battle;
}

interface SlideVencedorProps {
  winner: string;
  battle: Battle | null;
}

interface SlideRankingProps {
  gladiators: Gladiator[];
}

const SlideBatalha = ({ battle, round, votes, rx }: SlideBatalhaProps) => {
  const [showContent, setShowContent] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowContent(true), 100); return () => clearTimeout(t); }, []);
  const rxTotal = rx.fire + rx.heart + rx.impact;

  return (
    <div className="w-full max-w-[1400px] px-4">
      {/* Round badge */}
      <div className={cn("flex items-center justify-center gap-6 mb-10 transition-all duration-700",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(220,0,0,0.6))" }} />
        <div className="flex items-center gap-3 px-6 py-2 border border-red-900/40 bg-red-950/30"
          style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span className="text-red-400/90 tracking-[0.4em] text-sm font-mono">ROUND {round} / 3</span>
          {round === 3 && <span className="text-red-300 text-xs font-mono tracking-widest">· FINAL</span>}
        </div>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(220,0,0,0.6))" }} />
      </div>

      {/* Gladiators */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-10">
        <CinemaGladiator
          name={battle.gladiator_a_name}
          energy={battle.gladiator_a_energy}
          avatar={battle.gladiator_a_avatar}
          side="left"
          delay={0}
          show={showContent}
        />

        {/* Centre */}
        <div className={cn("flex flex-col items-center gap-6 shrink-0 transition-all duration-700 delay-300",
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-75")}>
          <div className="relative">
            <img src="/rrpl.jpg" alt="RRPL"
              className={cn("w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-cover rounded-full",
                round === 3 ? "animate-intense-glitch" : "animate-pulse-glow")}
              style={{ filter: "drop-shadow(0 0 30px rgba(200,0,0,0.8)) drop-shadow(0 0 60px rgba(200,0,0,0.3))" }} />
            {/* Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
          <div className="relative">
            <span className="font-display text-5xl md:text-6xl lg:text-7xl tracking-[0.3em] text-glow">VS</span>
            <div className="absolute inset-0 blur-xl bg-red-600/20" />
          </div>
        </div>

        <CinemaGladiator
          name={battle.gladiator_b_name}
          energy={battle.gladiator_b_energy}
          avatar={battle.gladiator_b_avatar}
          side="right"
          delay={150}
          show={showContent}
        />
      </div>

      {/* Stats row */}
      <div className={cn("flex items-center justify-center gap-12 transition-all duration-700 delay-500",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
        {/* Reactions */}
        {rxTotal > 0 && (
          <div className="flex items-center gap-8">
            {[
              { e: "🔥", c: rx.fire,   color: "text-red-400" },
              { e: "❤️", c: rx.heart,  color: "text-pink-400" },
              { e: "⚡", c: rx.impact, color: "text-yellow-400" },
            ].map(r => (
              <div key={r.e} className="flex flex-col items-center gap-1">
                <span className="text-2xl md:text-3xl">{r.e}</span>
                <span className={cn("font-display text-2xl md:text-3xl", r.color)}>{r.c}</span>
              </div>
            ))}
          </div>
        )}

        {/* Votes */}
        {votes.total > 0 && (
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/40 tracking-widest uppercase truncate max-w-[80px]">
              {battle.gladiator_a_name.split(" ")[0]}
            </span>
            <div className="relative w-40 md:w-56 h-2 bg-white/10 overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
                style={{ width: `${votes.percentA}%` }} />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/70">{votes.percentA}%</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/70">{votes.percentB}%</span>
            </div>
            <span className="font-mono text-xs text-white/40 tracking-widest uppercase truncate max-w-[80px]">
              {battle.gladiator_b_name.split(" ")[0]}
            </span>
            <span className="font-mono text-[10px] text-white/25">{votes.total}V</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CinemaGladiator = ({ name, energy, avatar, side, delay, show }: CinemaGladiatorProps) => (
  <div className={cn(
    "flex flex-col items-center gap-5 transition-all duration-700",
    show ? "opacity-100 translate-x-0" : side === "left" ? "opacity-0 -translate-x-16" : "opacity-0 translate-x-16"
  )} style={{ transitionDelay: `${delay}ms` }}>

    {/* Avatar */}
    <div className="relative group">
      <div className="w-36 h-36 md:w-52 md:h-52 lg:w-64 lg:h-64 overflow-hidden border border-red-900/40 flex items-center justify-center relative"
        style={{
          clipPath: "polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)",
          boxShadow: "0 0 40px rgba(180,0,0,0.3), inset 0 0 40px rgba(180,0,0,0.05)",
        }}>
        {/* Corner ticks */}
        {["top-2 left-2 border-l border-t","top-2 right-2 border-r border-t","bottom-2 left-2 border-l border-b","bottom-2 right-2 border-r border-b"].map((c, i) => (
          <span key={i} className={`absolute ${c} w-5 h-5 border-red-500/60 z-10`} />
        ))}

        {avatar ? (
          <>
            <img src={avatar} alt={name}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: "contrast(1.1) saturate(0.9)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)", backgroundSize: "100% 4px" }} />
          </>
        ) : (
          <span className="font-display text-7xl md:text-9xl text-white/10">
            {side === "left" ? "A" : "B"}
          </span>
        )}
      </div>

      {/* Side accent line */}
      <div className={cn(
        "absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-red-500/60 to-transparent",
        side === "left" ? "-left-2" : "-right-2"
      )} />
    </div>

    {/* Name */}
    <div className="text-center relative">
      <h2 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-[0.1em] leading-none"
        style={{ textShadow: "0 0 30px rgba(200,0,0,0.7), 0 0 60px rgba(200,0,0,0.3)" }}>
        {name}
      </h2>
      {/* Underline flicker */}
      <div className="mt-2 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent animate-pulse" />
    </div>

    {/* Energy bar */}
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-white/30 tracking-widest">ENERGIA</span>
        <span className="font-mono text-[10px] text-red-400/70">{energy}%</span>
      </div>
      <div className="h-2 bg-white/5 overflow-hidden" style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>
        <div className="h-full transition-all duration-1000"
          style={{
            width: `${energy}%`,
            background: energy > 60 ? "linear-gradient(to right, #7f0000, #ff2200)" : energy > 30 ? "linear-gradient(to right, #7f3000, #ff6600)" : "linear-gradient(to right, #4a0000, #cc0000)",
            boxShadow: "4px 0 12px rgba(200,0,0,0.6)",
          }} />
      </div>
    </div>
  </div>
);

const SlideRanking = ({ gladiators }: SlideRankingProps) => {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setVisible(i); if (i >= gladiators.length) clearInterval(t); }, 180);
    return () => clearInterval(t);
  }, [gladiators.length]);

  return (
    <div className="w-full max-w-3xl">
      {/* Title */}
      <div className="flex items-center justify-center gap-6 mb-10">
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(200,0,0,0.5))" }} />
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500" style={{ filter: "drop-shadow(0 0 8px rgba(255,200,0,0.6))" }} />
          <span className="font-display text-3xl md:text-5xl tracking-[0.3em]"
            style={{ textShadow: "0 0 20px rgba(200,0,0,0.8), 0 0 40px rgba(200,0,0,0.4)" }}>
            RANKING
          </span>
          <Trophy className="w-5 h-5 text-yellow-500" style={{ filter: "drop-shadow(0 0 8px rgba(255,200,0,0.6))" }} />
        </div>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(200,0,0,0.5))" }} />
      </div>

      <div className="space-y-2">
        {gladiators.map((g, i) => (
          <div key={g.id}
            className={cn("flex items-center gap-4 px-5 py-3 border transition-all duration-500 overflow-hidden",
              i === 0 ? "border-red-800/50 bg-red-950/40" : "border-white/5 bg-white/2",
              i < visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )}
            style={{
              clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
              boxShadow: i === 0 ? "0 0 30px rgba(180,0,0,0.2), inset 0 0 20px rgba(180,0,0,0.05)" : "none",
              transitionDelay: `${i * 60}ms`,
            }}>

            {/* Position */}
            <span className={cn("font-display text-xl w-8 text-center shrink-0",
              i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-white/20")}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>

            {/* Avatar */}
            {g.avatarUrl && (
              <div className="w-10 h-10 shrink-0 overflow-hidden relative border border-white/10"
                style={{ clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)" }}>
                <img src={g.avatarUrl} alt={g.name}
                  className="absolute inset-0 w-full h-full object-cover object-top" />
              </div>
            )}

            {/* Name */}
            <span className={cn("font-display text-lg md:text-2xl tracking-wider flex-1 truncate",
              i === 0 ? "text-white" : "text-white/60")}
              style={i === 0 ? { textShadow: "0 0 20px rgba(200,0,0,0.6)" } : {}}>
              {g.name}
            </span>

            {/* Win rate bar */}
            <div className="w-24 hidden md:block">
              <div className="h-1 bg-white/5 overflow-hidden mb-1">
                <div className="h-full bg-red-600/70" style={{ width: `${g.winRate}%` }} />
              </div>
              <span className="font-mono text-[10px] text-white/25">{g.winRate}% WIN</span>
            </div>

            {/* Wins */}
            <div className="text-right shrink-0">
              <span className="font-display text-2xl md:text-3xl"
                style={{ color: i === 0 ? "#ff4444" : "rgba(255,255,255,0.5)", textShadow: i === 0 ? "0 0 15px rgba(200,0,0,0.6)" : "none" }}>
                {g.wins}
              </span>
              <span className="font-mono text-[10px] text-white/25 ml-1">V</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SlideReacoes = ({ rx, battle }: SlideReacoesProps) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);
  const total = rx.fire + rx.heart + rx.impact || 1;

  return (
    <div className="w-full max-w-4xl text-center">
      <div className={cn("flex items-center justify-center gap-6 mb-14 transition-all duration-700",
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(200,0,0,0.5))" }} />
        <span className="font-display text-3xl md:text-5xl tracking-[0.3em]"
          style={{ textShadow: "0 0 20px rgba(200,0,0,0.8)" }}>
          REAÇÕES AO VIVO
        </span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(200,0,0,0.5))" }} />
      </div>

      <div className="grid grid-cols-3 gap-6 md:gap-10">
        {[
          { emoji: "🔥", label: "FOGO",    count: rx.fire,   accent: "#ff4400", shadow: "rgba(255,68,0,0.5)",  delay: 0   },
          { emoji: "❤️", label: "CORAÇÃO", count: rx.heart,  accent: "#ff1155", shadow: "rgba(255,17,85,0.5)", delay: 150 },
          { emoji: "⚡", label: "IMPACTO", count: rx.impact, accent: "#ffcc00", shadow: "rgba(255,204,0,0.5)", delay: 300 },
        ].map(r => (
          <div key={r.label}
            className={cn("flex flex-col items-center gap-5 p-6 md:p-8 border transition-all duration-700",
              show ? "opacity-100 scale-100" : "opacity-0 scale-90")}
            style={{
              transitionDelay: `${r.delay}ms`,
              borderColor: `${r.accent}40`,
              background:  `radial-gradient(ellipse at 50% 0%, ${r.accent}15, transparent 70%)`,
              clipPath: "polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)",
              boxShadow: `0 0 30px ${r.shadow}20, inset 0 0 20px ${r.shadow}05`,
            }}>
            <span className="text-5xl md:text-7xl">{r.emoji}</span>
            <span className="font-display text-5xl md:text-7xl lg:text-8xl"
              style={{ color: r.accent, textShadow: `0 0 20px ${r.shadow}, 0 0 40px ${r.shadow}` }}>
              {r.count}
            </span>
            <span className="font-mono text-xs tracking-[0.3em] text-white/40">{r.label}</span>
            <div className="w-full h-1.5 bg-white/5 overflow-hidden">
              <div className="h-full transition-all duration-1000" style={{ width: `${Math.round(r.count/total*100)}%`, background: r.accent, boxShadow: `4px 0 12px ${r.shadow}` }} />
            </div>
            <span className="font-mono text-[11px] text-white/30">{Math.round(r.count/total*100)}%</span>
          </div>
        ))}
      </div>

      {battle && (
        <p className={cn("mt-10 font-display text-xl md:text-2xl tracking-[0.2em] text-white/20 transition-all duration-700 delay-500",
          show ? "opacity-100" : "opacity-0")}>
          {battle.gladiator_a_name} — VS — {battle.gladiator_b_name}
        </p>
      )}
    </div>
  );
};

const SlideVotos = ({ votes, battle }: SlideVotosProps) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="w-full max-w-3xl text-center">
      <div className={cn("flex items-center justify-center gap-6 mb-12 transition-all duration-700",
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(200,0,0,0.5))" }} />
        <span className="font-display text-3xl md:text-5xl tracking-[0.3em]"
          style={{ textShadow: "0 0 20px rgba(200,0,0,0.8)" }}>
          VOTOS DO PÚBLICO
        </span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(200,0,0,0.5))" }} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {[
          { name: battle.gladiator_a_name, avatar: battle.gladiator_a_avatar, pct: votes.percentA, count: votes.a, leading: votes.a >= votes.b, delay: 0   },
          { name: battle.gladiator_b_name, avatar: battle.gladiator_b_avatar, pct: votes.percentB, count: votes.b, leading: votes.b > votes.a,  delay: 150 },
        ].map(s => (
          <div key={s.name}
            className={cn("flex flex-col items-center gap-5 p-6 md:p-8 border-2 transition-all duration-700",
              s.leading ? "border-red-700/60 bg-red-950/30" : "border-white/8 bg-black/30",
              show ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
            style={{
              transitionDelay: `${s.delay}ms`,
              clipPath: "polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)",
              boxShadow: s.leading ? "0 0 40px rgba(180,0,0,0.25), inset 0 0 30px rgba(180,0,0,0.08)" : "none",
            }}>

            {s.avatar && (
              <div className="w-20 h-20 md:w-28 md:h-28 overflow-hidden relative border border-white/10"
                style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
                <img src={s.avatar} alt={s.name} className="absolute inset-0 w-full h-full object-cover object-top" />
              </div>
            )}

            <h3 className="font-display text-2xl md:text-4xl tracking-wider text-center leading-tight"
              style={s.leading ? { textShadow: "0 0 20px rgba(200,0,0,0.7)" } : { color: "rgba(255,255,255,0.5)" }}>
              {s.name}
            </h3>

            <div className="font-display text-6xl md:text-8xl"
              style={{
                color: s.leading ? "#ff2200" : "rgba(255,255,255,0.3)",
                textShadow: s.leading ? "0 0 30px rgba(200,0,0,0.8), 0 0 60px rgba(200,0,0,0.3)" : "none",
              }}>
              {s.pct}%
            </div>

            <span className="font-mono text-xs text-white/30 tracking-widest">
              {s.count} {s.count === 1 ? "VOTO" : "VOTOS"}
            </span>
          </div>
        ))}
      </div>

      {/* Vote bar */}
      <div className={cn("transition-all duration-700 delay-300", show ? "opacity-100" : "opacity-0")}>
        <div className="relative h-3 bg-white/5 overflow-hidden mb-3"
          style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}>
          <div className="absolute left-0 top-0 h-full transition-all duration-1000"
            style={{ width: `${votes.percentA}%`, background: "linear-gradient(to right, #7f0000, #ff2200)", boxShadow: "4px 0 16px rgba(200,0,0,0.6)" }} />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        </div>
        <span className="font-mono text-xs text-white/25 tracking-widest">{votes.total} VOTOS REGISTADOS</span>
      </div>
    </div>
  );
};

interface Dot {
  x: number;
  y: number;
  inFace: boolean;
  side: string;
  bright: number;
  baseAlpha: number;
  currentAlpha: number;
  targetAlpha: number;
  delay: number;
  flicker: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  isBlue: boolean;
}

const SlideVencedor = ({ winner, battle }: SlideVencedorProps) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pCanvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase]       = useState(0);
  const [showName, setShowName] = useState(false);
  const [showTag, setShowTag]   = useState(false);
  const animRef   = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const dotsRef   = useRef<Dot[]>([]);
  const partsRef  = useRef<Particle[]>([]);

  const DOT_SIZE = 5, GAP = 3, PITCH = DOT_SIZE + GAP;

  const buildDots = useCallback((W: number, H: number) => {
    const dots: Dot[] = [];
    const cx = W * 0.5, cy = H * 0.44;
    const faceW = Math.min(W * 0.58, H * 0.82);
    const faceH = faceW * 1.38;
    const cols = Math.ceil(W / PITCH) + 2;
    const rows = Math.ceil(H / PITCH) + 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * PITCH + PITCH / 2;
        const y = r * PITCH + PITCH / 2;
        const nx = (x - cx) / (faceW * 0.5);
        const ny = (y - cy) / (faceH * 0.5);
        const dist = Math.sqrt(nx * nx + ny * ny);
        const chinFactor = ny > 0.3 ? 1 + ny * 0.4 : 1;
        const inFace = dist * chinFactor < 0.95;
        const side = nx < 0 ? "blue" : "red";

        let bright = 0;
        if (inFace) {
          const eyeY = -0.18;
          const eyeL = Math.sqrt((nx + 0.28) ** 2 + (ny - eyeY) ** 2);
          const eyeR = Math.sqrt((nx - 0.28) ** 2 + (ny - eyeY) ** 2);
          if (eyeL < 0.13 || eyeR < 0.13) bright = 1.0;
          else if (Math.abs(ny - 0.33) < 0.09 && Math.abs(nx) < 0.30) bright = 0.92;
          else if (Math.abs(nx) < 0.07 && ny > -0.05 && ny < 0.22) bright = 0.45;
          else if (Math.abs(Math.abs(nx) - 0.48) < 0.14 && Math.abs(ny - 0.06) < 0.13) bright = 0.72;
          else bright = Math.max(0, 0.38 - dist * 0.38 + Math.random() * 0.14);
        }

        dots.push({
          x, y, inFace, side, bright,
          baseAlpha: inFace ? 0.06 : 0.015,
          currentAlpha: 0.015,
          targetAlpha: 0,
          delay: Math.random() * 2200,
          flicker: Math.random() * Math.PI * 2,
          speed: 0.7 + Math.random() * 1.6,
        });
      }
    }
    dotsRef.current = dots;
  }, [PITCH]);

  const spawnParticle = useCallback((W: number, H: number) => {
    partsRef.current.push({
      x: Math.random() * W, y: H + 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(1.5 + Math.random() * 3),
      size: 1 + Math.random() * 2.5,
      life: 1,
      decay: 0.005 + Math.random() * 0.009,
      isBlue: Math.random() < 0.38,
    });
  }, []);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const pCanvas = pCanvasRef.current;
    if (!canvas || !pCanvas) return;

    const W = canvas.width  = pCanvas.width  = canvas.offsetWidth;
    const H = canvas.height = pCanvas.height = canvas.offsetHeight;
    const lctx = canvas.getContext("2d")!;
    const pctx = pCanvas.getContext("2d")!;

    buildDots(W, H);

    // Start LED build after 300ms
    setTimeout(() => {
      startRef.current = performance.now();
      setPhase(1);
    }, 300);

    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop);
      const elapsed = t - startRef.current;

      // Update dots
      dotsRef.current.forEach((d) => {
        const flicker = Math.sin(t * 0.001 * d.speed + d.flicker) * 0.12 + 0.88;
        if (phase >= 1 || elapsed > 0) {
          const progress = d.inFace ? Math.min(1, Math.max(0, (elapsed - d.delay) / 1600)) : 0;
          d.targetAlpha = d.inFace ? d.bright * 0.85 + 0.06 : d.baseAlpha * 0.3;
          d.currentAlpha += (d.targetAlpha * progress - d.currentAlpha) * 0.05;
        }

        const alpha = d.currentAlpha * flicker;
        let r = 30, g = 10, b = 10;
        if (d.side === "blue") {
          r = 20; g = 50; b = 220;
          if (d.bright > 0.7) { r = 90; g = 140; b = 255; }
        } else {
          r = 220; g = 30; b = 20;
          if (d.bright > 0.7) { r = 255; g = 160; b = 80; }
        }

        if (alpha > 0.35 && d.bright > 0.45) {
          lctx.beginPath();
          lctx.arc(d.x, d.y, DOT_SIZE * 1.9, 0, Math.PI * 2);
          lctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.2})`;
          lctx.fill();
        }
        lctx.beginPath();
        lctx.arc(d.x, d.y, DOT_SIZE / 2, 0, Math.PI * 2);
        lctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        lctx.fill();
      });

      // Particles
      if (Math.random() < 0.45) spawnParticle(W, H);
      pctx.clearRect(0, 0, W, H);
      partsRef.current = partsRef.current.filter(p => p.life > 0);
      partsRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.025; p.life -= p.decay;
        pctx.beginPath();
        pctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pctx.fillStyle = p.isBlue
          ? `rgba(60,120,255,${p.life * 0.65})`
          : `rgba(255,${50 + (1 - p.life) * 80},20,${p.life * 0.65})`;
        pctx.fill();
      });
    };

    // Text reveal timing
    setTimeout(() => setShowName(true), 2400);
    setTimeout(() => setShowTag(true),  3800);

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* LED wall canvas — full screen */}
      <canvas ref={canvasRef}   className="absolute inset-0 w-full h-full" />
      <canvas ref={pCanvasRef}  className="absolute inset-0 w-full h-full" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.82) 100%)" }} />

      {/* Centre divider line */}
      <div className="absolute inset-y-0 left-1/2 w-px pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)" }} />

      {/* Logo top-left — estilo da imagem */}
      <div className="absolute top-[10%] left-[6%] z-20 flex items-center gap-3">
        <img src="/rrpl.jpg" alt="RRPL"
          className="w-10 h-10 object-cover rounded-full border border-white/20"
          style={{ filter: "drop-shadow(0 0 8px rgba(200,0,0,0.6))" }} />
        <div>
          <p className="font-mono text-[10px] text-white/50 tracking-widest">JULGAMENTO</p>
          <p className="font-display text-2xl leading-none"
            style={{ textShadow: "0 0 15px rgba(200,0,0,0.8)" }}>FINAL</p>
        </div>
      </div>

      {/* Winner text — centre overlay */}
      <div className="relative z-20 text-center pointer-events-none px-8">
        {/* Label */}
        <div className={cn(
          "flex items-center justify-center gap-4 mb-6 transition-all duration-700",
          showName ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, rgba(255,50,50,0.7))" }} />
          <span className="font-mono text-xs tracking-[0.5em] text-red-400/80">◢ VENCEDOR ◣</span>
          <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, rgba(255,50,50,0.7))" }} />
        </div>

        {/* Name */}
        <h1
          className={cn(
            "font-display leading-none tracking-[0.08em] crack-text transition-all duration-700",
            showName ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
          style={{
            fontSize: "clamp(3.5rem, 11vw, 10rem)",
            background: "linear-gradient(135deg, #ffffff 25%, #ff6644 75%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(200,0,0,0.6))",
          }}>
          {winner}
        </h1>

        {/* Tagline */}
        <p className={cn(
          "font-mono mt-6 tracking-[0.4em] text-white/30 transition-all duration-1000",
          showTag ? "opacity-100" : "opacity-0"
        )}
          style={{ fontSize: "clamp(9px, 1.4vw, 14px)" }}>
          A PALAVRA CORTOU · A ARENA DECIDIU
        </p>

        {battle && (
          <p className={cn(
            "font-mono mt-2 tracking-[0.3em] text-white/15 transition-all duration-1000 delay-300",
            showTag ? "opacity-100" : "opacity-0"
          )}
            style={{ fontSize: "clamp(8px, 1.1vw, 12px)" }}>
            {battle.gladiator_a_name} — VS — {battle.gladiator_b_name}
          </p>
        )}
      </div>
    </div>
  );
};

const SlideJulgando = () => {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-center">
      <div className="relative inline-block mb-10">
        <div className="w-20 h-20 md:w-28 md:h-28 border-4 border-red-600/30 border-t-red-500 rounded-full animate-spin mx-auto mb-6"
          style={{ animationDuration: "1.2s" }} />
        <div className="absolute inset-0 w-20 h-20 md:w-28 md:h-28 border-4 border-transparent border-b-red-900/40 rounded-full animate-spin mx-auto"
          style={{ animationDuration: "2s", animationDirection: "reverse" }} />
      </div>
      <h1 className="font-display text-[6vw] md:text-[8vw] leading-none tracking-[0.15em] mb-6"
        style={{ color: "rgba(255,255,255,0.2)" }}>
        JULGANDO{".".repeat(dots)}
      </h1>
      <p className="font-mono text-sm md:text-base tracking-[0.4em] animate-pulse"
        style={{ color: "rgba(200,50,50,0.7)" }}>
        A IA ANALISA OS DADOS
      </p>
    </div>
  );
};

const SlideAguardar = () => (
  <div className="text-center">
    <img src="/rrpl.jpg" alt="RRPL"
      className="w-36 h-36 md:w-56 md:h-56 lg:w-72 lg:h-72 object-cover rounded-full mx-auto mb-10 animate-pulse-glow"
      style={{ filter: "drop-shadow(0 0 40px rgba(200,0,0,0.7)) drop-shadow(0 0 80px rgba(200,0,0,0.3))" }} />
    <h1 className="font-display tracking-[0.2em] mb-4"
      style={{ fontSize: "clamp(2rem,7vw,8rem)", color: "rgba(255,255,255,0.12)" }}>
      THE FINAL VERDICT
    </h1>
    <p className="font-mono text-xs tracking-[0.5em] animate-pulse" style={{ color: "rgba(200,50,50,0.5)" }}>
      A AGUARDAR BATALHA...
    </p>
  </div>
);

export default Apresentacao;
