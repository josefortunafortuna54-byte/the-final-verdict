import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Flame {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  offsetX: number;
}

interface RealFlameEffectProps {
  isActive: boolean;
  className?: string;
}

const RealFlameEffect = ({ isActive, className }: RealFlameEffectProps) => {
  const [flames, setFlames] = useState<Flame[]>([]);

  useEffect(() => {
    if (!isActive) {
      setFlames([]);
      return;
    }

    const newFlames: Flame[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70, // Keep flames more centered
      delay: Math.random() * 0.3,
      duration: 1 + Math.random() * 0.4,
      size: 25 + Math.random() * 35,
      offsetX: -10 + Math.random() * 20,
    }));

    setFlames(newFlames);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-40 overflow-hidden", className)}>
      {/* Base fire glow - reduced */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-orange-600/20 via-red-500/10 to-transparent" />
      
      {/* Flames container - reduced height */}
      <div className="absolute inset-x-0 bottom-0 h-[35%]">
        {flames.map((flame) => (
          <div
            key={flame.id}
            className="absolute bottom-0 animate-real-flame"
            style={{
              left: `${flame.x}%`,
              animationDelay: `${flame.delay}s`,
              animationDuration: `${flame.duration}s`,
            }}
          >
            {/* Main flame body */}
            <div
              className="relative"
              style={{
                width: `${flame.size}px`,
                height: `${flame.size * 2}px`,
                transform: `translateX(${flame.offsetX}px)`,
              }}
            >
              {/* Core - white/yellow */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full animate-flame-flicker"
                style={{
                  width: `${flame.size * 0.3}px`,
                  height: `${flame.size * 0.8}px`,
                  background: 'radial-gradient(ellipse at bottom, #fff 0%, #ffeb3b 30%, #ff9800 60%, transparent 100%)',
                  filter: 'blur(2px)',
                  animationDelay: `${flame.delay}s`,
                }}
              />
              
              {/* Inner flame - orange */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full animate-flame-flicker"
                style={{
                  width: `${flame.size * 0.5}px`,
                  height: `${flame.size * 1.2}px`,
                  background: 'radial-gradient(ellipse at bottom, #ff9800 0%, #ff5722 40%, #f44336 70%, transparent 100%)',
                  filter: 'blur(3px)',
                  animationDelay: `${flame.delay + 0.1}s`,
                }}
              />
              
              {/* Outer flame - red */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full animate-flame-flicker"
                style={{
                  width: `${flame.size * 0.8}px`,
                  height: `${flame.size * 1.8}px`,
                  background: 'radial-gradient(ellipse at bottom, #f44336 0%, #d32f2f 30%, #b71c1c 60%, transparent 100%)',
                  filter: 'blur(5px)',
                  opacity: 0.8,
                  animationDelay: `${flame.delay + 0.2}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sparks - reduced */}
      {flames.slice(0, 8).map((flame) => (
        <div
          key={`spark-${flame.id}`}
          className="absolute animate-spark-rise"
          style={{
            left: `${flame.x}%`,
            bottom: '5%',
            animationDelay: `${flame.delay + 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        >
          <div
            className="w-0.5 h-0.5 rounded-full bg-yellow-400"
            style={{
              boxShadow: '0 0 3px #ffeb3b, 0 0 6px #ff9800',
            }}
          />
        </div>
      ))}

      {/* Heat distortion overlay */}
      <div 
        className="absolute inset-0 animate-heat-distortion"
        style={{
          background: 'linear-gradient(to top, rgba(255, 87, 34, 0.1) 0%, transparent 50%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle glow at bottom */}
      <div 
        className="absolute inset-x-0 bottom-0 h-20"
        style={{
          background: 'radial-gradient(ellipse at bottom center, rgba(255, 152, 0, 0.3) 0%, rgba(255, 87, 34, 0.15) 40%, transparent 70%)',
          filter: 'blur(15px)',
        }}
      />
    </div>
  );
};

export default RealFlameEffect;
