import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";

// PIN configurável via .env — default "1234" se não definido
const ARENA_PIN = import.meta.env.VITE_ARENA_PIN ?? "1234";
const STORAGE_KEY = "tfv_arena_unlocked";
const SESSION_HOURS = 8; // sessão dura 8 horas

interface ArenaPinGateProps {
  children: React.ReactNode;
}

const ArenaPinGate = ({ children }: ArenaPinGateProps) => {
  const [unlocked, setUnlocked]   = useState(false);
  const [pin, setPin]             = useState(["", "", "", ""]);
  const [error, setError]         = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const [locked, setLocked]       = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verifica sessão guardada
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { ts } = JSON.parse(stored);
        const hoursSince = (Date.now() - ts) / 1000 / 3600;
        if (hoursSince < SESSION_HOURS) {
          setUnlocked(true);
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }

    // Foca o primeiro input ao montar
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  // Cleanup do timer de bloqueio
  useEffect(() => {
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current); };
  }, []);

  const handleDigit = (index: number, value: string) => {
    if (locked) return;
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError(false);

    if (digit) {
      // Avança para o próximo input
      if (index < 3) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Último dígito — valida automaticamente
        validatePin(next.join(""));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...pin];
      next[index - 1] = "";
      setPin(next);
    }
    if (e.key === "Enter") {
      validatePin(pin.join(""));
    }
  };

  const validatePin = (entered: string) => {
    if (entered.length < 4) return;

    if (entered === ARENA_PIN) {
      setError(false);
      setUnlocked(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    } else {
      setError(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);

      // Após 3 tentativas erradas, bloqueia por 30s
      if (newAttempts >= 3) {
        setLocked(true);
        let secs = 30;
        setLockSeconds(secs);
        lockTimerRef.current = setInterval(() => {
          secs--;
          setLockSeconds(secs);
          if (secs <= 0) {
            clearInterval(lockTimerRef.current!);
            setLocked(false);
            setAttempts(0);
            setError(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
          }
        }, 1000);
      }
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center scanlines overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Corner brackets */}
      <span className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-primary/40" />
      <span className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-primary/40" />
      <span className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-primary/40" />
      <span className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-primary/40" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-8 py-3 border-b border-primary/10 bg-background/60">
        <span className="mono-label-sm">PROTOCOLO DE SEGURANÇA</span>
        <span className="mono-label-sm text-primary">◉ ACESSO RESTRITO</span>
      </div>

      <div className="relative w-full max-w-sm mx-6 animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className={cn(
              "w-16 h-16 flex items-center justify-center border-2 transition-all duration-300",
              locked
                ? "border-destructive/60 bg-destructive/10"
                : error
                ? "border-destructive/60 bg-destructive/10 animate-pulse"
                : "border-primary/50 bg-primary/10"
            )}
              style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
              {locked
                ? <AlertTriangle className="w-8 h-8 text-destructive" />
                : <Lock className={cn("w-8 h-8", error ? "text-destructive" : "text-primary")} />
              }
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="w-12 h-px bg-primary/40" />
            <span className="mono-label text-primary/70">ÁRBITRO</span>
            <span className="w-12 h-px bg-primary/40" />
          </div>
          <h1 className="font-display text-4xl tracking-[0.2em] text-glow mb-2">
            ARENA
          </h1>
          <p className="font-body text-sm text-muted-foreground/60 tracking-wider">
            INSERE O PIN DE ACESSO
          </p>
        </div>

        {/* PIN inputs */}
        <div className="flex justify-center gap-4 mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={locked}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "w-14 h-16 text-center font-display text-2xl tracking-widest outline-none transition-all duration-200",
                "border-2 bg-card/30",
                "focus:scale-105",
                locked
                  ? "border-destructive/30 opacity-40 cursor-not-allowed"
                  : error
                  ? "border-destructive/70 bg-destructive/10 text-destructive animate-pulse"
                  : digit
                  ? "border-primary text-primary bg-primary/10 box-glow"
                  : "border-border/50 text-foreground hover:border-primary/40 focus:border-primary"
              )}
              style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
            />
          ))}
        </div>

        {/* Show/hide toggle */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            className="flex items-center gap-1.5 mono-label-sm text-muted-foreground/50 hover:text-primary/70 transition-colors"
          >
            {showPin
              ? <><EyeOff className="w-3 h-3" /> ESCONDER</>
              : <><Eye className="w-3 h-3" /> MOSTRAR</>
            }
          </button>
        </div>

        {/* Feedback messages */}
        <div className="h-8 flex items-center justify-center">
          {locked ? (
            <p className="mono-label-sm text-destructive/80 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              BLOQUEADO — AGUARDA {lockSeconds}s
            </p>
          ) : error ? (
            <p className="mono-label-sm text-destructive/80">
              PIN INCORRECTO {attempts >= 2 ? `· ${3 - attempts} TENTATIVA${3 - attempts === 1 ? "" : "S"} RESTANTE` : ""}
            </p>
          ) : (
            <p className="mono-label-sm text-muted-foreground/40">
              {pin.filter(Boolean).length > 0 ? "·".repeat(pin.filter(Boolean).length) + "○".repeat(4 - pin.filter(Boolean).length) : "○ ○ ○ ○"}
            </p>
          )}
        </div>

        {/* Confirm button */}
        <button
          type="button"
          disabled={pin.filter(Boolean).length < 4 || locked}
          onClick={() => validatePin(pin.join(""))}
          className={cn(
            "w-full mt-4 py-3 font-display text-sm tracking-[0.3em] border-2 transition-all duration-200",
            pin.filter(Boolean).length === 4 && !locked
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:scale-[1.02]"
              : "border-border/30 text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          CONFIRMAR
        </button>

        {/* Session info */}
        <p className="text-center mono-label-sm text-muted-foreground/30 mt-6">
          SESSÃO VÁLIDA POR {SESSION_HOURS}H · ACESSO EXCLUSIVO DO ÁRBITRO
        </p>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-8 py-3 border-t border-primary/10 bg-background/60">
        <span className="mono-label-sm">CH.02 — ÁRBITRO</span>
        <span className="mono-label-sm hidden md:inline">THE FINAL VERDICT · SISTEMA SEGURO</span>
        <span className="mono-label-sm text-primary/60">
          <Shield className="w-3 h-3 inline mr-1" />PROTEGIDO
        </span>
      </div>
    </div>
  );
};

export default ArenaPinGate;
