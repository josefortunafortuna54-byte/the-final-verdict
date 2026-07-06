import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FireParticlesProps {
  intensity?: "low" | "medium" | "high";
  className?: string;
}

const FireParticles = ({ intensity = "medium", className }: FireParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const count = intensity === "low" ? 15 : intensity === "medium" ? 30 : 50;
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.7,
    }));

    setParticles(newParticles);
  }, [intensity]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden z-0", className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-fire-rise"
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, hsl(var(--primary-glow)) 0%, hsl(var(--primary)) 50%, transparent 100%)`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--arena-glow) / 0.5)`,
          }}
        />
      ))}

      {/* Ember particles */}
      {intensity !== "low" && particles.slice(0, 10).map((particle) => (
        <div
          key={`ember-${particle.id}`}
          className="absolute w-1 h-1 bg-yellow-500 rounded-full animate-ember-float"
          style={{
            left: `${particle.x}%`,
            bottom: "5%",
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FireParticles;
