import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface IntenseGlitchProps {
  text: string;
  isActive?: boolean;
  intensity?: "low" | "medium" | "high";
  className?: string;
}

const IntenseGlitch = ({ 
  text, 
  isActive = true, 
  intensity = "medium",
  className 
}: IntenseGlitchProps) => {
  const [glitchIndex, setGlitchIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setGlitchIndex((prev) => (prev + 1) % 3);
    }, intensity === "high" ? 50 : intensity === "medium" ? 100 : 200);

    return () => clearInterval(interval);
  }, [isActive, intensity]);

  const glitchOffset = intensity === "high" ? 4 : intensity === "medium" ? 2 : 1;

  return (
    <div className={cn("relative", className)}>
      {/* Main text */}
      <span className="relative z-10">{text}</span>

      {/* Glitch layers */}
      {isActive && (
        <>
          <span
            className="absolute inset-0 text-primary opacity-70"
            style={{
              transform: `translate(${glitchIndex === 0 ? -glitchOffset : glitchIndex === 1 ? glitchOffset : 0}px, ${glitchIndex === 2 ? glitchOffset : 0}px)`,
              clipPath: `inset(${20 + glitchIndex * 10}% 0 ${30 - glitchIndex * 5}% 0)`,
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 text-cyan-500 opacity-50"
            style={{
              transform: `translate(${glitchIndex === 1 ? glitchOffset : glitchIndex === 2 ? -glitchOffset : 0}px, ${glitchIndex === 0 ? -glitchOffset : 0}px)`,
              clipPath: `inset(${50 + glitchIndex * 5}% 0 ${10 + glitchIndex * 10}% 0)`,
            }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
};

export default IntenseGlitch;
