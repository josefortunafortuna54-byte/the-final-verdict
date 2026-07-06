import { cn } from "@/lib/utils";

interface EnergyBarProps {
  value: number;
  side: "left" | "right";
  className?: string;
}

const EnergyBar = ({ value, side, className }: EnergyBarProps) => {
  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-body uppercase tracking-wider text-muted-foreground">
          Energia
        </span>
        <span className="font-display text-lg text-primary">{value}%</span>
      </div>
      <div className="h-3 bg-card border border-border rounded-sm overflow-hidden">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-blood-dark to-primary transition-all duration-500 animate-energy-pulse",
            side === "right" && "ml-auto"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default EnergyBar;
