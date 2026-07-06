import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import SmokeBackground from "@/components/SmokeBackground";
import GladiatorCard from "@/components/GladiatorCard";
import RoundIndicator from "@/components/RoundIndicator";
import RoundTimer from "@/components/RoundTimer";
import ReactionPanel from "@/components/ReactionPanel";
import AIStatus from "@/components/AIStatus";
import JudgmentOverlay from "@/components/JudgmentOverlay";
import FireParticles from "@/components/FireParticles";
import CrackEffect from "@/components/CrackEffect";
import IntenseGlitch from "@/components/IntenseGlitch";
import BattleHistory from "@/components/BattleHistory";
import BattleSetupModal from "@/components/BattleSetupModal";
import VotePanel from "@/components/VotePanel";
import AudioRecorder from "@/components/AudioRecorder";
import { useVotes } from "@/hooks/useVotes";
import ArenaPinGate from "@/components/ArenaPinGate";
import { ArenaQRModal } from "@/components/QRCodeDisplay";
import { MusicControl } from "@/components/MusicControl";
import { useBattle } from "@/hooks/useBattle";
import { useBattleHistory } from "@/hooks/useBattleHistory";
import { useGladiators } from "@/hooks/useGladiators";
import { useBattleSFX } from "@/hooks/useBattleSFX";
import { useBattleMusic } from "@/hooks/useBattleMusic";
import { ArrowLeft, Swords, Scale, QrCode, RefreshCw, History, Target, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Arena = () => {
  const navigate = useNavigate();
  const {
    battle,
    reactionCounts,
    loading,
    scorecard,
    isSetup,
    isAnalyzing,
    recordingPhase,
    sendReaction,
    advanceRound,
    registerRecording,
    startJudgment,
    createNewBattle,
    setupBattle,
  } = useBattle();
  const { addToHistory } = useBattleHistory();
  const { recordBattleResult } = useGladiators();
  const { votes, hasVoted, votedSide, isVoting, castVote } = useVotes(battle?.id);
  const { playSFX } = useBattleSFX();
  const { isPlaying, isLoading, volume, toggleMusic, stopMusic, changeVolume } = useBattleMusic();
  const [showQRCode, setShowQRCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCrack, setShowCrack] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSetupStart = async (nameA: string, nameB: string, avatarA?: string, avatarB?: string) => {
    setSetupLoading(true);
    await setupBattle(nameA, nameB, avatarA, avatarB);
    setSetupLoading(false);
  };

  const currentRound = battle?.current_round || 1;
  const gladiatorAEnergy = battle?.gladiator_a_energy || 75;
  const gladiatorBEnergy = battle?.gladiator_b_energy || 68;
  const status = battle?.status || "active";
  const winner = battle?.winner || null;

  const aiStatus = status === "active" ? "observing" : status === "judging" ? "judging" : "decided";

  const handleNextRound = async () => {
    window.speechSynthesis.cancel();
    await advanceRound();
    setTimeout(() => playSFX("round_start", 2), 300);
  };

  // Quando o timer expira — avança round automaticamente se possível
  const handleTimerExpire = async () => {
    playSFX("round_end");
    if (currentRound < 3) {
      // Espera 2s para o som do gongo terminar, depois avança
      setTimeout(() => handleNextRound(), 2000);
    }
    // Se for round 3, apenas toca o som — árbitro decide quando julgar
  };

  const handleStartJudgment = async () => {
    setShowCrack(true);
    setShowPercentages(false); // Hide percentages during judgment
    setTimeout(() => setShowCrack(false), 2000);
    await startJudgment();
  };

  const handleWinnerRevealed = async () => {
    setShowPercentages(true);

    if (battle && winner) {
      const loserName = winner === battle.gladiator_a_name
        ? battle.gladiator_b_name
        : battle.gladiator_a_name;

      const reactions = {
        fire:   reactionCounts.fire,
        heart:  reactionCounts.heart,
        impact: reactionCounts.impact,
      };

      // Actualiza stats dos gladiadores registados
      await recordBattleResult(winner, loserName, reactions);

      // Guarda no histórico
      await addToHistory({
        battle_id:              battle.id,
        gladiator_a_name:       battle.gladiator_a_name,
        gladiator_b_name:       battle.gladiator_b_name,
        gladiator_a_final_energy: battle.gladiator_a_energy,
        gladiator_b_final_energy: battle.gladiator_b_energy,
        winner,
        total_reactions:  reactions.fire + reactions.heart + reactions.impact,
        fire_reactions:   reactions.fire,
        heart_reactions:  reactions.heart,
        impact_reactions: reactions.impact,
        scorecard:        scorecard ?? null,
      });
    }
  };

  const handleReaction = async (emoji: string) => {
    await sendReaction(emoji);
    // Quick reaction sound
    playSFX("reaction", 1);
  };

  const handleNewBattle = async () => {
    setShowPercentages(false);
    await createNewBattle();
  };

  const qrCodeUrl = `${window.location.origin}/publico`;

  const reactions = [
    { emoji: "🔥", label: "FOGO", count: reactionCounts.fire },
    { emoji: "❤️", label: "CORAÇÃO", count: reactionCounts.heart },
    { emoji: "⚡", label: "IMPACTO", count: reactionCounts.impact },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-display text-xl text-primary animate-pulse-glow">
            PREPARANDO ARENA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ArenaPinGate>
    <div className={cn(
      "relative min-h-screen overflow-hidden scanlines",
      status === "judging" && "animate-screen-shake"
    )}>
      <SmokeBackground />
      <FireParticles intensity={currentRound === 3 ? "high" : currentRound === 2 ? "medium" : "low"} />
      <CrackEffect isActive={showCrack} />
      
      {/* Blood gradient overlay */}
      <div className="absolute inset-0 blood-gradient pointer-events-none z-[1]" />
      
      {/* Arena vignette */}
      <div className="absolute inset-0 arena-vignette pointer-events-none z-[2]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-primary/20 bg-background/60 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">SAIR</span>
        </Button>

        <div className="flex flex-col items-center gap-1">
          <Logo size="sm" />
          <span className="mono-label-sm hidden md:inline">RITUAL · 001 · AO VIVO</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2 hover:text-primary hover:bg-primary/10"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">HISTÓRICO</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQRCode(!showQRCode)}
            className="gap-2 hover:text-primary hover:bg-primary/10"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden md:inline">QR CODE</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("/apresentacao", "_blank")}
            className="gap-2 hover:text-primary hover:bg-primary/10"
            title="Modo Apresentação — abre em nova janela para projectar"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden md:inline">APRESENTAÇÃO</span>
          </Button>
          <AIStatus status={aiStatus} className="hidden md:flex" />
        </div>
      </header>

      {/* Editorial sub-header bar */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-10 py-2 border-b border-primary/10 bg-background/40">
        <span className="mono-label-sm">◉ REC</span>
        <span className="mono-label-sm hidden md:inline">SISTEMA: ATIVO · JURI: IA</span>
        <span className="mono-label-sm text-primary/70">N°{String(currentRound).padStart(3, "0")}</span>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed right-4 top-20 z-40 w-80 bg-card/95 backdrop-blur-sm border border-border rounded-sm p-4 shadow-xl">
          <BattleHistory />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(false)}
            className="w-full mt-2"
          >
            FECHAR
          </Button>
        </div>
      )}

      {/* QR Code Modal */}
      <ArenaQRModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        publicoUrl={qrCodeUrl}
        gladiatorAName={battle?.gladiator_a_name}
        gladiatorBName={battle?.gladiator_b_name}
        currentRound={currentRound}
      />

      {/* Mobile AI Status */}
      <div className="md:hidden flex justify-center py-2">
        <AIStatus status={aiStatus} />
      </div>

      {/* Main Arena Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 md:py-10">
        {/* Round Indicator */}
        <RoundIndicator currentRound={currentRound} className="mb-6 md:mb-8" />

        {/* Round Timer */}
        <RoundTimer
          durationSeconds={currentRound === 3 ? 180 : 120}
          isActive={status === "active"}
          onExpire={handleTimerExpire}
          className="mb-8 md:mb-12"
        />

        {/* Battle Area */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-10 items-center mb-8 md:mb-12">
          {/* Gladiator A */}
          <GladiatorCard
            name={battle?.gladiator_a_name || "MC FURY"}
            side="left"
            energy={gladiatorAEnergy}
            avatarUrl={battle?.gladiator_a_avatar}
            isWinner={winner === battle?.gladiator_a_name}
            showEnergy={showPercentages}
            className="animate-fade-up"
          />

          {/* VS Center */}
          <div className="flex flex-col items-center justify-center py-6 md:py-0">
            {/* Ritual ring with crosshair */}
            <div className="relative w-44 h-44 md:w-56 md:h-56 flex items-center justify-center">
              {/* outer rotating ring */}
              <div className="absolute inset-0 rounded-full crosshair-ring animate-slow-spin">
                {/* tick marks */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-0 w-px h-3 bg-primary/40 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-1px)`, transformOrigin: "50% 88px" }}
                  />
                ))}
              </div>
              {/* inner counter-rotating ring */}
              <div className="absolute inset-6 rounded-full border border-primary/25 animate-slow-spin-reverse" />
              {/* crosshair lines */}
              <span className="absolute left-0 right-0 top-1/2 h-px bg-primary/20" />
              <span className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/20" />
              {/* center logo */}
              <div className="relative">
                <img
                  src="/rrpl.jpg"
                  alt="RRPL"
                  className={cn(
                    "w-14 h-14 md:w-20 md:h-20 object-cover rounded-full relative z-10",
                    currentRound === 3 ? "animate-intense-glitch" : "animate-pulse-glow"
                  )}
                  style={{ filter: "drop-shadow(0 0 16px hsl(var(--arena-glow) / 0.7))" }}
                />
                <div className="absolute inset-0 blur-2xl bg-primary/40 rounded-full" />
              </div>
              {/* corner brackets */}
              <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-primary/60" />
              <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-primary/60" />
              <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-primary/60" />
              <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-primary/60" />
            </div>

            <IntenseGlitch
              text="VS"
              isActive={status === "judging"}
              intensity={status === "judging" ? "high" : "low"}
              className="font-display text-5xl md:text-7xl tracking-[0.3em] mt-4 text-glow"
            />
            <span className="mono-label-sm mt-2 flex items-center gap-2">
              <Target className="w-3 h-3 text-primary/70" />
              ZONA DE COLISÃO
            </span>
          </div>

          {/* Gladiator B */}
          <GladiatorCard
            name={battle?.gladiator_b_name || "SHADOW KING"}
            side="right"
            energy={gladiatorBEnergy}
            avatarUrl={battle?.gladiator_b_avatar}
            isWinner={winner === battle?.gladiator_b_name}
            showEnergy={showPercentages}
            className="animate-fade-up delay-200"
          />
        </div>

        {/* Audio Recorders */}
        {status === "active" && battle && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex flex-col items-center gap-2">
              <span className="mono-label-sm text-muted-foreground">{battle.gladiator_a_name}</span>
              <AudioRecorder
                gladiatorName={battle.gladiator_a_name}
                side="a"
                disabled={recordingPhase !== "awaiting_a"}
                onRecordingComplete={registerRecording}
              />
            </div>
            <span className="mono-label-sm text-primary/40">VS</span>
            <div className="flex flex-col items-center gap-2">
              <span className="mono-label-sm text-muted-foreground">{battle.gladiator_b_name}</span>
              <AudioRecorder
                gladiatorName={battle.gladiator_b_name}
                side="b"
                disabled={recordingPhase !== "awaiting_b"}
                onRecordingComplete={registerRecording}
              />
            </div>
          </div>
        )}

        {status === "active" && recordingPhase === "complete" && (
          <p className="text-center text-green-500/80 mono-label-sm mb-6">
            ◉ Ambos os gladiadores gravaram
          </p>
        )}

        {/* Reactions */}
        <ReactionPanel
          reactions={reactions}
          onReact={handleReaction}
          isInteractive={currentRound === 3 && status === "active"}
          className="mb-6"
        />

        {currentRound !== 3 && status === "active" && (
          <p className="text-center text-muted-foreground text-sm mb-6">
            Reações disponíveis apenas no Round 3
          </p>
        )}

        {/* Public votes panel */}
        {battle && (
          <VotePanel
            votes={votes}
            gladiatorAName={battle.gladiator_a_name}
            gladiatorBName={battle.gladiator_b_name}
            hasVoted={hasVoted}
            votedSide={votedSide}
            isVoting={isVoting}
            onCastVote={castVote}
            className="mb-8"
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {status === "active" && currentRound < 3 && recordingPhase === "complete" && (
            <Button
              variant="arena"
              size="lg"
              onClick={handleNextRound}
              className="gap-2"
            >
              PRÓXIMO ROUND
            </Button>
          )}
          
          {status === "active" && currentRound === 3 && recordingPhase === "complete" && (
            <Button
              variant="arena"
              size="xl"
              onClick={handleStartJudgment}
              disabled={isAnalyzing}
              className="gap-3"
            >
              <Scale className="w-5 h-5" />
              {isAnalyzing ? "A ANALISAR..." : "INICIAR JULGAMENTO"}
            </Button>
          )}

          {status === "finished" && (
            <Button
              variant="arena"
              size="lg"
              onClick={handleNewBattle}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              NOVA BATALHA
            </Button>
          )}
        </div>
      </main>

      {/* Battle Setup Modal — shown before battle starts */}
      <BattleSetupModal
        isOpen={!loading && !isSetup}
        onStart={handleSetupStart}
        isLoading={setupLoading}
      />

      {/* Judgment Overlay */}
      <JudgmentOverlay
        isActive={status === "judging"}
        winnerName={winner || undefined}
        scorecard={scorecard}
        gladiatorAName={battle?.gladiator_a_name || "MC FURY"}
        gladiatorBName={battle?.gladiator_b_name || "SHADOW KING"}
        onWinnerRevealed={handleWinnerRevealed}
        onComplete={() => {}}
      />

      {/* Corner decorations with enhanced glow */}
      <div className={cn(
        "absolute top-20 left-4 w-16 h-16 border-l-2 border-t-2 transition-all duration-500",
        currentRound === 3 ? "border-primary/70 shadow-[0_0_20px_hsl(var(--arena-glow)/0.5)]" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute top-20 right-4 w-16 h-16 border-r-2 border-t-2 transition-all duration-500",
        currentRound === 3 ? "border-primary/70 shadow-[0_0_20px_hsl(var(--arena-glow)/0.5)]" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 transition-all duration-500",
        currentRound === 3 ? "border-primary/70 shadow-[0_0_20px_hsl(var(--arena-glow)/0.5)]" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 transition-all duration-500",
        currentRound === 3 ? "border-primary/70 shadow-[0_0_20px_hsl(var(--arena-glow)/0.5)]" : "border-primary/30"
      )} />
      
      {/* Side glow accents */}
      <div className={cn(
        "absolute top-1/3 left-0 w-24 h-96 bg-gradient-to-r from-primary/5 to-transparent blur-3xl pointer-events-none transition-opacity duration-500",
        currentRound === 3 ? "opacity-100" : "opacity-50"
      )} />
      <div className={cn(
        "absolute top-1/3 right-0 w-24 h-96 bg-gradient-to-l from-primary/5 to-transparent blur-3xl pointer-events-none transition-opacity duration-500",
        currentRound === 3 ? "opacity-100" : "opacity-50"
      )} />

      {/* Music Control */}
      <MusicControl
        isPlaying={isPlaying}
        isLoading={isLoading}
        volume={volume}
        onToggle={toggleMusic}
        onVolumeChange={changeVolume}
      />
    </div>
    </ArenaPinGate>
  );
};

export default Arena;
