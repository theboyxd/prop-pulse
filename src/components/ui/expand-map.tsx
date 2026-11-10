import React, { useState, useRef, useEffect } from "react";

export interface LocationMapProps {
  location?: string;
  coordinates?: string;
  className?: string;
  defaultExpanded?: boolean;
  badgeText?: string;
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * Exact UI & interaction replica of 21st.dev/@jatin-yadav05/components/expand-map
 * Uses native React spring physics + CSS spring curves to avoid duplicate React hook issues.
 */
export function LocationMap({
  location = "San Francisco, CA",
  coordinates = "37.7749° N, 122.4194° W",
  className = "",
  defaultExpanded = false,
  badgeText = "Live",
  onExpandChange,
}: LocationMapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const targetTilt = useRef({ rotateX: 0, rotateY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const animateTilt = () => {
      setTilt((prev) => {
        const dx = targetTilt.current.rotateX - prev.rotateX;
        const dy = targetTilt.current.rotateY - prev.rotateY;
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          return targetTilt.current;
        }
        return {
          rotateX: prev.rotateX + dx * 0.18,
          rotateY: prev.rotateY + dy * 0.18,
        };
      });
      raf = requestAnimationFrame(animateTilt);
    };
    raf = requestAnimationFrame(animateTilt);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = Math.max(-50, Math.min(50, e.clientX - centerX));
    const offsetY = Math.max(-50, Math.min(50, e.clientY - centerY));
    targetTilt.current = {
      rotateX: -(offsetY / 50) * 8,
      rotateY: (offsetX / 50) * 8,
    };
  };

  const handleMouseLeave = () => {
    targetTilt.current = { rotateX: 0, rotateY: 0 };
    setIsHovered(false);
  };

  const handleClick = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onExpandChange?.(next);
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`Expand map for ${location}, coordinates ${coordinates}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`relative cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-2xl ${className}`}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-background border border-border"
        style={{
          width: isExpanded ? 360 : 240,
          height: isExpanded ? 280 : 140,
          transform: `rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg)`,
          transformStyle: "preserve-3d",
          transition:
            "width 450ms cubic-bezier(0.34, 1.35, 0.64, 1), height 450ms cubic-bezier(0.34, 1.35, 0.64, 1)",
        }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-muted/40" />

        {/* Expanded Street View */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 350ms ease",
          }}
        >
          <div className="absolute inset-0 bg-muted" />

          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Main horizontal roads */}
            <line
              x1="0%"
              y1="35%"
              x2="100%"
              y2="35%"
              className="stroke-foreground/25"
              strokeWidth="4"
            />
            <line
              x1="0%"
              y1="65%"
              x2="100%"
              y2="65%"
              className="stroke-foreground/25"
              strokeWidth="4"
            />

            {/* Main vertical roads */}
            <line
              x1="30%"
              y1="0%"
              x2="30%"
              y2="100%"
              className="stroke-foreground/20"
              strokeWidth="3"
            />
            <line
              x1="70%"
              y1="0%"
              x2="70%"
              y2="100%"
              className="stroke-foreground/20"
              strokeWidth="3"
            />

            {/* Secondary streets */}
            {[20, 50, 80].map((y, i) => (
              <line
                key={`h-${i}`}
                x1="0%"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                className="stroke-foreground/10"
                strokeWidth="1.5"
              />
            ))}
            {[15, 45, 55, 85].map((x, i) => (
              <line
                key={`v-${i}`}
                x1={`${x}%`}
                y1="0%"
                x2={`${x}%`}
                y2="100%"
                className="stroke-foreground/10"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          {/* Building blocks */}
          <div className="absolute top-[40%] left-[10%] w-[15%] h-[20%] rounded-sm bg-muted-foreground/30 border border-muted-foreground/20" />
          <div className="absolute top-[15%] left-[35%] w-[12%] h-[15%] rounded-sm bg-muted-foreground/25 border border-muted-foreground/15" />
          <div className="absolute top-[70%] left-[75%] w-[18%] h-[18%] rounded-sm bg-muted-foreground/28 border border-muted-foreground/18" />
          <div className="absolute top-[20%] right-[10%] w-[10%] h-[25%] rounded-sm bg-muted-foreground/22 border border-muted-foreground/15" />
          <div className="absolute top-[55%] left-[5%] w-[8%] h-[12%] rounded-sm bg-muted-foreground/20 border border-muted-foreground/12" />
          <div className="absolute top-[8%] left-[75%] w-[14%] h-[10%] rounded-sm bg-muted-foreground/22 border border-muted-foreground/15" />

          {/* Glowing Emerald Center Pin */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(-50%, -50%) scale(${isExpanded ? 1 : 0.4})`,
              transition: "transform 400ms cubic-bezier(0.34, 1.35, 0.64, 1)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 0 10px rgba(52, 211, 153, 0.5))",
              }}
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="#34D399"
              />
              <circle cx="12" cy="9" r="2.5" className="fill-background" />
            </svg>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>

        {/* Grid pattern when collapsed */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isExpanded ? 0 : 0.03,
            transition: "opacity 300ms ease",
          }}
        >
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern
                id="expand-map-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  className="stroke-foreground"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#expand-map-grid)" />
          </svg>
        </div>

        {/* Foreground content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <div
              className="relative"
              style={{
                opacity: isExpanded ? 0 : 1,
                transition: "opacity 300ms ease",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-400"
                style={{
                  filter: isHovered
                    ? "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))"
                    : "drop-shadow(0 0 4px rgba(52, 211, 153, 0.3))",
                  transition: "filter 300ms ease",
                }}
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
            </div>

            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-foreground/5 backdrop-blur-sm"
              style={{
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                transition: "transform 200ms ease",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                {badgeText}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h3
              className="text-foreground font-medium text-sm tracking-tight"
              style={{
                transform: isHovered ? "translateX(4px)" : "translateX(0px)",
                transition: "transform 250ms ease",
              }}
            >
              {location}
            </h3>

            {isExpanded && (
              <p className="text-muted-foreground text-xs font-mono tabular-nums">
                {coordinates}
              </p>
            )}

            <div
              className="h-px bg-gradient-to-r from-emerald-500/50 via-emerald-400/30 to-transparent origin-left"
              style={{
                transform:
                  isHovered || isExpanded ? "scaleX(1)" : "scaleX(0.3)",
                transition: "transform 400ms ease-out",
              }}
            />
          </div>
        </div>
      </div>

      <p
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
        style={{
          opacity: isHovered && !isExpanded ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        Click to expand
      </p>
    </div>
  );
}
