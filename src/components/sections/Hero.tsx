import { FC, useCallback, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, MapPin, ChevronDown } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import xpoolLogo from "@/assets/xpool-logo.jpeg";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PulsePoint {
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
  opacity: number;
}

interface TrustBadge {
  icon: typeof Shield;
  label: string;
  value: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Warm amber blobs tuned for the light cream background
const PULSE_CONFIG: PulsePoint[] = [
  { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, opacity: 0.30 },
  { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, opacity: 0.22 },
  { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, opacity: 0.28 },
  { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, opacity: 0.20 },
  { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, opacity: 0.25 },
  { x: 12, y: 88, size: 160, delay: 1.0, dur: 4.5, opacity: 0.18 },
  { x: 60, y: 50, size: 300, delay: 2.7, dur: 3.2, opacity: 0.22 },
  { x: 40, y: 35, size: 120, delay: 0.5, dur: 4.8, opacity: 0.28 },
  { x: 5, y: 50, size: 190, delay: 3.2, dur: 4.2, opacity: 0.20 },
  { x: 80, y: 10, size: 130, delay: 0.9, dur: 5.2, opacity: 0.22 },
];

const TRUST_BADGES: TrustBadge[] = [
  { icon: Shield, label: "Verified Drivers", value: "100%" },
  { icon: Zap, label: "Avg. Pickup Time", value: "4 min" },
  { icon: MapPin, label: "Cities Covered", value: "30+" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const badgeVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Injected Styles
// ─────────────────────────────────────────────────────────────────────────────
const HeroStyles = () => (
  <style>{`
    /* ── Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

    /* ── Pulse blob fade ── */
    @keyframes xp-pulse-fade {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }
    .xp-pulse { animation: xp-pulse-fade ease-in-out infinite; }

    /* ── CTA shimmer ── */
    @keyframes xp-shimmer {
      0%   { background-position:  200% center; }
      100% { background-position: -200% center; }
    }
    .xp-cta {
      background: linear-gradient(
        110deg,
        #f59e0b 0%,
        #fbbf24 30%,
        #fde68a 50%,
        #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: xp-shimmer 3s linear infinite;
      color: #1a0800 !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 24px rgba(245,158,11,0.40), 0 1px 0 rgba(255,255,255,0.35) inset;
      transition: filter 0.2s, box-shadow 0.2s;
    }
    .xp-cta:hover {
      filter: brightness(1.07);
      box-shadow: 0 8px 36px rgba(245,158,11,0.55), 0 1px 0 rgba(255,255,255,0.35) inset;
    }

    /* ── Ghost CTA (light bg friendly) ── */
    .xp-ghost {
      border: 1.5px solid rgba(120,80,0,0.22) !important;
      color: #7c4a00 !important;
      background: rgba(251,191,36,0.07) !important;
      font-weight: 600 !important;
      transition: background 0.2s, border-color 0.2s, color 0.2s !important;
    }
    .xp-ghost:hover {
      background: rgba(251,191,36,0.16) !important;
      border-color: rgba(120,80,0,0.40) !important;
      color: #5a3200 !important;
    }

    /* ── Logo ring pulse ── */
    @keyframes xp-ring {
      0%, 100% { box-shadow: 0 0 0 0   rgba(245,158,11,0.50); }
      50%       { box-shadow: 0 0 0 10px rgba(245,158,11,0);   }
    }
    .xp-logo-ring { animation: xp-ring 2.8s ease-in-out infinite; }

    /* ── Badge border breathe ── */
    @keyframes xp-badge-border {
      0%, 100% { border-color: rgba(245,158,11,0.18); }
      50%       { border-color: rgba(245,158,11,0.50); }
    }
    .xp-badge { animation: xp-badge-border 3s ease-in-out infinite; }

    /* ── Eyebrow dot blink ── */
    @keyframes xp-blink {
      0%, 100% { opacity: 1;   }
      50%       { opacity: 0.3; }
    }
    .xp-blink { animation: xp-blink 1.6s ease-in-out infinite; }

    /* ── Scroll bounce ── */
    @keyframes xp-bounce {
      0%, 100% { transform: translateX(-50%) translateY(0);   }
      50%       { transform: translateX(-50%) translateY(7px); }
    }
    .xp-scroll-indicator { animation: xp-bounce 2s ease-in-out infinite; }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Soft amber glow blobs — tuned for light/cream background */
const PulseBackground = memo(() => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {PULSE_CONFIG.map((p, i) => (
      <div
        key={i}
        className="xp-pulse"
        style={{
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle,
            rgba(251,191,36,${p.opacity}) 0%,
            rgba(245,158,11,${p.opacity * 0.5}) 42%,
            transparent 70%)`,
          filter: "blur(44px)",
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
        }}
      />
    ))}
  </div>
));
PulseBackground.displayName = "PulseBackground";

/** Magnetic 3D logo with spring-physics tilt */
const MagneticLogo: FC<{ src: string }> = ({ src }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 180, damping: 22 });
  const rotateX = useTransform(springY, [-30, 30], [10, -10]);
  const rotateY = useTransform(springX, [-30, 30], [-10, 10]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set(e.clientX - r.left - r.width / 2);
    rawY.set(e.clientY - r.top - r.height / 2);
  }, [rawX, rawY]);

  const handleLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ perspective: 500, flexShrink: 0 }}
    >
      <motion.img
        src={src}
        alt="Xpool logo"
        className="xp-logo-ring h-14 w-14 sm:h-16 sm:w-16 rounded-2xl shadow-lg object-cover select-none block"
        style={{ rotateX, rotateY }}
        loading="eager"
        draggable={false}
      />
    </div>
  );
};

/** Individual trust / stat badge card */
const TrustBadgeCard = memo(({ badge, index }: { badge: TrustBadge; index: number }) => {
  const Icon = badge.icon;
  return (
    <motion.div
      custom={index}
      variants={badgeVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="xp-badge flex flex-col items-center justify-center gap-1.5 px-7 py-4 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm"
      style={{ minWidth: 130 }}
      role="figure"
      aria-label={`${badge.value} ${badge.label}`}
    >
      {/* Value row */}
      <div className="flex items-center gap-1.5">
        <Icon
          size={15}
          strokeWidth={2.5}
          className="text-amber-500"
          aria-hidden="true"
        />
        <span
          className="text-2xl font-black leading-none text-gray-900"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {badge.value}
        </span>
      </div>
      {/* Label — was clipped before (no min-width set) */}
      <span
        className="text-[10.5px] font-semibold text-gray-400 tracking-wider uppercase whitespace-nowrap"
        style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em" }}
      >
        {badge.label}
      </span>
    </motion.div>
  );
});
TrustBadgeCard.displayName = "TrustBadgeCard";

// ─────────────────────────────────────────────────────────────────────────────
// Main Hero Component
// ─────────────────────────────────────────────────────────────────────────────
const Hero: FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const scrollToBooking = useCallback(() => {
    document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToHow = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <HeroStyles />

      {/* Accessibility: skip link */}
      <a
        href="#booking-section"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-black focus:font-bold focus:shadow-lg"
      >
        Skip to booking
      </a>

      <section
        id="hero"
        aria-label="Hero — Book a ride with Xpool"
        className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{
          // Warm cream — matches the existing site theme seen in screenshot
          background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
          isolation: "isolate",
        }}
      >
        {/* ── Layer 0: ambient amber blobs ── */}
        {!prefersReducedMotion && <PulseBackground />}

        {/* ── Layer 1: subtle dot-grid texture ── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundImage:
              "radial-gradient(rgba(245,158,11,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* ── Layer 2: center radial highlight ── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,251,235,0) 0%, rgba(255,251,235,0.65) 100%)",
          }}
        />

        {/* ── Hero content ── */}
        <motion.div
          className="relative flex flex-col items-center text-center w-full max-w-2xl mx-auto py-20"
          style={{ zIndex: 10 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* 1. Wordmark */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-3 mb-7"
          >
            <MagneticLogo src={xpoolLogo} />
            <h1
              className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-gray-900"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <span className="text-amber-500">X</span>pool
            </h1>
          </motion.div>

          {/* 2. Eyebrow pill */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full border border-amber-300/70 bg-amber-50 text-amber-700"
          >
            <span
              className="xp-blink h-2 w-2 rounded-full bg-amber-500 flex-shrink-0"
              aria-hidden="true"
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Now live in 30+ cities
            </span>
          </motion.div>

          {/* 3. Headline */}
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.04] tracking-tight text-gray-900 mb-5"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Ride Smart.
            <br />
            <span
              className="text-amber-500"
              style={{
                // Light-bg appropriate shadow — no heavy glow that looked broken
                textShadow: "0 2px 0 rgba(160,80,0,0.15), 0 0 50px rgba(245,158,11,0.20)",
              }}
            >
              Ride Safe.
            </span>
          </motion.h2>

          {/* 4. Sub-copy — FIX: was invisible on dark-mode assumption; now dark on light */}
          <motion.p
            variants={fadeUp}
            className="text-gray-500 text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Seamless rides with real-time tracking, verified drivers, and
            transparent pricing — every single time.
          </motion.p>

          {/* 5. CTA buttons — FIX: ghost button was missing entirely */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 w-full"
          >
            {/* Primary */}
            <motion.div
              whileHover={!prefersReducedMotion ? { scale: 1.04 } : undefined}
              whileTap={!prefersReducedMotion ? { scale: 0.97 } : undefined}
            >
              <Button
                onClick={scrollToBooking}
                size="lg"
                className="xp-cta px-9 py-6 text-base rounded-2xl gap-2 font-bold"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                aria-label="Book your ride now"
              >
                Book Your Ride
                <ArrowRight size={18} strokeWidth={2.5} />
              </Button>
            </motion.div>

            {/* Secondary ghost */}
            <motion.div
              whileHover={!prefersReducedMotion ? { scale: 1.04 } : undefined}
              whileTap={!prefersReducedMotion ? { scale: 0.97 } : undefined}
            >
              <Button
                variant="ghost"
                size="lg"
                onClick={scrollToHow}
                className="xp-ghost px-9 py-6 text-base rounded-2xl gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                aria-label="Learn how Xpool works"
              >
                How it works
                <ChevronDown size={16} strokeWidth={2.5} />
              </Button>
            </motion.div>
          </motion.div>

          {/* 6. Trust badges — FIX: labels truncated due to missing minWidth */}
          <div
            className="flex flex-wrap items-stretch justify-center gap-3 w-full"
            role="list"
            aria-label="Platform statistics"
          >
            {TRUST_BADGES.map((badge, i) => (
              <div key={badge.label} role="listitem">
                <TrustBadgeCard badge={badge} index={i} />
              </div>
            ))}
          </div>

        </motion.div>

        {/* ── Scroll indicator ── */}
        {!prefersReducedMotion && (
          <div
            className="xp-scroll-indicator absolute bottom-8 left-1/2 flex flex-col items-center gap-1 text-amber-400/60 pointer-events-none"
            aria-hidden="true"
            style={{ zIndex: 10 }}
          >
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-amber-400/50" />
            <ChevronDown size={16} strokeWidth={1.5} />
          </div>
        )}
      </section>
    </>
  );
};

export default Hero;