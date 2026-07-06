import { cn } from "@/lib/utils";

interface AIStatusProps {
  status: "observing" | "judging" | "decided";
  className?: string;
}

const AIStatus = ({ status, className }: AIStatusProps) => {
  const statusConfig = {
    observing: {
      text: "IA OBSERVANDO...",
      pulse: true,
    },
    judging: {
      text: "IA PROCESSANDO JULGAMENTO...",
      pulse: true,
    },
    decided: {
      text: "DECISÃO TOMADA",
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 px-6 py-3 bg-card border border-border",
        className
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full bg-primary",
          config.pulse && "animate-pulse-glow"
        )}
      />
      <span className="font-display text-sm tracking-widest text-muted-foreground">
        {config.text}
      </span>
    </div>
  );
};

export default AIStatus;
