import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, ExternalLink, Smartphone } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

// Gera QR localmente via Canvas usando qrcode-svg inline
// Sem dependências externas — usa a Google Charts API como fallback confiável
const QRCodeDisplay = ({ url, size = 200, className }: QRCodeDisplayProps) => {
  const [imgSrc, setImgSrc]   = useState<string>("");
  const [loaded, setLoaded]   = useState(false);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    // Usa qrserver.com — API pública confiável, sem CORS
    setImgSrc(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(url)}&format=png&margin=10`
    );
  }, [url, size]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-white", className)}
        style={{ width: size, height: size }}>
        <p className="text-xs text-gray-500 text-center p-2">
          QR indisponível<br />
          <span className="font-mono text-[10px] break-all">{url}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-white flex items-center justify-center", className)}
      style={{ width: size, height: size }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={`QR Code para ${url}`}
        width={size}
        height={size}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
};

/* ── Modal completo do QR ─────────────────────────────────────────────── */
interface ArenaQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicoUrl: string;
  gladiatorAName?: string;
  gladiatorBName?: string;
  currentRound?: number;
}

export const ArenaQRModal = ({
  isOpen,
  onClose,
  publicoUrl,
  gladiatorAName,
  gladiatorBName,
  currentRound,
}: ArenaQRModalProps) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("input");
      el.value = publicoUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm animate-fade-up">
        {/* Corner brackets */}
        <div className="relative border border-primary/30 bg-background p-6"
          style={{ clipPath: "polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)" }}>

          <span className="absolute top-2 left-2 w-4 h-4 border-l border-t border-primary/60" />
          <span className="absolute top-2 right-2 w-4 h-4 border-r border-t border-primary/60" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-primary/60" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-primary/60" />

          {/* Header */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="w-8 h-px bg-primary/40" />
              <Smartphone className="w-4 h-4 text-primary/70" />
              <span className="mono-label text-primary/80">ACESSO DO PÚBLICO</span>
              <span className="w-8 h-px bg-primary/40" />
            </div>
            <p className="font-body text-xs text-muted-foreground/60">
              Aponta a câmara para entrar na arena
            </p>
          </div>

          {/* Batalha activa */}
          {gladiatorAName && gladiatorBName && (
            <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 border border-primary/20 bg-primary/5">
              <span className="font-display text-sm text-primary text-glow truncate">{gladiatorAName}</span>
              <span className="mono-label-sm text-muted-foreground/40 shrink-0">VS</span>
              <span className="font-display text-sm text-primary text-glow truncate">{gladiatorBName}</span>
              {currentRound && (
                <span className="mono-label-sm text-muted-foreground/50 shrink-0">· R{currentRound}</span>
              )}
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="relative p-3 bg-white shadow-[0_0_30px_hsl(var(--arena-glow)/0.3)]"
              style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
              <QRCodeDisplay url={publicoUrl} size={192} />
              {/* Overlay corners on QR */}
              <span className="absolute top-1 left-1 w-5 h-5 border-l-2 border-t-2 border-primary/80" />
              <span className="absolute top-1 right-1 w-5 h-5 border-r-2 border-t-2 border-primary/80" />
              <span className="absolute bottom-1 left-1 w-5 h-5 border-l-2 border-b-2 border-primary/80" />
              <span className="absolute bottom-1 right-1 w-5 h-5 border-r-2 border-b-2 border-primary/80" />
            </div>
          </div>

          {/* URL + copy */}
          <div className="flex items-center gap-2 mb-5 px-3 py-2 border border-border/40 bg-card/30">
            <span className="flex-1 font-mono text-xs text-muted-foreground/70 truncate">{publicoUrl}</span>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1.5 mono-label-sm text-primary/70 hover:text-primary transition-colors"
            >
              {copied
                ? <><Check className="w-3 h-3" /> COPIADO</>
                : <><Copy className="w-3 h-3" /> COPIAR</>
              }
            </button>
          </div>

          {/* Instruções */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { step: "1", text: "Abre a câmara" },
              { step: "2", text: "Aponta pro QR" },
              { step: "3", text: "Vota e reage" },
            ].map((s) => (
              <div key={s.step} className="text-center p-2 border border-border/30 bg-card/20">
                <span className="font-display text-lg text-primary block">{s.step}</span>
                <span className="mono-label-sm text-muted-foreground/50">{s.text}</span>
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={() => window.open(publicoUrl, "_blank")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors mono-label-sm"
            >
              <ExternalLink className="w-3 h-3" /> ABRIR
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-display text-sm tracking-[0.2em]"
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
