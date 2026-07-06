import { cn } from "@/lib/utils";

interface CrackEffectProps {
  isActive?: boolean;
  className?: string;
}

const CrackEffect = ({ isActive = false, className }: CrackEffectProps) => {
  if (!isActive) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50", className)}>
      {/* Central crack lines */}
      <svg
        className="absolute inset-0 w-full h-full animate-crack-spread"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="crack-glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main crack from center */}
        <path
          d="M50 50 L45 35 L48 25 L44 15 L46 5"
          className="stroke-primary fill-none animate-crack-draw"
          strokeWidth="0.3"
          filter="url(#crack-glow)"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
        <path
          d="M50 50 L55 35 L52 20 L58 10"
          className="stroke-primary fill-none animate-crack-draw delay-100"
          strokeWidth="0.3"
          filter="url(#crack-glow)"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
        <path
          d="M50 50 L35 55 L25 52 L15 58 L5 55"
          className="stroke-primary fill-none animate-crack-draw delay-200"
          strokeWidth="0.3"
          filter="url(#crack-glow)"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
        <path
          d="M50 50 L60 60 L70 55 L80 62 L90 58"
          className="stroke-primary fill-none animate-crack-draw delay-300"
          strokeWidth="0.3"
          filter="url(#crack-glow)"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
        <path
          d="M50 50 L55 65 L50 75 L55 85 L52 95"
          className="stroke-primary fill-none animate-crack-draw delay-400"
          strokeWidth="0.3"
          filter="url(#crack-glow)"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />

        {/* Branch cracks */}
        <path
          d="M45 35 L38 38 L30 35"
          className="stroke-primary/70 fill-none animate-crack-draw delay-500"
          strokeWidth="0.2"
          filter="url(#crack-glow)"
        />
        <path
          d="M55 35 L62 32 L68 38"
          className="stroke-primary/70 fill-none animate-crack-draw delay-500"
          strokeWidth="0.2"
          filter="url(#crack-glow)"
        />
        <path
          d="M35 55 L32 48 L25 45"
          className="stroke-primary/70 fill-none animate-crack-draw delay-700"
          strokeWidth="0.2"
          filter="url(#crack-glow)"
        />
      </svg>

      {/* Shatter overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent animate-crack-pulse" />

      {/* Light flash */}
      <div className="absolute inset-0 bg-primary/20 animate-flash-fade" />
    </div>
  );
};

export default CrackEffect;
