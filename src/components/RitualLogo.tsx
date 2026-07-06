import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-julgamento-final.png";

interface RitualLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Ritual stage — controls intensity of the effects.
   *  - "intro"   subtle pulse + faint chromatic halo
   *  - "judging" pulse + measured glitch + RGB split
   *  - "reveal"  full intensity: glitch, cracks, tremor
   */
  stage?: "intro" | "judging" | "reveal";
}

/**
 * RitualLogo — variant of <Logo> dedicated to the judgment ritual.
 *
 * Differences vs <Logo ritual=...>:
 *  - Uses a single <picture> with a containing wrapper sized via aspect-ratio
 *    so RGB phantom layers stay perfectly registered (no inset:0 vs auto-width
 *    drift that produced ghosting at small sizes).
 *  - Reduced effect amplitude on mobile to avoid blurry artifacts on small screens.
 *  - SVG cracks rendered on top of the logo bounding box (not stretched
 *    via preserveAspectRatio="none") so strokes stay crisp and proportional.
 *  - Single isolated stacking context to prevent mix-blend bleed onto the page.
 */
const RitualLogo = ({ className, size = "md", stage = "intro" }: RitualLogoProps) => {
  const sizeClasses = {
    sm: "h-16 md:h-20",
    md: "h-24 md:h-32",
    lg: "h-32 md:h-44",
    xl: "h-40 md:h-56",
  };

  const showCracks = stage === "reveal";
  const showRgbSplit = stage === "judging" || stage === "reveal";
  const tremor = stage === "reveal";

  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className={cn(
          "relative inline-flex isolate",
          "[contain:layout_paint]",
          tremor && "animate-ritual-tremor-soft",
        )}
      >
        {/* RGB split phantoms — registered to the same box as the main logo */}
        {showRgbSplit && (
          <>
            <img
              src={logoImage}
              alt=""
              aria-hidden
              draggable={false}
              className={cn(
                "absolute inset-0 m-auto w-auto h-full object-contain pointer-events-none select-none",
                "mix-blend-screen opacity-70 animate-rgb-red-soft",
                sizeClasses[size],
              )}
              style={{ filter: "url(#ritual-logo-red)" }}
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden
              draggable={false}
              className={cn(
                "absolute inset-0 m-auto w-auto h-full object-contain pointer-events-none select-none",
                "mix-blend-screen opacity-50 animate-rgb-cyan-soft hidden md:block",
                sizeClasses[size],
              )}
              style={{ filter: "url(#ritual-logo-cyan)" }}
            />
          </>
        )}

        {/* Main logo */}
        <img
          src={logoImage}
          alt="Julgamento Final"
          draggable={false}
          className={cn(
            "relative z-10 w-auto object-contain select-none",
            "[image-rendering:auto] will-change-transform",
            sizeClasses[size],
            "animate-ritual-pulse",
            stage === "judging" && "animate-ritual-glitch-soft",
            stage === "reveal" && "animate-ritual-glitch",
          )}
        />

        {/* Crack overlay — sized to the logo box, kept proportional */}
        {showCracks && (
          <svg
            className={cn(
              "absolute inset-0 z-20 m-auto w-full h-full pointer-events-none",
            )}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <g className="ritual-cracks">
              <path
                d="M12 52 L30 44 L42 56 L56 40 L72 54 L90 46"
                className="ritual-crack-path"
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                strokeLinecap="round"
                fill="none"
                style={{ animationDelay: "0.1s" }}
              />
              <path
                d="M28 22 L34 36 L30 50 L40 64 L36 80"
                className="ritual-crack-path"
                stroke="hsl(var(--primary))"
                strokeWidth="0.4"
                strokeLinecap="round"
                fill="none"
                style={{ animationDelay: "0.5s" }}
              />
              <path
                d="M74 18 L68 32 L78 50 L72 70 L80 86"
                className="ritual-crack-path"
                stroke="hsl(var(--primary))"
                strokeWidth="0.4"
                strokeLinecap="round"
                fill="none"
                style={{ animationDelay: "0.9s" }}
              />
              <path
                d="M50 8 L48 26 L52 46 L46 70 L50 92"
                className="ritual-crack-path"
                stroke="hsl(var(--primary-glow))"
                strokeWidth="0.35"
                strokeLinecap="round"
                fill="none"
                style={{ animationDelay: "1.3s" }}
              />
            </g>
          </svg>
        )}

        {/* Tuned filters — pure red and pure cyan extraction without saturation blowout */}
        {showRgbSplit && (
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <filter id="ritual-logo-red" x="0" y="0" width="100%" height="100%">
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0
                          0 0 0 0 0
                          0 0 0 0 0
                          0 0 0 1 0"
                />
              </filter>
              <filter id="ritual-logo-cyan" x="0" y="0" width="100%" height="100%">
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
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

export default RitualLogo;