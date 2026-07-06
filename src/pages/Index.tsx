import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import SmokeBackground from "@/components/SmokeBackground";
import FireParticles from "@/components/FireParticles";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden scanlines">
      <SmokeBackground />
      <FireParticles intensity="low" />
      
      {/* Blood gradient overlay */}
      <div className="absolute inset-0 blood-gradient pointer-events-none z-[1]" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 arena-vignette pointer-events-none z-[2]" />

      {/* Top editorial bar — clinical metadata */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-primary/10">
        <span className="mono-label-sm">REC · 24/7</span>
        <span className="mono-label-sm hidden md:inline">JULGAMENTO FINAL · VOL.001</span>
        <span className="mono-label-sm">N° 0001</span>
      </div>

      {/* Vertical side labels */}
      <span className="vertical-label absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
        SIDE — A
      </span>
      <span className="vertical-label absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
        SIDE — B
      </span>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-4xl mx-auto pt-10">
        {/* Editorial mark above logo */}
        <div
          className="flex items-center gap-3 mb-6 animate-fade-in opacity-0"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <span className="mono-label-sm">RITUAL</span>
          <span className="w-10 h-px bg-primary/50" />
          <span className="mono-label-sm text-primary">001</span>
          <span className="w-10 h-px bg-primary/50" />
          <span className="mono-label-sm">ARENA</span>
        </div>

        {/* Logo */}
        <div className="animate-fade-up opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <Logo size="xl" />
        </div>

        {/* Slogan */}
        <p 
          className="font-body text-base md:text-xl tracking-[0.4em] text-muted-foreground mt-8 animate-fade-up opacity-0"
          style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
        >
          A PALAVRA CORTA · A ARENA DECIDE
        </p>

        {/* Ritual divider */}
        <div
          className="w-64 ritual-divider my-14 animate-fade-in opacity-0"
          style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
        />

        {/* Manifesto — typeset as ritual stanzas */}
        <div
          className="space-y-2 mb-14 animate-fade-up opacity-0"
          style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}
        >
          <p className="font-display text-2xl md:text-3xl text-muted-foreground tracking-[0.2em]">
            AQUI NÃO HÁ EMPATE.
          </p>
          <p className="font-display text-2xl md:text-3xl text-muted-foreground tracking-[0.2em]">
            A PALAVRA ENTRA.
          </p>
          <p className="font-display text-2xl md:text-3xl text-muted-foreground tracking-[0.2em]">
            A ARENA RESPONDE.
          </p>
          <p className="font-display text-3xl md:text-4xl text-foreground tracking-[0.2em] text-glow pt-2">
            A DECISÃO É DEFINITIVA.
          </p>
        </div>

        {/* CTA Button */}
        <div
          className="animate-fade-up opacity-0 flex flex-col items-center gap-4"
          style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}
        >
          <Button
            variant="arena"
            size="xl"
            onClick={() => navigate("/arena")}
            className="group relative overflow-hidden gap-3"
          >
            <span className="relative z-10 flex items-center gap-3">
              ENTRAR NA ARENA
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>

          {/* Secondary links */}
          <div className="flex items-center gap-6 mt-2">
            <button onClick={() => navigate("/publico")}
              className="mono-label-sm text-muted-foreground/60 hover:text-primary/80 transition-colors">
              PÚBLICO →
            </button>
            <span className="w-px h-3 bg-border/60" />
            <button onClick={() => navigate("/base-dados")}
              className="mono-label-sm text-muted-foreground/60 hover:text-primary/80 transition-colors">
              BASE DE DADOS →
            </button>
            <span className="w-px h-3 bg-border/60" />
            <button onClick={() => navigate("/stats")}
              className="mono-label-sm text-muted-foreground/60 hover:text-primary/80 transition-colors">
              ESTATÍSTICAS →
            </button>
          </div>

          <span className="mono-label-sm text-muted-foreground/40">PRESSIONE PARA INICIAR · SEM RETORNO</span>
        </div>

        {/* Subtle hint */}
        <p 
          className="mono-label mt-20 animate-fade-in opacity-0 animate-pulse-glow text-primary/70"
          style={{ animationDelay: "1800ms", animationFillMode: "forwards" }}
        >
          ◉  A ARENA ESTÁ ABERTA
        </p>
      </div>

      {/* Bottom editorial bar */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-t border-primary/10">
        <span className="mono-label-sm">CH.01 — BARRAS</span>
        <span className="mono-label-sm hidden md:inline">CH.02 — ENTREGA</span>
        <span className="mono-label-sm text-primary">CH.03 — JULGAMENTO</span>
      </div>

      {/* Enhanced corner decorations */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-primary/40 shadow-[0_0_15px_hsl(var(--arena-glow)/0.3)]" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-primary/40 shadow-[0_0_15px_hsl(var(--arena-glow)/0.3)]" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-primary/40 shadow-[0_0_15px_hsl(var(--arena-glow)/0.3)]" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-primary/40 shadow-[0_0_15px_hsl(var(--arena-glow)/0.3)]" />
      
      {/* Additional glow accents */}
      <div className="absolute top-1/4 left-0 w-32 h-64 bg-gradient-to-r from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-32 h-64 bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
};

export default Index;
