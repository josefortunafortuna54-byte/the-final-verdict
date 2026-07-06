import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-julgamento-final.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Ritual animation level — synced with judgment phases:
   *  - "off"     normal idle glow
   *  - "intro"   subtle pulse glow
   *  - "judging" pulse + subtle glitch
   *  - "reveal"  intense glitch + RGB split + cracks drawing
   */
  ritual?: "off" | "intro" | "judging" | "reveal";
}

const Logo = ({ className, size = "lg", ritual = "off" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-16 md:h-20",
    md: "h-24 md:h-32",
    lg: "h-32 md:h-44",
    xl: "h-40 md:h-56",
  };

  const showCracks = ritual === "reveal";
  const showRgbSplit = ritual === "judging" || ritual === "reveal";
  const tremor = ritual === "reveal";

  const baseImg = cn(
    "w-auto object-contain transition-all duration-500",
    sizeClasses[size],
    ritual === "off" && "animate-logo-glow drop-shadow-[0_0_30px_hsl(var(--arena-glow))]",
    ritual !== "off" && "animate-ritual-pulse",
    ritual === "judging" && "animate-ritual-glitch",
    ritual === "reveal" && "animate-ritual-glitch",
  );

  return (
    <div className={cn("flex justify-center", className)}>
      <div className={cn("relative inline-block", tremor && "animate-ritual-tremor")}>
        {/* RGB-split phantom layers (judging/reveal only) */}
        {showRgbSplit && (
          <>
            <img
              src={logoImage}
              alt=""
              aria-hidden
              className={cn(
                "absolute inset-0 w-auto object-contain pointer-events-none mix-blend-screen animate-rgb-red",
                sizeClasses[size]
              )}
              style={{ filter: "url(#ritual-red-only)" }}
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden
              className={cn(
                "absolute inset-0 w-auto object-contain pointer-events-none mix-blend-screen animate-rgb-cyan",
                sizeClasses[size]
              )}
              style={{ filter: "hue-rotate(180deg) saturate(2)" }}
            />
          </>
        )}

        {/* Main logo */}
        <img
          src={logoImage}
          alt="Julgamento Final"
          className={cn(baseImg, "relative z-10 hover:drop-shadow-[0_0_50px_hsl(var(--primary))]")}
        />

        {/* Crack lines overlay (reveal only) */}
        {showCracks && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M10 50 L30 42 L42 55 L55 38 L70 52 L90 45"
              className="ritual-crack-path"
              stroke="hsl(var(--primary))"
              strokeWidth="0.4"
              fill="none"
              style={{ animationDelay: "0.1s" }}
            />
            <path
              d="M25 20 L32 35 L28 50 L40 65 L35 80"
              className="ritual-crack-path"
              stroke="hsl(var(--primary))"
              strokeWidth="0.3"
              fill="none"
              style={{ animationDelay: "0.5s" }}
            />
            <path
              d="M75 15 L68 30 L78 48 L72 70 L80 88"
              className="ritual-crack-path"
              stroke="hsl(var(--primary))"
              strokeWidth="0.3"
              fill="none"
              style={{ animationDelay: "0.9s" }}
            />
            <path
              d="M50 5 L48 25 L52 45 L46 70 L50 95"
              className="ritual-crack-path"
              stroke="hsl(var(--primary-glow))"
              strokeWidth="0.25"
              fill="none"
              style={{ animationDelay: "1.3s" }}
            />
          </svg>
        )}

        {/* Inline filter defs for the red-only channel */}
        {showRgbSplit && (
          <svg width="0" height="0" className="absolute">
            <defs>
              <filter id="ritual-red-only">
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0
                          0 0 0 0 0
                          0 0 0 0 0
                          0 0 0 1 0"
                />
              </filter>
            </defs>
          </svg>
        )}
      </div>
    </div>
  );
};

export default Logo;
