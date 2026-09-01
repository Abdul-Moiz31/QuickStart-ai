"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Bot,
  Code2,
  FileText,
  KeyRound,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Target,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const LINE_DURATION = 0.7;
const LINE_BASE_DELAY = 0.1;
const LINE_STAGGER = 0.1;
const PILL_BUFFER = 0.05;

const SPARK_DURATION = 2.2;
const SPARK_ROW_STAGGER = 0.35;

function lineDelay(index: number) {
  return LINE_BASE_DELAY + index * LINE_STAGGER;
}

function pillDelay(index: number) {
  return lineDelay(index) + LINE_DURATION + PILL_BUFFER;
}

function sparkDelay(index: number) {
  return index * SPARK_ROW_STAGGER;
}

function arrivalFractionOf(geo?: { startLength: number; totalLength: number }) {
  if (!geo || geo.totalLength === 0) return 0.8;
  return 1 - geo.startLength / geo.totalLength;
}

const LEFT: { icon: LucideIcon; label: string }[] = [
  { icon: Target, label: "Accuracy" },
  { icon: FileText, label: "Insights" },
  { icon: RefreshCw, label: "Automation" },
  { icon: Code2, label: "One-line setup" },
];

const RIGHT: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Security" },
  { icon: KeyRound, label: "Control" },
  { icon: Bell, label: "Alerts" },
  { icon: Webhook, label: "Integrations" },
];

function connector(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

/**
 * Every connector path starts at the hub's center, so the line convincingly
 * disappears under it. The traveling glow riding that same path needs to only
 * become visible once it has actually cleared the hub's circular edge —
 * otherwise it renders inside the hub. This walks the path's real geometry
 * (not a guessed percentage) to find that exact point, in real pixel length.
 */
type LineGeometry = { startLength: number; totalLength: number };

function lengthAtRadius(
  pathEl: SVGPathElement,
  center: { x: number; y: number },
  radius: number,
): LineGeometry {
  const total = pathEl.getTotalLength();
  if (total === 0) return { startLength: 0, totalLength: 0 };

  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const p = pathEl.getPointAtLength(mid);
    const dist = Math.hypot(p.x - center.x, p.y - center.y);
    if (dist < radius) lo = mid;
    else hi = mid;
  }
  return { startLength: Math.min(total * 0.9, hi), totalLength: total };
}

function OrbitPill({
  pillRef,
  item,
  index,
  pulsing,
  arrivalFraction,
}: {
  pillRef: (el: HTMLDivElement | null) => void;
  item: { icon: LucideIcon; label: string };
  index: number;
  pulsing: boolean;
  arrivalFraction: number;
}) {
  const reduce = useReducedMotion();
  const Icon = item.icon;
  // Flash timing must land exactly when the spark visually arrives — i.e. at
  // `arrivalFraction` of the shared cycle — not a fixed guess.
  const flashAt = Math.min(0.97, Math.max(0.15, arrivalFraction));
  const preFlashAt = Math.max(0, flashAt - 0.06);

  return (
    <motion.div
      ref={pillRef}
      className="relative flex items-center gap-2 rounded-full border border-ink/[0.06] bg-white px-4 py-2.5 shadow-nav"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      animate={
        pulsing && !reduce
          ? {
              backgroundColor: ["#FFFFFF", "#FFFFFF", "#EEEAFE", "#FFFFFF"],
            }
          : undefined
      }
      transition={
        pulsing && !reduce
          ? {
              duration: SPARK_DURATION,
              delay: sparkDelay(index),
              repeat: Infinity,
              repeatDelay: 0,
              times: [0, preFlashAt, flashAt, 1],
              ease: "easeInOut",
            }
          : { duration: 0.4, delay: pillDelay(index), ease }
      }
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-ink">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="whitespace-nowrap text-sm font-semibold text-ink">{item.label}</span>
    </motion.div>
  );
}

const COMET_LENGTH = 46;

/**
 * A bright segment of the line itself sliding from the hub's edge to the
 * pill — not a shape riding over the line, but the stroke lighting up as it
 * travels, like current moving through a wire.
 */
function LineSpark({
  path,
  index,
  startLength,
  totalLength,
}: {
  path: string;
  index: number;
  startLength: number;
  totalLength: number;
}) {
  const reduce = useReducedMotion();
  if (reduce || !path || totalLength === 0) return null;

  const comet = Math.min(COMET_LENGTH, (totalLength - startLength) * 0.6);
  const visibleDuration = SPARK_DURATION * (1 - startLength / totalLength);

  return (
    <motion.path
      d={path}
      fill="none"
      stroke="#8B7EF2"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray={`${comet} ${totalLength}`}
      style={{ filter: "drop-shadow(0 0 4px rgba(92,78,236,0.85))" }}
      initial={{ strokeDashoffset: -startLength }}
      animate={{ strokeDashoffset: -(totalLength + comet) }}
      transition={{
        duration: visibleDuration,
        delay: sparkDelay(index),
        repeat: Infinity,
        repeatDelay: SPARK_DURATION - visibleDuration,
        ease: "linear",
      }}
    />
  );
}

function InsightDiagram() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rightPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<{ left: string[]; right: string[] }>({
    left: [],
    right: [],
  });
  const [sparkStart, setSparkStart] = useState<{ left: LineGeometry[]; right: LineGeometry[] }>({
    left: [],
    right: [],
  });
  const [pulsing, setPulsing] = useState(false);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const hub = hubRef.current;
      if (!container || !hub) return;

      const containerRect = container.getBoundingClientRect();
      const hubRect = hub.getBoundingClientRect();
      const hubCenter = {
        x: hubRect.left + hubRect.width / 2 - containerRect.left,
        y: hubRect.top + hubRect.height / 2 - containerRect.top,
      };

      const left = leftRefs.current.map((el) => {
        if (!el) return "";
        const r = el.getBoundingClientRect();
        const to = {
          x: r.right - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
        };
        return connector(hubCenter.x, hubCenter.y, to.x, to.y);
      });

      const right = rightRefs.current.map((el) => {
        if (!el) return "";
        const r = el.getBoundingClientRect();
        const to = {
          x: r.left - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
        };
        return connector(hubCenter.x, hubCenter.y, to.x, to.y);
      });

      setBox({ w: containerRect.width, h: containerRect.height });
      setPaths({ left, right });
    }

    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Once the <path> elements exist in the DOM with real geometry, find where
  // each one actually crosses the hub's edge so sparks never render inside it.
  useEffect(() => {
    const container = containerRef.current;
    const hub = hubRef.current;
    if (!container || !hub || paths.left.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const hubRect = hub.getBoundingClientRect();
    const hubCenter = {
      x: hubRect.left + hubRect.width / 2 - containerRect.left,
      y: hubRect.top + hubRect.height / 2 - containerRect.top,
    };
    const clearRadius = hubRect.width / 2 + 8;

    const fallback: LineGeometry = { startLength: 0, totalLength: 0 };
    const left = leftPathRefs.current.map((el) =>
      el ? lengthAtRadius(el, hubCenter, clearRadius) : fallback,
    );
    const right = rightPathRefs.current.map((el) =>
      el ? lengthAtRadius(el, hubCenter, clearRadius) : fallback,
    );

    setSparkStart({ left, right });
  }, [paths, box]);

  return (
    <div ref={containerRef} className="relative mx-auto hidden w-full max-w-4xl lg:block">
      {box.w > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          viewBox={`0 0 ${box.w} ${box.h}`}
          fill="none"
          aria-hidden
        >
          {paths.left.map((d, i) => (
            <motion.path
              key={LEFT[i]!.label}
              ref={(el) => {
                leftPathRefs.current[i] = el;
              }}
              d={d}
              stroke="#5C4EEC"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: LINE_DURATION, delay: lineDelay(i), ease }}
            />
          ))}
          {paths.right.map((d, i) => (
            <motion.path
              key={RIGHT[i]!.label}
              ref={(el) => {
                rightPathRefs.current[i] = el;
              }}
              d={d}
              stroke="#5C4EEC"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: LINE_DURATION, delay: lineDelay(i), ease }}
            />
          ))}

          {pulsing &&
            paths.left.map((d, i) => (
              <LineSpark
                key={`spark-left-${LEFT[i]!.label}`}
                path={d}
                index={i}
                startLength={sparkStart.left[i]?.startLength ?? 0}
                totalLength={sparkStart.left[i]?.totalLength ?? 0}
              />
            ))}
          {pulsing &&
            paths.right.map((d, i) => (
              <LineSpark
                key={`spark-right-${RIGHT[i]!.label}`}
                path={d}
                index={i}
                startLength={sparkStart.right[i]?.startLength ?? 0}
                totalLength={sparkStart.right[i]?.totalLength ?? 0}
              />
            ))}
        </svg>
      )}

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6 xl:gap-10">
        <div className="flex flex-col items-start gap-6">
          {LEFT.map((item, i) => (
            <OrbitPill
              key={item.label}
              item={item}
              index={i}
              pulsing={pulsing}
              arrivalFraction={arrivalFractionOf(sparkStart.left[i])}
              pillRef={(el) => {
                leftRefs.current[i] = el;
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center">
          <motion.div
            ref={hubRef}
            className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-white p-2 shadow-soft"
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, ease }}
            onViewportEnter={() => {
              if (reduce) return;
              window.setTimeout(() => setPulsing(true), 1800);
            }}
          >
            <span
              className="absolute -bottom-1 left-1/2 h-8 w-16 -translate-x-1/2 rounded-full bg-accent/50 blur-md"
              aria-hidden
            />
            <span className="relative flex h-full w-full items-center justify-center rounded-full bg-ink">
              <Bot className="h-11 w-11 text-white" strokeWidth={1.5} aria-hidden />
            </span>
          </motion.div>
        </div>

        <div className="flex flex-col items-end gap-6">
          {RIGHT.map((item, i) => (
            <OrbitPill
              key={item.label}
              item={item}
              index={i}
              pulsing={pulsing}
              arrivalFraction={arrivalFractionOf(sparkStart.right[i])}
              pillRef={(el) => {
                rightRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingInsightHub() {
  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl min-w-0">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink shadow-nav">
            Overview
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
            Every conversation,
            <br />
            answered right.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            QuickStart AI combines your content, real-time alerts, and secure infrastructure into
            one embeddable chatbot — built to turn visitors into customers.
          </p>
        </FadeIn>

        <div className="mt-12">
          <InsightDiagram />

          {/* Compact fallback for small screens */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {[...LEFT, ...RIGHT].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-full border border-ink/[0.06] bg-white px-4 py-2.5 shadow-soft"
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink" strokeWidth={2} aria-hidden />
                  <span className="truncate text-sm font-semibold text-ink">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <FadeIn delay={0.1} className="mt-10 flex flex-col items-center gap-4 sm:mt-12">
          <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-mute">
            Connects with the tools you already use
          </p>
          <div className="flex items-center gap-3">
            {[MessageSquare, Webhook, Bell].map((Icon, i) => (
              <span
                key={i}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.06] bg-white text-ink shadow-nav"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
