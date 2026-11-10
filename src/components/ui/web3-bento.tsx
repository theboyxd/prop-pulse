import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import {
  BENTO_PROFILES,
  type BentoDataset,
  type BentoCardItem,
  type BentoActivityItem,
} from "../../utils/automationEngine";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

function useCountUp(target: number, animate: boolean, duration = 1300) {
  const [val, setVal] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) {
      setVal(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate, duration]);
  return val;
}

function smoothPath(points: [number, number][]) {
  return points
    .map(([x, y], i) => {
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = points[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx.toFixed(1)} ${py.toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

interface TileProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Tile({ title, action, className, style, children }: TileProps) {
  return (
    <section
      className={cx(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-border bg-card p-5 text-card-foreground",
        className
      )}
      style={style}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h3 className="text-[13px] font-medium text-muted-foreground">
              {title}
            </h3>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Pills({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-full border border-border p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={opt === value}
          onClick={() => onChange(opt)}
          className={cx(
            "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap shrink-0",
            opt === value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface Formatter {
  usd: (n: number, decimals?: number) => string;
  num: (n: number, decimals?: number) => string;
}

function HeroTile({
  account,
  greetingSubtitle,
  heroMetricLabel,
  history,
  fmt,
  accent,
  accent2,
  reduced,
}: {
  account: string;
  greetingSubtitle: string;
  heroMetricLabel: string;
  history: number[];
  fmt: Formatter;
  accent: string;
  accent2: string;
  reduced: boolean;
}) {
  const mounted = useMounted();
  const current = history[history.length - 1];
  const animatedVal = useCountUp(current, !reduced);
  const last31 = history.slice(-31);
  const dailyPct = last31.slice(1).map((v, i) => (v / last31[i] - 1) * 100);
  const maxAbs = Math.max(...dailyPct.map(Math.abs), 0.01);
  const diff = current - last31[0];
  const diffPct = (current / last31[0] - 1) * 100;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const now = new Date();
  const dayLabel = (idx: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (dailyPct.length - 1 - idx));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Tile className="sm:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[32px] truncate">
            gm, <span style={{ color: accent }}>{account}</span>
          </p>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-[290px] leading-snug">
            {greetingSubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[12px] text-muted-foreground">{heroMetricLabel}</p>
          <p className="font-mono text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[38px]">
            {fmt.usd(animatedVal)}
          </p>
          <p className="mt-1.5 font-mono text-[12px] tabular-nums">
            <span style={{ color: diff >= 0 ? accent : accent2 }}>
              {diff >= 0 ? "+" : "−"}
              {fmt.usd(Math.abs(diff))} ({diffPct.toFixed(1)}%)
            </span>
            <span className="text-muted-foreground"> · 30d</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <div
          className="flex flex-1 items-end gap-[3px]"
          style={{ minHeight: 64 }}
          onPointerLeave={() => setHoveredIdx(null)}
        >
          {dailyPct.map((pct, idx) => {
            const hPct = 18 + (Math.abs(pct) / maxAbs) * 82;
            const pos = pct >= 0;
            return (
              <button
                key={idx}
                type="button"
                onPointerEnter={() => setHoveredIdx(idx)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-label={`${dayLabel(idx)}: ${pos ? "+" : "−"}${Math.abs(pct).toFixed(2)}%`}
                className="relative flex-1 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  height: mounted ? `${hPct}%` : "6%",
                  background: pos ? accent : accent2,
                  opacity:
                    hoveredIdx === null
                      ? 0.35 + (Math.abs(pct) / maxAbs) * 0.65
                      : hoveredIdx === idx
                        ? 1
                        : 0.25,
                  transition: `height 900ms ${EASE} ${idx * 18}ms, opacity 200ms ease`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{dayLabel(0)}</span>
          <span className="text-foreground" aria-live="polite">
            {hoveredIdx !== null
              ? `${dayLabel(hoveredIdx)} · ${dailyPct[hoveredIdx] >= 0 ? "+" : "−"}${Math.abs(dailyPct[hoveredIdx]).toFixed(2)}%`
              : "Daily Velocity"}
          </span>
          <span>Today</span>
        </div>
      </div>
    </Tile>
  );
}

function Chip() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="25"
        height="19"
        rx="4.5"
        fill="oklch(0.9 0.06 90)"
        stroke="oklch(0.62 0.07 80 / 0.6)"
      />
      <path
        d="M0.5 7h7.5v6H0.5M25.5 7H18v6h7.5M8 0.5v19M18 0.5v19M8 10h10"
        fill="none"
        stroke="oklch(0.6 0.07 80 / 0.55)"
        strokeWidth="0.9"
      />
    </svg>
  );
}

function CardFace({ c, glare }: { c: BentoCardItem; glare: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-[12px]"
        style={{
          backgroundImage: [
            "linear-gradient(180deg, oklch(1 0 0 / 0.3) 0%, transparent 34%)",
            `radial-gradient(110% 90% at 100% 0%, ${c.color2} 0%, transparent 60%)`,
            `linear-gradient(135deg, ${c.color} 0%, ${c.color2} 100%)`,
          ].join(", "),
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.5), inset 0 0 0 1px oklch(1 0 0 / 0.16)",
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 18%, oklch(0.9 0.12 350 / 0.55) 32%, oklch(0.92 0.1 220 / 0.55) 42%, oklch(0.94 0.14 130 / 0.5) 52%, oklch(0.92 0.12 60 / 0.45) 62%, transparent 78%)",
            backgroundSize: "260% 100%",
            backgroundPosition: `${glare}% 0`,
            mixBlendMode: "soft-light",
            transition: "background-position 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </span>
      <span className="relative flex items-center justify-between gap-3 px-4 pt-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <Chip />
          <span className="truncate text-[13px] font-bold tracking-tight">
            {c.label}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums">
          {c.last4}
        </span>
      </span>
      <span
        className="absolute bottom-3.5 right-4 opacity-70"
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M15.5 2.5a13 13 0 0 1 0 19"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </>
  );
}

function CardsTile({
  titleLabel,
  cards,
  reduced,
}: {
  titleLabel: string;
  cards: BentoCardItem[];
  reduced: boolean;
}) {
  const [order, setOrder] = useState(() => cards.map((c) => c.id));
  useEffect(() => {
    setOrder(cards.map((c) => c.id));
  }, [cards]);

  const mounted = useMounted();
  const step = 46;
  const maxIdx = order.length - 1;
  const activeCard =
    cards.find((c) => c.id === order[order.length - 1]) ?? cards[0];
  const [glare, setGlare] = useState(30);
  const pointerActive = useRef(false);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setGlare((prev) =>
        pointerActive.current ? prev : 30 + Math.sin((now - start) / 2600) * 30
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <Tile
      title={
        <span>
          {titleLabel}{" "}
          <sup className="font-mono text-[10px]">{cards.length}</sup>
        </span>
      }
      className="lg:col-start-3 lg:row-start-1"
    >
      <div
        className="relative -mx-5 -mb-5 flex flex-1 flex-col justify-end overflow-hidden pt-1"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointerActive.current = true;
          setGlare(((e.clientX - rect.left) / rect.width) * 100);
        }}
        onPointerLeave={() => {
          pointerActive.current = false;
        }}
      >
        <div className="relative">
          {order.map((id, idx) => {
            const card = cards.find((c) => c.id === id);
            if (!card) return null;
            const depth = order.length - 1 - idx;
            const isFront = depth === 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  !isFront &&
                  setOrder((prev) => [...prev.filter((x) => x !== id), id])
                }
                aria-label={`${card.label} (${card.last4})${isFront ? ", selected" : ", bring to front"}`}
                aria-pressed={isFront}
                className="group absolute left-1/2 block w-[calc(100%-32px)] max-w-[300px] rounded-[12px] p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  top: (maxIdx - depth) * step,
                  zIndex: idx + 1,
                  transform: `translateX(-50%) scale(${1 - depth * 0.055}) translateY(${mounted ? 0 : 20}px)`,
                  transformOrigin: "top center",
                  opacity: mounted ? 1 : 0,
                  color: card.ink,
                  boxShadow: "0 -10px 28px -14px oklch(0 0 0 / 0.75)",
                  transition: reduced
                    ? "none"
                    : `top 650ms cubic-bezier(0.34, 1.35, 0.64, 1), transform 650ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 500ms ease ${idx * 90}ms`,
                  cursor: isFront ? "default" : "pointer",
                }}
              >
                <span
                  className="relative block w-full"
                  style={{ paddingTop: "63.08%" }}
                >
                  <span className="absolute inset-0 block">
                    <CardFace c={card} glare={glare + depth * 18} />
                  </span>
                </span>
              </button>
            );
          })}
          <div
            aria-hidden="true"
            className="invisible mx-auto w-[calc(100%-32px)] max-w-[300px] shrink-0"
            style={{ marginTop: maxIdx * step }}
          >
            <div style={{ paddingTop: "30%" }} />
          </div>
        </div>

        <div
          className="relative z-10 flex shrink-0 items-end justify-between gap-3 px-5 pb-4"
          style={{
            height: 88,
            background: "color-mix(in oklch, var(--color-card) 72%, transparent)",
            backdropFilter: "blur(18px) saturate(1.3)",
            WebkitBackdropFilter: "blur(18px) saturate(1.3)",
            borderTop:
              "1px solid color-mix(in oklch, var(--color-foreground) 10%, transparent)",
          }}
          aria-live="polite"
        >
          <div className="min-w-0">
            <p className="truncate font-mono text-[14px] font-semibold tabular-nums tracking-[0.04em]">
              {activeCard.label} · {activeCard.last4}
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {activeCard.holder ?? activeCard.label}
              {activeCard.expiry ? ` · ${activeCard.expiry}` : ""}
            </p>
          </div>
          {activeCard.balance && (
            <p className="shrink-0 font-mono text-[15px] font-semibold tabular-nums">
              {activeCard.balance}
            </p>
          )}
        </div>
      </div>
    </Tile>
  );
}

function GasTile({
  titleLabel,
  unitLabel,
  subtextPrefix,
  accent,
  reduced,
}: {
  titleLabel: string;
  unitLabel: string;
  subtextPrefix: string;
  accent: string;
  reduced: boolean;
}) {
  const [baseLatency, setBaseLatency] = useState(1.4);
  const [mode, setMode] = useState("Instant");

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () =>
        setBaseLatency((v) =>
          Math.max(0.8, Math.min(3.8, v + (Math.random() - 0.5) * 0.25))
        ),
      2200
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  const mult =
    ({ Human: 2.2, Smart: 1.35, Instant: 0.85 } as Record<string, number>)[
      mode
    ] ?? 1;
  const currentVal = baseLatency * mult;
  const ratio = Math.min(1, currentVal / 4.5);
  const arcLen = Math.PI * 62;
  const deg = -90 + ratio * 180;

  return (
    <Tile
      title={titleLabel}
      className="lg:col-start-4 lg:row-start-1"
      action={
        <span className="font-mono text-[11px] text-muted-foreground">
          24/7 AI
        </span>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative" style={{ width: 150, height: 86 }}>
          <svg
            width="150"
            height="86"
            viewBox="0 0 150 86"
            aria-hidden="true"
          >
            <path
              d="M 13 78 A 62 62 0 0 1 137 78"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              style={{ stroke: "var(--color-muted)" }}
            />
            <path
              d="M 13 78 A 62 62 0 0 1 137 78"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              style={{
                stroke: accent,
                strokeDashoffset: arcLen * (1 - ratio),
                transition: `stroke-dashoffset 900ms ${EASE}`,
              }}
            />
            <g
              style={{
                transform: `rotate(${deg}deg)`,
                transformOrigin: "75px 78px",
                transition: `transform 900ms ${EASE}`,
              }}
            >
              <line
                x1="75"
                y1="78"
                x2="75"
                y2="30"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ stroke: "var(--color-foreground)" }}
              />
            </g>
            <circle
              cx="75"
              cy="78"
              r="5"
              style={{ fill: "var(--color-foreground)" }}
            />
          </svg>
        </div>
        <p className="mt-2 font-mono text-[26px] font-semibold leading-none tabular-nums">
          {currentVal.toFixed(1)}{" "}
          <span className="text-sm text-muted-foreground">{unitLabel}</span>
        </p>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {subtextPrefix}WhatsApp API
        </p>
      </div>
      <div className="mt-4 flex justify-center">
        <Pills
          label="AI Dispatch Speed"
          value={mode}
          options={["Human", "Smart", "Instant"]}
          onChange={setMode}
        />
      </div>
    </Tile>
  );
}

function ChartTile({
  title,
  primaryLabel,
  secondaryLabel,
  badgeSuffix,
  history,
  benchmark,
  fmt,
  accent,
  reduced,
}: {
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  badgeSuffix: string;
  history: number[];
  benchmark: number[];
  fmt: Formatter;
  accent: string;
  reduced: boolean;
}) {
  const gradId = useId().replace(/:/g, "");
  const [range, setRange] = useState("1Y");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const mounted = useMounted();

  const count = ({ "1W": 8, "1M": 31, "1Y": history.length } as Record<
    string,
    number
  >)[range];
  const step = range === "1Y" ? 7 : 1;
  const pick = (arr: number[]) =>
    arr
      .slice(-count)
      .filter((_, i, a) => i % step === 0 || i === a.length - 1);

  const seriesA = pick(history);
  const seriesB = pick(benchmark);
  const W = 640;
  const H = 220;
  const minVal = Math.min(...seriesA, ...seriesB);
  const maxVal = Math.max(...seriesA, ...seriesB);
  const toY = (v: number) =>
    H - 16 - ((v - minVal) / (maxVal - minVal || 1)) * (H - 40);

  const ptsA: [number, number][] = seriesA.map((v, i) => [
    (i / (seriesA.length - 1)) * W,
    toY(v),
  ]);
  const ptsB: [number, number][] = seriesB.map((v, i) => [
    (i / (seriesB.length - 1)) * W,
    toY(v),
  ]);

  const pathA = smoothPath(ptsA);
  const pathB = smoothPath(ptsB);
  const activeIdx = hoverIdx ?? seriesA.length - 1;
  const deltaVsBench =
    (seriesA[seriesA.length - 1] / seriesA[0] -
      1 -
      (seriesB[seriesB.length - 1] / seriesB[0] - 1)) *
    100;

  const xAxisLabels =
    range === "1Y"
      ? ["Nov", "Jan", "Mar", "May", "Jul", "Sep", "Now"]
      : range === "1M"
        ? ["4w", "3w", "2w", "1w", "Now"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Now"];

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverIdx(
      Math.max(
        0,
        Math.min(
          seriesA.length - 1,
          Math.round(((e.clientX - rect.left) / rect.width) * (seriesA.length - 1))
        )
      )
    );
  };

  const cursorX = `${(ptsA[activeIdx][0] / W) * 100}%`;

  return (
    <Tile
      title={title}
      className="sm:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-2"
      action={
        <Pills
          label="Chart range"
          value={range}
          options={["1W", "1M", "1Y"]}
          onChange={setRange}
        />
      }
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span
              className="h-[3px] w-4 rounded-full"
              style={{ background: accent }}
              aria-hidden="true"
            />
            {primaryLabel}
          </p>
          <p className="mt-1 font-mono text-[22px] font-semibold tabular-nums">
            {fmt.usd(seriesA[activeIdx])}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span
              className="h-0 w-4 border-t-2 border-dashed border-muted-foreground"
              aria-hidden="true"
            />
            {secondaryLabel}
          </p>
          <p className="mt-1 font-mono text-[22px] font-semibold tabular-nums text-muted-foreground">
            {fmt.usd(seriesB[activeIdx])}
          </p>
        </div>
        <span
          className="ml-auto rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums"
          style={{
            background: `color-mix(in oklch, ${accent} 18%, transparent)`,
            color: accent,
          }}
        >
          {deltaVsBench >= 0 ? "+" : "−"}
          {Math.abs(deltaVsBench).toFixed(1)}
          {badgeSuffix}
        </span>
      </div>

      <div
        className="relative mt-4 flex-1 touch-pan-y"
        style={{ minHeight: 220 }}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`${primaryLabel} ${fmt.usd(seriesA[seriesA.length - 1])} versus ${secondaryLabel} ${fmt.usd(seriesB[seriesB.length - 1])} over ${range}`}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${gradId}-f`} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                style={{ stopColor: accent, stopOpacity: 0.28 }}
              />
              <stop
                offset="1"
                style={{ stopColor: accent, stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1={0}
              x2={W}
              y1={H * r}
              y2={H * r}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1 5"
              style={{ stroke: "var(--color-border)" }}
            />
          ))}
          <path
            d={`${pathA} L ${W} ${H} L 0 ${H} Z`}
            fill={`url(#${gradId}-f)`}
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 900ms ease 400ms",
            }}
          />
          <path
            d={pathB}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--color-muted-foreground)" }}
          />
          <path
            key={range}
            d={pathA}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{
              stroke: accent,
              strokeDasharray: 1,
              strokeDashoffset: mounted || reduced ? 0 : 1,
              transition: reduced
                ? "none"
                : `stroke-dashoffset 1300ms ${EASE}`,
            }}
          />
        </svg>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-border"
          style={{ left: cursorX, opacity: hoverIdx !== null ? 1 : 0 }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card"
          style={{
            left: cursorX,
            top: `${(ptsA[activeIdx][1] / H) * 100}%`,
            background: accent,
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-muted-foreground"
          style={{
            left: cursorX,
            top: `${(ptsB[activeIdx][1] / H) * 100}%`,
            opacity: hoverIdx !== null ? 1 : 0,
          }}
        />
      </div>

      <div
        className="mt-3 flex justify-between font-mono text-[11px] text-muted-foreground"
        aria-hidden="true"
      >
        {xAxisLabels.map((lbl) => (
          <span key={lbl}>{lbl}</span>
        ))}
      </div>
    </Tile>
  );
}

function AllocationTile({
  title,
  allocation,
  fmt,
  accent,
  accent2,
}: {
  title: string;
  allocation: { symbol: string; value: number }[];
  fmt: Formatter;
  accent: string;
  accent2: string;
}) {
  const mounted = useMounted();
  const total = allocation.reduce((s, x) => s + x.value, 0);
  const colors = [
    accent,
    accent2,
    "oklch(0.78 0.04 280)",
    "oklch(0.6 0.03 280)",
    "oklch(0.42 0.02 280)",
  ];
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Tile title={title} className="lg:col-start-3 lg:row-start-2">
      <p className="font-mono text-[22px] font-semibold tabular-nums">
        {fmt.usd(total)}
      </p>
      <div
        className="mt-4 flex h-9 gap-1"
        onPointerLeave={() => setHovered(null)}
      >
        {allocation.map((item, i) => (
          <span
            key={item.symbol}
            onPointerEnter={() => setHovered(i)}
            className="rounded-[8px]"
            style={{
              flexBasis: mounted
                ? `${(item.value / total) * 100}%`
                : `${100 / allocation.length}%`,
              background: colors[i % colors.length],
              opacity: hovered === null || hovered === i ? 1 : 0.3,
              transition: `flex-basis 1000ms ${EASE} ${200 + i * 60}ms, opacity 200ms ease`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {allocation.map((item, i) => (
          <li
            key={item.symbol}
            className="flex items-center justify-between gap-2 text-[12px]"
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2 truncate">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: colors[i % colors.length] }}
                aria-hidden="true"
              />
              <span className="truncate">{item.symbol}</span>
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

function StakingTile({
  dataset,
  fmt,
  accent,
  reduced,
  onTriggerBatch,
}: {
  dataset: BentoDataset;
  fmt: Formatter;
  accent: string;
  reduced: boolean;
  onTriggerBatch?: () => void;
}) {
  const { staking } = dataset;
  const [accrued, setAccrued] = useState(staking.rewards);
  useEffect(() => {
    setAccrued(staking.rewards);
  }, [staking.rewards]);

  const rate = (staking.staked * staking.apy) / 100 / (365 * 24 * 3600);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setAccrued((v) => v + rate * 0.1),
      100
    );
    return () => window.clearInterval(id);
  }, [reduced, rate]);

  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    setSubmitted(false);
  }, [dataset.id]);

  const cycleSec = Math.round(6.4 * 60);
  const [elapsed, setElapsed] = useState(211);
  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed((e) => (e + 1) % cycleSec),
      1000
    );
    return () => window.clearInterval(id);
  }, [cycleSec]);

  const rem = cycleSec - elapsed;
  const countdown = `${Math.floor(rem / 60)}m ${String(Math.floor(rem % 60)).padStart(2, "0")}s`;
  const pct = (elapsed / cycleSec) * 100;
  const bars = [0.62, 0.7, 0.58, 0.81, 0.74, 0.9, 0.86, 0.95, 0.88, 1];
  const ink = "oklch(0.24 0.06 135)";

  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[26px] p-5 lg:col-start-4 lg:row-span-2 lg:row-start-2"
      style={{ background: accent, color: ink }}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold opacity-75">
          {dataset.stakingTitle}
        </h3>
        <span
          className="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
          style={{ background: "oklch(0.24 0.06 135 / 0.12)" }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: ink }}
            aria-hidden="true"
          />
          {dataset.stakingStatus}
        </span>
      </header>

      <p className="mt-5 font-mono text-[52px] font-semibold leading-none tracking-[-0.05em] tabular-nums">
        {staking.apy.toFixed(1)}
        <span className="text-[22px]">{dataset.stakingMetricSuffix}</span>
      </p>
      <p className="mt-1 text-[12px] font-medium opacity-70">
        {dataset.stakingSubtext}
      </p>

      <div
        className="mt-5 rounded-2xl p-3"
        style={{ background: "oklch(0.24 0.06 135 / 0.1)" }}
      >
        <div className="flex items-baseline justify-between text-[12px] font-semibold">
          <span className="opacity-70">{dataset.stakingPayoutLabel}</span>
          <span className="font-mono tabular-nums">{countdown}</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: "oklch(0.24 0.06 135 / 0.14)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: ink,
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-[12px]">
        {dataset.stakingMeta.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="opacity-70">{k}</dt>
            <dd className="font-mono font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto pt-6">
        <p className="text-[12px] font-semibold opacity-70">
          {dataset.stakingRewardsLabel}
        </p>
        <p
          className="mt-1 font-mono text-[20px] font-semibold tabular-nums"
          aria-live="off"
        >
          {accrued.toFixed(6)}{" "}
          <span className="text-[13px]">{staking.asset}</span>
        </p>
        <p className="font-mono text-[12px] tabular-nums opacity-70">
          ≈ {fmt.usd(accrued * staking.usdPrice)}
        </p>

        <div
          className="mt-5 flex h-12 items-end gap-1"
          aria-hidden="true"
        >
          {bars.map((b, i) => (
            <span
              key={i}
              className="flex-1 rounded-[4px]"
              style={{
                height: `${b * 100}%`,
                background: ink,
                opacity: 0.12 + (i / bars.length) * 0.5,
              }}
            />
          ))}
        </div>
        <p className="mt-1.5 font-mono text-[10px] opacity-60">
          Last 10 automated cycles
        </p>

        <button
          type="button"
          onClick={() => {
            setSubmitted(true);
            onTriggerBatch?.();
          }}
          disabled={submitted}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 whitespace-nowrap"
          style={{
            background: ink,
            color: accent,
            opacity: submitted ? 0.75 : 1,
          }}
        >
          {submitted ? dataset.stakingButtonDoneText : dataset.stakingButtonText}
        </button>
      </div>
    </section>
  );
}

function LiquidityTile({
  dataset,
  fmt,
  accent,
  accent2,
  reduced,
}: {
  dataset: BentoDataset;
  fmt: Formatter;
  accent: string;
  accent2: string;
  reduced: boolean;
}) {
  const { liquidity: lp } = dataset;
  const [livePrice, setLivePrice] = useState(lp.price);
  useEffect(() => {
    setLivePrice(lp.price);
  }, [lp.price]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setLivePrice((p) => p * (1 + (Math.random() - 0.5) * 0.006)),
      1800
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  const domainMin = lp.min - (lp.max - lp.min) * 0.45;
  const domainMax = lp.max + (lp.max - lp.min) * 0.45;
  const pos = (val: number) =>
    ((val - domainMin) / (domainMax - domainMin)) * 100;
  const inRange = livePrice >= lp.min && livePrice <= lp.max;

  return (
    <Tile
      title={`${lp.pair} · ${lp.fee}`}
      className="lg:col-start-3 lg:row-start-3"
      action={
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap"
          style={{
            background: `color-mix(in oklch, ${inRange ? accent : accent2} 18%, transparent)`,
            color: inRange ? accent : accent2,
          }}
        >
          {inRange ? "In target band" : "Out of band"}
        </span>
      }
    >
      <p className="font-mono text-[22px] font-semibold tabular-nums">
        {fmt.usd(livePrice, 1)}k
      </p>
      <p className="font-mono text-[11px] text-muted-foreground">
        {dataset.liquiditySubtext}
      </p>

      <div
        className="relative mt-6 h-10"
        role="img"
        aria-label={`Target band ${fmt.usd(lp.min)}k to ${fmt.usd(lp.max)}k, current ${fmt.usd(livePrice, 1)}k`}
      >
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-10 -translate-y-1/2 rounded-[10px]"
          style={{
            left: `${pos(lp.min)}%`,
            width: `${pos(lp.max) - pos(lp.min)}%`,
            background: `repeating-linear-gradient(135deg, color-mix(in oklch, ${accent} 26%, transparent) 0 6px, color-mix(in oklch, ${accent} 12%, transparent) 6px 12px)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent} 55%, transparent)`,
          }}
        />
        <div
          className="absolute top-1/2 h-14 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
          style={{
            left: `${Math.max(2, Math.min(98, pos(livePrice)))}%`,
            transition: `left 900ms ${EASE}`,
          }}
        />
      </div>

      <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
        <span style={{ marginLeft: `${pos(lp.min) - 6}%` }}>
          ${fmt.num(lp.min)}k
        </span>
        <span style={{ marginRight: `${100 - pos(lp.max) - 6}%` }}>
          ${fmt.num(lp.max)}k
        </span>
      </div>

      <p className="mt-auto pt-4 text-[12px] text-muted-foreground">
        {dataset.liquidityFooterPrefix}
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {fmt.usd(lp.fees, 0)}
        </span>
      </p>
    </Tile>
  );
}

function BlocksTile({
  dataset,
  accent,
  reduced,
}: {
  dataset: BentoDataset;
  accent: string;
  reduced: boolean;
}) {
  const seedFills = useMemo(
    () =>
      Array.from(
        { length: 42 },
        (_, i) =>
          0.35 + ((((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1) * 0.65
      ),
    []
  );
  const [blocks, setBlocks] = useState(() =>
    seedFills.map((fill, i) => ({
      n: 14820 + i,
      fill,
      txs: Math.round(12 + fill * 36),
    }))
  );
  const [secAgo, setSecAgo] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const bTimer = window.setInterval(() => {
      setBlocks((prev) => {
        const fill = 0.3 + Math.random() * 0.7;
        return [
          ...prev.slice(1),
          {
            n: prev[prev.length - 1].n + 1,
            fill,
            txs: Math.round(12 + fill * 36),
          },
        ];
      });
      setSecAgo(0);
    }, 3000);
    const sTimer = window.setInterval(() => setSecAgo((s) => s + 1), 1000);
    return () => {
      window.clearInterval(bTimer);
      window.clearInterval(sTimer);
    };
  }, [reduced]);

  const latest = blocks[blocks.length - 1];

  return (
    <Tile
      title={dataset.blocksTitle}
      className="sm:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-4"
      action={
        <span className="font-mono text-[11px] text-muted-foreground">
          {secAgo}s ago
        </span>
      }
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[22px] font-semibold tabular-nums">
            Batch #{latest.n.toLocaleString("en-US")}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {latest.txs} properties · {(latest.fill * 100).toFixed(0)}% owner
            match
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          {dataset.blocksTargetText}
        </p>
      </div>

      <div
        className="mt-4 flex flex-1 items-end gap-[3px]"
        style={{ minHeight: 64 }}
        aria-hidden="true"
      >
        {blocks.map((b, i) => {
          const isLast = i === blocks.length - 1;
          return (
            <span
              key={b.n}
              className="flex-1 rounded-[3px]"
              style={{
                height: `${b.fill * 100}%`,
                background: isLast ? accent : "var(--color-muted-foreground)",
                opacity: isLast ? 1 : 0.15 + (i / blocks.length) * 0.45,
                animation:
                  isLast && !reduced
                    ? "orbit-pop 500ms cubic-bezier(.3,1.5,.6,1)"
                    : undefined,
                transformOrigin: "bottom",
              }}
            />
          );
        })}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
        {[
          [dataset.blocksFooterLabels[0], "1.4s"],
          [
            dataset.blocksFooterLabels[1],
            `${Math.round((blocks.reduce((a, b) => a + b.fill, 0) / blocks.length) * 100)}%`,
          ],
          [
            dataset.blocksFooterLabels[2],
            `${(blocks.slice(-10).reduce((a, b) => a + b.txs, 0) / 10).toFixed(1)}/min`,
          ],
        ].map(([dt, dd]) => (
          <div key={dt} className="min-w-0">
            <dt className="text-[11px] text-muted-foreground truncate">{dt}</dt>
            <dd className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">
              {dd}
            </dd>
          </div>
        ))}
      </dl>
    </Tile>
  );
}

function KindIcon({ kind }: { kind: BentoActivityItem["kind"] }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "swap") {
    return (
      <svg {...props}>
        <path d="M7 7h12l-3-3M17 17H5l3 3" />
      </svg>
    );
  }
  if (kind === "bridge") {
    return (
      <svg {...props}>
        <path d="M3 17c3-6 15-6 18 0M7 13v4M17 13v4M12 11.5V17" />
      </svg>
    );
  }
  if (kind === "stake") {
    return (
      <svg {...props}>
        <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
      </svg>
    );
  }
  if (kind === "mint") {
    return (
      <svg {...props}>
        <path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M12 5v14m0 0-6-6m6 6 6-6" />
    </svg>
  );
}

function ActivityTile({
  title,
  activity,
  accent,
  accent2,
}: {
  title: string;
  activity: BentoActivityItem[];
  accent: string;
  accent2: string;
}) {
  const mounted = useMounted();
  return (
    <Tile
      title={title}
      className="sm:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-4"
    >
      <ul className="-mx-2 -my-1">
        {activity.slice(0, 4).map((item, idx) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/50"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(6px)",
              transition: `opacity 500ms ease ${300 + idx * 70}ms, transform 500ms ${EASE} ${300 + idx * 70}ms`,
            }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
              <KindIcon kind={item.kind} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{item.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.detail} · {item.time}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[13px] font-medium tabular-nums">
                {item.amount}
              </p>
              <p
                className="mt-0.5 flex items-center justify-end gap-1 font-mono text-[10px] font-semibold"
                style={{
                  color:
                    item.status === "pending"
                      ? accent
                      : item.status === "failed"
                        ? accent2
                        : "var(--color-muted-foreground)",
                }}
              >
                {item.status === "pending" && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.3"
                      strokeWidth="3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

export interface Web3BentoProps {
  dataset?: BentoDataset;
  accent?: string;
  accent2?: string;
  locale?: string;
  className?: string;
  onTriggerBatch?: () => void;
}

export function Web3Bento({
  dataset = BENTO_PROFILES.owner_all,
  accent = "oklch(0.89 0.2 128)",
  accent2 = "oklch(0.74 0.12 300)",
  locale = "en-US",
  className,
  onTriggerBatch,
}: Web3BentoProps) {
  const reduced = useReducedMotion();
  const fmt = useMemo(() => {
    const cache: Record<string, Intl.NumberFormat> = {};
    const get = (key: string, opts: Intl.NumberFormatOptions) =>
      cache[key] ?? (cache[key] = new Intl.NumberFormat(locale, opts));
    return {
      usd: (n: number, dec = 0) =>
        get(`u${dec}`, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        }).format(n),
      num: (n: number, dec = 0) =>
        get(`n${dec}`, {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        }).format(n),
    };
  }, [locale]);

  return (
    <div className={cx("w-full max-w-[1120px]", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroTile
          account={dataset.account}
          greetingSubtitle={dataset.greetingSubtitle}
          heroMetricLabel={dataset.heroMetricLabel}
          history={dataset.history}
          fmt={fmt}
          accent={accent}
          accent2={accent2}
          reduced={reduced}
        />
        <CardsTile
          titleLabel={dataset.cardsTitle}
          reduced={reduced}
          cards={dataset.cards}
        />
        <GasTile
          titleLabel={dataset.gasTitle}
          unitLabel={dataset.gasUnit}
          subtextPrefix={dataset.gasSubtextPrefix}
          accent={accent}
          reduced={reduced}
        />
        <ChartTile
          title={dataset.chartTitle}
          primaryLabel={dataset.chartPrimaryLabel}
          secondaryLabel={dataset.chartSecondaryLabel}
          badgeSuffix={dataset.chartBadgeSuffix}
          history={dataset.history}
          benchmark={dataset.benchmark}
          fmt={fmt}
          accent={accent}
          reduced={reduced}
        />
        <AllocationTile
          title={dataset.allocationTitle}
          allocation={dataset.allocation}
          fmt={fmt}
          accent={accent}
          accent2={accent2}
        />
        <StakingTile
          dataset={dataset}
          fmt={fmt}
          accent={accent}
          reduced={reduced}
          onTriggerBatch={onTriggerBatch}
        />
        <LiquidityTile
          dataset={dataset}
          fmt={fmt}
          accent={accent}
          accent2={accent2}
          reduced={reduced}
        />
        <BlocksTile dataset={dataset} accent={accent} reduced={reduced} />
        <ActivityTile
          title={dataset.activityTitle}
          activity={dataset.activity}
          accent={accent}
          accent2={accent2}
        />
      </div>
    </div>
  );
}
