import { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import RitualLogo from "./RitualLogo";
import RealFlameEffect from "./RealFlameEffect";
import JudgmentScorecard from "./JudgmentScorecard";
import { cn } from "@/lib/utils";
import { useJudgmentAudio } from "@/hooks/useJudgmentAudio";
import { useBattleSFX } from "@/hooks/useBattleSFX";
import { Volume2, VolumeX } from "lucide-react";
import { BattleScorecard } from "@/lib/battleScoring";

interface JudgmentOverlayProps {
  isActive: boolean;
  winnerName?: string;
  scorecard?: BattleScorecard | null;
  gladiatorAName?: string;
  gladiatorBName?: string;
  onComplete?: () => void;
  onWinnerRevealed?: () => void;
}

type Phase = "intro" | "judging" | "analysis" | "reveal" | "winner";

const JudgmentOverlay = ({
  isActive,
  winnerName,
  scorecard,
  gladiatorAName = "GLADIADOR A",
  gladiatorBName = "GLADIADOR B",
  onComplete,
  onWinnerRevealed,
}: JudgmentOverlayProps) => {
  const [phase, setPhase]               = useState<Phase>("intro");
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [showFlames, setShowFlames]     = useState(false);
  const [currentLine, setCurrentLine]   = useState(0); // linha activa na fase judging
  const { playAnnouncement, playPhrase, stopAudio, isPlaying, isLoading } = useJudgmentAudio();
  const { playSFX } = useBattleSFX();
  const runningRef = useRef(false);
  const cancelRef  = useRef(false);

  useEffect(() => {
    if (!isActive) {
      stopAudio();
      setPhase("intro");
      setVisibleRounds(0);
      setShowFlames(false);
      setCurrentLine(0);
      runningRef.current = false;
      return;
    }

    if (runningRef.current) return;
    runningRef.current = true;
    cancelRef.current  = false;

    const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    // Diz uma frase e aguarda — combina texto visível + áudio
    const say = async (text: string, fallbackMs = 2200) => {
      if (cancelRef.current) return;
      try {
        await playPhrase(text, "serious");
      } catch {
        await wait(fallbackMs);
      }
    };

    const run = async () => {
      // ── FASE 1: INTRO ─────────────────────────────────────────────────
      setPhase("intro");
      setCurrentLine(0);
      playSFX("judgment", 4);

      await wait(700);
      if (cancelRef.current) return;
      await say("O julgamento começa. Tremam.", 2200);
      await wait(400);

      // ── FASE 2: JUDGING ───────────────────────────────────────────────
      if (cancelRef.current) return;
      setPhase("judging");
      setCurrentLine(0);

      await wait(500);
      setCurrentLine(1);
      await say("Silêncio. A arena vai falar.", 1600);
      if (cancelRef.current) return;

      setCurrentLine(2);
      await say("As palavras cortaram como lâminas.", 1900);
      if (cancelRef.current) return;

      setCurrentLine(3);
      await say("O sangue foi derramado no palco.", 1900);
      if (cancelRef.current) return;
      await wait(400);

      // ── FASE 3: ANALYSIS ─────────────────────────────────────────────
      setPhase("analysis");
      setCurrentLine(0);
      if (cancelRef.current) return;

      await wait(600);
      await say("Análise técnica. Rimas afiadas. Punchlines cruéis.", 3200);
      if (cancelRef.current) return;

      setVisibleRounds(1);
      await say("Primeira ronda.", 1200);
      if (cancelRef.current) return;

      setVisibleRounds(2);
      await say("Segunda ronda.", 1200);
      if (cancelRef.current) return;

      setVisibleRounds(3);
      await say("Terceira ronda. Pontuação final consolidada.", 2600);
      if (cancelRef.current) return;
      await wait(700);

      // ── FASE 4: REVEAL ────────────────────────────────────────────────
      setPhase("reveal");
      if (cancelRef.current) return;

      await wait(700);
      await say("Por decisão absoluta do julgamento final...", 2600);
      if (cancelRef.current) return;

      await say("O vencedor desta batalha é...", 2200);
      if (cancelRef.current) return;

      // ── FASE 5: WINNER ── Nome + voz em simultâneo ────────────────────
      setPhase("winner");
      setShowFlames(true);
      if (cancelRef.current) return;

      if (!winnerName) {
        onWinnerRevealed?.();
        onComplete?.();
        return;
      }

      // O nome aparece no ecrã enquanto a voz começa — sem delay extra
      try {
        await playAnnouncement(winnerName);
      } catch {
        await wait(4000);
      }

      if (cancelRef.current) return;
      await wait(500);
      onWinnerRevealed?.();
      onComplete?.();
    };

    run();

    return () => {
      cancelRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/98 flex items-center justify-center overflow-hidden scanlines">
      <RealFlameEffect isActive={showFlames} />

      {/* Corner brackets */}
      <span className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-primary/60" />
      <span className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-primary/60" />
      <span className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-primary/60" />
      <span className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-primary/60" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-2 border-b border-primary/20 bg-background/60 backdrop-blur-sm">
        <span className="mono-label-sm text-primary">◉ JULGAMENTO</span>
        <span className="mono-label-sm hidden md:inline">PROTOCOLO FINAL · IA SUPREMA</span>
        <span className="mono-label-sm text-primary/70">FASE / {phase.toUpperCase()}</span>
      </div>

      {/* Audio indicator */}
      <div className="absolute top-12 right-6 flex items-center gap-2 h-6">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {isPlaying && !isLoading && (
          <Volume2 className="w-4 h-4 text-primary animate-pulse" />
        )}
      </div>

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div className="text-center animate-fade-up px-4">
          <RitualLogo size="md" stage="intro" />
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="w-12 h-px bg-primary/40" />
            <span className="mono-label text-primary/80">RITUAL · FINAL</span>
            <span className="w-12 h-px bg-primary/40" />
          </div>
          <p className="font-display text-2xl md:text-4xl tracking-[0.3em] text-glow mt-4 animate-pulse-glow">
            O JULGAMENTO COMEÇA AGORA
          </p>
        </div>
      )}

      {/* ── JUDGING — linhas aparecem uma a uma em sincronia com a voz ── */}
      {phase === "judging" && (
        <div className="text-center space-y-6 px-4">
          <RitualLogo size="sm" stage="judging" className="mb-4" />
          <span className="mono-label text-primary/70 block">— DELIBERANDO —</span>

          <p className={cn(
            "font-display text-xl md:text-3xl tracking-[0.25em] transition-all duration-500",
            currentLine >= 1 ? "text-foreground opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            SILÊNCIO NA ARENA
          </p>
          <p className={cn(
            "font-display text-xl md:text-3xl tracking-[0.25em] transition-all duration-500",
            currentLine >= 2 ? "text-muted-foreground opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            AS PALAVRAS FORAM LANÇADAS
          </p>
          <p className={cn(
            "font-display text-xl md:text-3xl tracking-[0.25em] transition-all duration-500",
            currentLine >= 3 ? "text-muted-foreground opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            O IMPACTO FOI SENTIDO
          </p>

          <div className="mt-6 flex justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  currentLine > i ? "bg-primary" : "bg-primary/20"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ANALYSIS ── */}
      {phase === "analysis" && scorecard && (
        <div className="w-full max-h-[88vh] overflow-y-auto py-16 md:py-20">
          <JudgmentScorecard
            scorecard={scorecard}
            gladiatorAName={gladiatorAName}
            gladiatorBName={gladiatorBName}
            visibleRounds={visibleRounds}
          />
        </div>
      )}

      {/* ── REVEAL ── */}
      {phase === "reveal" && (
        <div className="text-center animate-fade-up px-4">
          <RitualLogo size="sm" stage="reveal" className="mb-4" />
          <span className="mono-label text-primary/70 block mb-3">VEREDITO</span>
          <p className="font-display text-2xl md:text-4xl tracking-[0.25em] text-muted-foreground mb-4">
            POR DECISÃO ABSOLUTA DO
          </p>
          <p className="font-display text-4xl md:text-6xl tracking-[0.3em] text-glow crack-text">
            JULGAMENTO FINAL
          </p>
          <div className="ritual-divider w-40 mx-auto my-5" />
          <p className="font-display text-2xl md:text-4xl tracking-[0.25em] text-muted-foreground mt-2 animate-pulse-glow">
            O VENCEDOR DESTA BATALHA É...
          </p>
        </div>
      )}

      {/* ── WINNER ── */}
      {phase === "winner" && winnerName && (
        <div className="text-center px-4">
          <span className="mono-label text-primary block mb-4">◢ VENCEDOR ABSOLUTO ◣</span>
          <div className="relative">
            <h1 className={cn(
              "font-display text-6xl md:text-9xl tracking-[0.2em] animate-crack-reveal",
              "text-glow crack-text"
            )}>
              {winnerName}
            </h1>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-fade-in delay-500" />
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-fade-in delay-700" />
            </div>
          </div>
          <div className="ritual-divider w-56 mx-auto mt-8 mb-4" />
          <p className="font-display text-xl md:text-2xl tracking-[0.3em] text-muted-foreground animate-fade-up delay-1000">
            A PALAVRA CORTOU. A ARENA DECIDIU.
          </p>
          {isPlaying && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              <span className="mono-label-sm text-primary/60">A ARENA FALA...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JudgmentOverlay;
