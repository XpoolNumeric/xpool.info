import { FC, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Shield,
  CreditCard,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Phone,
  Bike,
  Sparkles,
  Download,
  ArrowRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const steps: Step[] = [
  {
    number: "1",
    title: "Book Your Ride",
    description:
      "Open the Xpool app or website. Enter your pickup and drop location. Instantly view fare estimate and available vehicle options.",
    icon: MapPin,
  },
  {
    number: "2",
    title: "Get Matched with a Captain",
    description:
      "Our system finds the nearest available driver. View their name, photo, bike number, and rating. Track their real-time location until pickup.",
    icon: Users,
  },
  {
    number: "3",
    title: "Enjoy a Safe & Affordable Ride",
    description:
      "All Captains are KYC-verified with background checks. Helmets provided. Enjoy fast and affordable rides through city traffic.",
    icon: Shield,
  },
  {
    number: "4",
    title: "Seamless Payments",
    description:
      "Pay via UPI, card, wallet, or cash. Receive instant invoices and earn cashback through Xpool offers.",
    icon: CreditCard,
  },
  {
    number: "5",
    title: "Rate & Review",
    description:
      "Rate your Captain after every ride. Your feedback helps us improve safety and service quality.",
    icon: Star,
  },
];

const benefits: Benefit[] = [
  {
    icon: Clock,
    title: "Fast Pickups",
    description: "Pickup in under 5 minutes — no waiting around.",
  },
  {
    icon: DollarSign,
    title: "Affordable Fares",
    description: "Cheaper than cabs & autos for every commute.",
  },
  {
    icon: Shield,
    title: "Verified Captains",
    description: "Every captain is KYC-checked and background-verified.",
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Our team is always available to help you.",
  },
];

const stats = [
  { value: "50K+", label: "Happy Riders" },
  { value: "5 min", label: "Avg Pickup" },
  { value: "30+", label: "Cities" },
  { value: "4.8★", label: "App Rating" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
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
    transition: {
      duration: 0.5,
      delay: 0.6 + i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Global Styles (extending HeroStyles)
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorksStyles = () => (
  <style>{`
    /* ----- Reuse Hero's variables and animations ----- */
    :root {
      --color-amber-50: #fffbeb;
      --color-amber-100: #fef3c7;
      --color-amber-200: #fde68a;
      --color-amber-300: #fcd34d;
      --color-amber-400: #fbbf24;
      --color-amber-500: #f59e0b;
      --color-amber-600: #d97706;
      --color-amber-700: #b45309;
      --color-amber-800: #92400e;
      --color-amber-900: #78350f;
      --color-gray-50: #f9fafb;
      --color-gray-100: #f3f4f6;
      --color-gray-200: #e5e7eb;
      --color-gray-300: #d1d5db;
      --color-gray-400: #9ca3af;
      --color-gray-500: #6b7280;
      --color-gray-600: #4b5563;
      --color-gray-700: #374151;
      --color-gray-800: #1f2937;
      --color-gray-900: #111827;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
      --blur-md: blur(12px);
      --transition-base: 0.2s ease-in-out;
    }

    /* ----- Pulse animation (same as Hero) ----- */
    @keyframes pulse-fade {
      0%, 100% { opacity: 0; }
      50%      { opacity: 1; }
    }
    .pulse-blob {
      animation: pulse-fade ease-in-out infinite;
      will-change: opacity;
    }

    /* ----- CTA shimmer (identical) ----- */
    @keyframes shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    .cta-shimmer {
      background: linear-gradient(
        110deg,
        var(--color-amber-500) 0%,
        var(--color-amber-400) 30%,
        var(--color-amber-200) 50%,
        var(--color-amber-400) 70%,
        var(--color-amber-500) 100%
      );
      background-size: 200% auto;
      animation: shimmer 3s linear infinite;
      color: #1a0800 !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 24px rgba(245, 158, 11, 0.4),
                  0 1px 0 rgba(255, 255, 255, 0.35) inset;
      transition: filter var(--transition-base), box-shadow var(--transition-base);
    }
    .cta-shimmer:hover {
      filter: brightness(1.07);
      box-shadow: 0 8px 36px rgba(245, 158, 11, 0.55),
                  0 1px 0 rgba(255, 255, 255, 0.35) inset;
    }

    /* ----- Ghost button (light background) ----- */
    .btn-ghost-light {
      border: 1.5px solid rgba(180, 83, 9, 0.22) !important;
      color: var(--color-amber-800) !important;
      background: rgba(251, 191, 36, 0.07) !important;
      font-weight: 600 !important;
      transition: background var(--transition-base),
                  border-color var(--transition-base),
                  color var(--transition-base) !important;
    }
    .btn-ghost-light:hover {
      background: rgba(251, 191, 36, 0.16) !important;
      border-color: rgba(180, 83, 9, 0.4) !important;
      color: var(--color-amber-900) !important;
    }

    /* ----- Step connector line ----- */
    .step-connector {
      width: 2px;
      height: 48px;
      margin: 8px auto;
      background: linear-gradient(to bottom, rgba(245,158,11,0.4), transparent);
    }

    /* ----- Disable animations for reduced motion ----- */
    @media (prefers-reduced-motion: reduce) {
      .pulse-blob,
      .cta-shimmer,
      .step-connector {
        animation: none !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components
// ─────────────────────────────────────────────────────────────────────────────

/** Soft amber glow blobs (copied from Hero) */
const PulseBackground: FC = () => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  const BLOBS = [
    { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, o: 0.30 },
    { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, o: 0.22 },
    { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, o: 0.28 },
    { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, o: 0.20 },
    { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, o: 0.25 },
    { x: 12, y: 88, size: 160, delay: 1.0, dur: 4.5, o: 0.18 },
    { x: 60, y: 50, size: 300, delay: 2.7, dur: 3.2, o: 0.22 },
    { x: 40, y: 35, size: 120, delay: 0.5, dur: 4.8, o: 0.28 },
  ];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {BLOBS.map((p, i) => (
        <div
          key={i}
          className="pulse-blob"
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle,
              rgba(251, 191, 36, ${p.o}) 0%,
              rgba(245, 158, 11, ${p.o * 0.5}) 42%,
              transparent 70%)`,
            filter: "blur(44px)",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            willChange: "opacity",
          }}
        />
      ))}
    </div>
  );
};

/** Statistics badge – identical to Features' StatsBadgeCard */
const StatsBadgeCard: FC<{ value: string; label: string; index: number }> = ({
  value,
  label,
  index,
}) => {
  // Use a generic icon based on label for visual variety, but we can keep it simple
  const Icon = label.includes("Riders")
    ? Users
    : label.includes("Pickup")
      ? Clock
      : label.includes("Cities")
        ? MapPin
        : Star;

  return (
    <motion.div
      custom={index}
      variants={badgeVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="flex flex-col items-center justify-center gap-1.5 px-6 py-5 rounded-2xl border border-amber-200/60 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow"
      style={{ minWidth: 120 }}
      role="figure"
      aria-label={`${value} ${label}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={16} strokeWidth={2.5} className="text-amber-500" aria-hidden="true" />
        <span className="text-2xl font-black leading-none text-gray-900 font-syne">{value}</span>
      </div>
      <span className="text-[10.5px] font-semibold text-gray-500 tracking-wider uppercase whitespace-nowrap font-dmsans">
        {label}
      </span>
    </motion.div>
  );
};

/** Step card with alternating layout and animated visual orb */
const StepCard: FC<{ step: Step; index: number; total: number }> = ({
  step,
  index,
  total,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isEven = index % 2 === 0;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: isEven ? -30 : 30 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.15 },
        },
      }}
      className="w-full max-w-4xl mx-auto"
    >
      <div
        className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"
          } items-center gap-8 md:gap-12`}
      >
        {/* Text card */}
        <div className="flex-1">
          <motion.div
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="relative bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all"
          >
            {/* Large ghost number */}
            <span
              className="absolute bottom-3 right-4 text-7xl font-black text-amber-100 select-none"
              aria-hidden="true"
            >
              {step.number.padStart(2, "0")}
            </span>

            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-5 shadow-lg ${index === 0 ? "animate-pulse" : ""
                }`}
            >
              <step.icon size={32} className="text-white" strokeWidth={1.8} />
            </div>

            {/* Step label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/60 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Step {step.number}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 font-syne">{step.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-dmsans">{step.description}</p>
          </motion.div>
        </div>

        {/* Visual orb */}
        <div className="flex-1 flex justify-center items-center">
          <div
            className={`relative w-48 h-48 ${!prefersReducedMotion ? "animate-float" : ""
              }`}
            style={{ animation: "float 4s ease-in-out infinite" }}
          >
            {/* Dashed ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40"
              style={
                !prefersReducedMotion
                  ? { animation: "spin 20s linear infinite" }
                  : {}
              }
            />
            {/* Solid ring */}
            <div className="absolute inset-4 rounded-full border border-amber-200/60 bg-amber-50/50 backdrop-blur-sm" />
            {/* Core icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl">
                <step.icon size={36} className="text-white" />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-syne shadow-lg">
              {step.number}
            </div>
          </div>
        </div>
      </div>

      {/* Connector (except after last step) */}
      {index < total - 1 && <div className="step-connector" />}
    </motion.div>
  );
};

/** Benefit card (smaller, used in Why Xpool section) */
const BenefitCard: FC<{ benefit: Benefit; index: number }> = ({ benefit, index }) => {
  const Icon = benefit.icon;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle size={16} className="text-green-500" />
        <h4 className="font-bold text-gray-900 font-syne">{benefit.title}</h4>
      </div>
      <p className="text-sm text-gray-500 font-dmsans">{benefit.description}</p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorks: FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // Custom keyframes for float and spin (inlined in style)
  useEffect(() => {
    if (!prefersReducedMotion) {
      const style = document.createElement("style");
      style.innerHTML = `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [prefersReducedMotion]);

  return (
    <>
      <HowItWorksStyles />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-black focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-50/90 to-white relative isolate">
        <Navbar />

        {/* Ambient blobs */}
        <PulseBackground />

        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Center vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255, 251, 235, 0) 0%, rgba(255, 251, 235, 0.7) 100%)",
          }}
        />

        {/* Main content */}
        <motion.main
          id="main-content"
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28"
          variants={!prefersReducedMotion ? containerVariants : {}}
          initial="hidden"
          animate="visible"
        >
          {/* ── Hero section ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="text-center mb-16">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-6">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                Simple · Safe · Affordable
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-5 font-syne">
              How{" "}
              <span
                className="text-amber-500"
                style={{ textShadow: "0 2px 0 rgba(160,80,0,0.15)" }}
              >
                Xpool
              </span>{" "}
              Works
            </h1>

            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-dmsans">
              Booking a ride with Xpool is quick, simple, and reliable — perfect for daily
              commutes, college, and city travel.
            </p>
          </motion.div>

          {/* Stats badges */}
          <motion.div
            variants={!prefersReducedMotion ? containerVariants : {}}
            className="flex flex-wrap justify-center gap-4 mb-20"
          >
            {stats.map((stat, idx) => (
              <StatsBadgeCard key={stat.label} value={stat.value} label={stat.label} index={idx} />
            ))}
          </motion.div>

          {/* Steps section */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 font-syne">
                Your Ride in{" "}
                <span className="text-amber-500">5 Simple Steps</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto font-dmsans">
                From booking to rating — the complete Xpool experience
              </p>
            </div>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <StepCard key={step.number} step={step} index={idx} total={steps.length} />
              ))}
            </div>
          </motion.div>

          {/* Why Xpool section */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-4">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                  Why Xpool?
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 font-syne">
                Built for your everyday commute
              </h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto font-dmsans">
                Everything you need for a stress-free daily ride
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((benefit, idx) => (
                <BenefitCard key={idx} benefit={benefit} index={idx} />
              ))}
            </div>
          </motion.div>

          {/* CTA section (styled after Hero's buttons) */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}}>
            <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-12 text-center overflow-hidden">
              {/* Background rings */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/30" />
              </div>

              {/* Dot grid overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative z-10">
                {/* Online badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white mb-6">
                  <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    App available now
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 font-syne">
                  Ready to Experience{" "}
                  <span className="bg-white/20 px-3 py-1 rounded-lg">Xpool?</span>
                </h2>

                <p className="text-white/80 text-base max-w-lg mx-auto mb-8 font-dmsans">
                  Download the app today and enjoy fast, affordable, and safe rides across the
                  city.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-amber-700 hover:bg-amber-50 px-8 py-6 rounded-xl gap-2 font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <a href="#">
                      <Download size={18} />
                      Download for Android
                      <ArrowRight size={16} />
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/40 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 px-8 py-6 rounded-xl gap-2 font-semibold"
                  >
                    <a href="#">
                      <Download size={18} />
                      Download for iOS
                    </a>
                  </Button>
                </div>

                <p className="text-white/40 text-xs mt-6 font-dmsans">
                  Available on Play Store & App Store · Free to download
                </p>
              </div>
            </div>
          </motion.div>
        </motion.main>

        {/* Scroll indicator (optional) */}
        {!prefersReducedMotion && (
          <div
            className="scroll-bounce absolute bottom-8 left-1/2 flex flex-col items-center gap-1 text-amber-400/60 pointer-events-none"
            aria-hidden="true"
            style={{ zIndex: 10 }}
          >
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-amber-400/50" />
            <ArrowRight size={16} className="rotate-90" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </>
  );
};

export default HowItWorks;