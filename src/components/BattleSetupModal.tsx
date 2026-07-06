import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Swords, User, ArrowRight, RefreshCw, ImageIcon, X, ChevronDown } from "lucide-react";
import { useGladiators } from "@/hooks/useGladiators";

interface BattleSetupModalProps {
  isOpen: boolean;
  onStart: (nameA: string, nameB: string, avatarA?: string, avatarB?: string) => void;
  isLoading?: boolean;
}

const PRESET_NAMES_A = [
  "MC FURY", "VERBAL K", "CHROME", "ILLMATIC", "BLADE MC",
  "SYNTAX", "RAVEN", "ECLIPSE", "VORTEX", "IRON JAW",
];
const PRESET_NAMES_B = [
  "SHADOW KING", "FATAL", "NEMESIS", "CIPHER", "GHOST MK",
  "HAVOC", "PHANTOM", "STORM", "DAGGER", "BLACK INK",
];

const randomFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const BattleSetupModal = ({ isOpen, onStart, isLoading = false }: BattleSetupModalProps) => {
  const [nameA, setNameA] = useState("MC FURY");
  const [nameB, setNameB] = useState("SHADOW KING");
  const [avatarA, setAvatarA] = useState("");
  const [avatarB, setAvatarB] = useState("");
  const [focusedSide, setFocusedSide] = useState<"a" | "b" | null>(null);
  const [errors, setErrors] = useState<{ a?: string; b?: string }>({});
  const [imgErrorA, setImgErrorA] = useState(false);
  const [imgErrorB, setImgErrorB] = useState(false);
  const [showSuggestA, setShowSuggestA] = useState(false);
  const [showSuggestB, setShowSuggestB] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);
  const { gladiators } = useGladiators();

  const pickGladiator = (side: "a" | "b", name: string, avatar?: string) => {
    if (side === "a") {
      setNameA(name);
      setAvatarA(avatar ?? "");
      setImgErrorA(false);
      setShowSuggestA(false);
      setErrors((e) => ({ ...e, a: undefined }));
    } else {
      setNameB(name);
      setAvatarB(avatar ?? "");
      setImgErrorB(false);
      setShowSuggestB(false);
      setErrors((e) => ({ ...e, b: undefined }));
    }
  };

  if (!isOpen) return null;

  const shuffleA = () => {
    let next = randomFrom(PRESET_NAMES_A);
    while (next === nameA) next = randomFrom(PRESET_NAMES_A);
    setNameA(next);
    setErrors((e) => ({ ...e, a: undefined }));
  };

  const shuffleB = () => {
    let next = randomFrom(PRESET_NAMES_B);
    while (next === nameB) next = randomFrom(PRESET_NAMES_B);
    setNameB(next);
    setErrors((e) => ({ ...e, b: undefined }));
  };

  const handleStart = () => {
    const newErrors: { a?: string; b?: string } = {};
    const trimA = nameA.trim().toUpperCase();
    const trimB = nameB.trim().toUpperCase();

    if (!trimA) newErrors.a = "Nome obrigatório";
    else if (trimA.length < 2) newErrors.a = "Mínimo 2 caracteres";
    else if (trimA.length > 20) newErrors.a = "Máximo 20 caracteres";

    if (!trimB) newErrors.b = "Nome obrigatório";
    else if (trimB.length < 2) newErrors.b = "Mínimo 2 caracteres";
    else if (trimB.length > 20) newErrors.b = "Máximo 20 caracteres";

    if (trimA && trimB && trimA === trimB) {
      newErrors.a = "Nomes têm de ser diferentes";
      newErrors.b = "Nomes têm de ser diferentes";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onStart(trimA, trimB, avatarA.trim() || undefined, avatarB.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm scanlines overflow-hidden">
      {/* Atmospheric glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      {/* Corner brackets */}
      <span className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-primary/50" />
      <span className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-primary/50" />
      <span className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-primary/50" />
      <span className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-primary/50" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-8 py-3 border-b border-primary/10 bg-background/60">
        <span className="mono-label-sm">PROTOCOLO INICIAL</span>
        <span className="mono-label-sm hidden md:inline">REGISTO DE COMBATENTES</span>
        <span className="mono-label-sm text-primary">◉ AGUARDANDO</span>
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-2xl mx-4 animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-16 h-px bg-primary/40" />
            <span className="mono-label text-primary/70">NOVA BATALHA</span>
            <span className="w-16 h-px bg-primary/40" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-[0.2em] text-glow mb-2">
            IDENTIFICAÇÃO
          </h1>
          <p className="font-body text-sm tracking-[0.3em] text-muted-foreground">
            DEFINA OS COMBATENTES · A ARENA REGISTA
          </p>
        </div>

        {/* Gladiator inputs */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-0 items-start mb-10">
          {/* Side A */}
          <GladiatorInput
            side="A"
            label="LADO A"
            value={nameA}
            avatarUrl={avatarA}
            imgError={imgErrorA}
            error={errors.a}
            isFocused={focusedSide === "a"}
            inputRef={inputARef}
            gladiators={gladiators}
            showSuggest={showSuggestA}
            onToggleSuggest={() => setShowSuggestA((v) => !v)}
            onPickGladiator={(name, avatar) => pickGladiator("a", name, avatar)}
            onChange={(v) => {
              setNameA(v.toUpperCase());
              setErrors((e) => ({ ...e, a: undefined }));
            }}
            onAvatarChange={(v) => { setAvatarA(v); setImgErrorA(false); }}
            onImgError={() => setImgErrorA(true)}
            onFocus={() => setFocusedSide("a")}
            onBlur={() => setFocusedSide(null)}
            onShuffle={shuffleA}
          />

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center py-4 md:px-6 md:pt-10">
            <div className="relative">
              <img
                src="/rrpl.jpg"
                alt="RRPL"
                className="w-20 h-20 object-cover rounded-full animate-pulse-glow"
                style={{ filter: "drop-shadow(0 0 12px hsl(var(--arena-glow) / 0.6))" }}
              />
            </div>
            <span className="font-display text-3xl tracking-[0.3em] text-glow mt-3">VS</span>
          </div>

          {/* Side B */}
          <GladiatorInput
            side="B"
            label="LADO B"
            value={nameB}
            avatarUrl={avatarB}
            imgError={imgErrorB}
            error={errors.b}
            isFocused={focusedSide === "b"}
            inputRef={inputBRef}
            gladiators={gladiators}
            showSuggest={showSuggestB}
            onToggleSuggest={() => setShowSuggestB((v) => !v)}
            onPickGladiator={(name, avatar) => pickGladiator("b", name, avatar)}
            onChange={(v) => {
              setNameB(v.toUpperCase());
              setErrors((e) => ({ ...e, b: undefined }));
            }}
            onAvatarChange={(v) => { setAvatarB(v); setImgErrorB(false); }}
            onImgError={() => setImgErrorB(true)}
            onFocus={() => setFocusedSide("b")}
            onBlur={() => setFocusedSide(null)}
            onShuffle={shuffleB}
          />
        </div>

        {/* Preview strip */}
        <div className="flex items-center justify-center gap-3 mb-10 px-4 py-3 border border-primary/15 bg-primary/5">
          <span
            className={cn(
              "font-display text-xl md:text-2xl tracking-wider transition-all duration-300",
              nameA.trim() ? "text-primary text-glow" : "text-muted-foreground/40"
            )}
          >
            {nameA.trim() || "???"}
          </span>
          <span className="mono-label-sm text-muted-foreground/50">·</span>
          <span className="mono-label-sm text-muted-foreground/70">ARENA VERBAL</span>
          <span className="mono-label-sm text-muted-foreground/50">·</span>
          <span
            className={cn(
              "font-display text-xl md:text-2xl tracking-wider transition-all duration-300",
              nameB.trim() ? "text-primary text-glow" : "text-muted-foreground/40"
            )}
          >
            {nameB.trim() || "???"}
          </span>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="arena"
            size="xl"
            onClick={handleStart}
            disabled={isLoading}
            className="group relative overflow-hidden gap-3 w-full md:w-auto min-w-[280px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                PREPARANDO ARENA...
              </span>
            ) : (
              <span className="relative z-10 flex items-center gap-3">
                <Swords className="w-5 h-5" />
                INICIAR BATALHA
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>
          <span className="mono-label-sm text-muted-foreground/60">
            A DECISÃO SERÁ DEFINITIVA
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-8 py-3 border-t border-primary/10 bg-background/60">
        <span className="mono-label-sm">CH.01 — BARRAS</span>
        <span className="mono-label-sm hidden md:inline">3 ROUNDS · JURI IA · AO VIVO</span>
        <span className="mono-label-sm text-primary">CH.03 — JULGAMENTO</span>
      </div>
    </div>
  );
};

interface GladiatorInputProps {
  side: "A" | "B";
  label: string;
  value: string;
  avatarUrl: string;
  imgError: boolean;
  error?: string;
  isFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  gladiators: import("@/hooks/useGladiators").Gladiator[];
  showSuggest: boolean;
  onToggleSuggest: () => void;
  onPickGladiator: (name: string, avatar?: string) => void;
  onChange: (v: string) => void;
  onAvatarChange: (v: string) => void;
  onImgError: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onShuffle: () => void;
}

const GladiatorInput = ({
  side, label, value, avatarUrl, imgError, error, isFocused,
  inputRef, gladiators, showSuggest, onToggleSuggest, onPickGladiator,
  onChange, onAvatarChange, onImgError, onFocus, onBlur, onShuffle,
}: GladiatorInputProps) => {
  const showImage = !!avatarUrl && !imgError;
  const [showUrlInput, setShowUrlInput] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Side tag */}
      <div className="flex items-center gap-2">
        <span className="mono-label-sm text-primary/60">{label}</span>
        <span className="mono-label-sm text-primary">·</span>
        <User className="w-3 h-3 text-primary/60" />
      </div>

      {/* Avatar area */}
      <div className="relative group">
        <div
          className={cn(
            "relative w-24 h-24 flex items-center justify-center transition-all duration-300 overflow-hidden",
            "border bg-card/40",
            isFocused
              ? "border-primary box-glow bg-primary/5"
              : error
              ? "border-destructive/60"
              : "border-border/60"
          )}
          style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
        >
          {showImage ? (
            <>
              <img
                src={avatarUrl}
                alt={`Avatar ${side}`}
                onError={onImgError}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              <div className="absolute inset-0 scanlines opacity-20" />
            </>
          ) : (
            <span
              className={cn(
                "font-display text-6xl transition-all duration-300",
                isFocused ? "text-primary text-glow" : "text-muted-foreground/25"
              )}
            >
              {side}
            </span>
          )}
          {isFocused && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
          )}
        </div>

        {/* Avatar action buttons overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => setShowUrlInput((v) => !v)}
            className="w-7 h-7 rounded-full bg-background/90 border border-primary/40 flex items-center justify-center hover:bg-primary/20 transition-colors"
            title="Adicionar foto (URL)"
          >
            <ImageIcon className="w-3 h-3 text-primary" />
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => { onAvatarChange(""); setShowUrlInput(false); }}
              className="w-7 h-7 rounded-full bg-background/90 border border-destructive/40 flex items-center justify-center hover:bg-destructive/20 transition-colors"
              title="Remover foto"
            >
              <X className="w-3 h-3 text-destructive" />
            </button>
          )}
        </div>
      </div>

      {/* URL input (collapsible) */}
      {showUrlInput && (
        <div className="w-full animate-fade-up">
          <input
            type="url"
            placeholder="https://... URL da foto"
            value={avatarUrl}
            onChange={(e) => onAvatarChange(e.target.value)}
            className={cn(
              "w-full bg-transparent text-xs font-body text-center",
              "border-b border-primary/30 py-1 px-2 outline-none transition-all duration-300",
              "placeholder:text-muted-foreground/30",
              "focus:border-primary/60 text-muted-foreground"
            )}
          />
          {imgError && avatarUrl && (
            <p className="text-center mono-label-sm text-destructive/70 mt-1">URL inválido ou imagem não carregou</p>
          )}
        </div>
      )}

      {/* Name input */}
      <div className="w-full relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={20}
          placeholder={`NOME DO MC ${side}`}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-transparent font-display text-center text-lg md:text-xl tracking-[0.2em]",
            "border-b-2 py-2 px-2 outline-none transition-all duration-300",
            "placeholder:text-muted-foreground/30 placeholder:text-base",
            isFocused
              ? "border-primary text-primary text-glow"
              : error
              ? "border-destructive/60 text-destructive/80"
              : "border-border/60 text-foreground hover:border-primary/40"
          )}
        />
        <span className="absolute right-1 -bottom-5 mono-label-sm text-muted-foreground/40">
          {value.length}/20
        </span>
      </div>

      {/* Error or shuffle */}
      <div className="h-6 flex items-center justify-center mt-1">
        {error ? (
          <span className="mono-label-sm text-destructive/80">{error}</span>
        ) : (
          <button
            type="button"
            onClick={onShuffle}
            className="flex items-center gap-1.5 mono-label-sm text-muted-foreground/50 hover:text-primary/70 transition-colors group"
          >
            <RefreshCw className="w-3 h-3 transition-transform group-hover:rotate-180 duration-300" />
            NOME ALEATÓRIO
          </button>
        )}
      </div>

      {/* Gladiadores registados */}
      {gladiators.length > 0 && (
        <div className="w-full">
          <button
            type="button"
            onClick={onToggleSuggest}
            className="flex items-center justify-center gap-1.5 w-full mono-label-sm text-muted-foreground/50 hover:text-primary/70 transition-colors py-1"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", showSuggest && "rotate-180")} />
            {showSuggest ? "FECHAR" : `REGISTADOS (${gladiators.length})`}
          </button>
          {showSuggest && (
            <div className="mt-1 border border-border/30 bg-background/95 max-h-36 overflow-y-auto">
              {gladiators.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onPickGladiator(g.name, g.avatarUrl)}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                >
                  <div className="w-7 h-7 shrink-0 border border-border/40 bg-card/30 flex items-center justify-center overflow-hidden relative"
                    style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>
                    {g.avatarUrl
                      ? <img src={g.avatarUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                      : <span className="font-display text-xs text-muted-foreground/40">{g.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs tracking-wider truncate">{g.name}</p>
                  </div>
                  <span className="mono-label-sm text-primary/60 shrink-0">{g.wins}V</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BattleSetupModal;
