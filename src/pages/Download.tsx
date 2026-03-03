import { FC, useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/ui/navbar";
import { toast } from "@/components/ui/use-toast";
import {
  Smartphone,
  Clock,
  Bell,
  Rocket,
  CheckCircle,
  Zap,
  Star,
  Shield,
  ArrowRight,
  Play,
  Users,
  MapPin,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────
interface Milestone {
  label: string;
  done: boolean;
  active?: boolean;
}

const milestones: Milestone[] = [
  { label: "Core App", done: true },
  { label: "Payment Gateway", done: true },
  { label: "Captain Onboarding", done: true },
  { label: "QA & Testing", done: false, active: true },
  { label: "App Store Submission", done: false },
];

const features = [
  { icon: Zap, title: "Instant Booking", desc: "Book a bike ride in under 10 seconds" },
  { icon: Shield, title: "Safe Rides", desc: "Verified captains & real-time tracking" },
  { icon: Star, title: "Affordable Fares", desc: "Up to 50% cheaper than alternatives" },
];

const stats = [
  { value: "50K+", label: "Happy Riders" },
  { value: "10+", label: "Cities" },
  { value: "4.8★", label: "App Rating" },
  { value: "<2min", label: "Avg Response" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants (unified with Hero)
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
const DownloadStyles = () => (
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

    /* ----- Progress bar shine (used only here) ----- */
    @keyframes progress-shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }
    .progress-shine {
      animation: progress-shine 2.2s linear infinite;
    }

    /* ----- Disable animations for reduced motion ----- */
    @media (prefers-reduced-motion: reduce) {
      .pulse-blob,
      .cta-shimmer,
      .progress-shine {
        animation: none !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components (reused from previous refactors)
// ─────────────────────────────────────────────────────────────────────────────

/** Pulse background – exact copy from Hero */
const PulseBackground: FC = () => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  const PULSE_CONFIG = [
    { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, opacity: 0.30 },
    { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, opacity: 0.22 },
    { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, opacity: 0.28 },
    { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, opacity: 0.20 },
    { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, opacity: 0.25 },
    { x: 12, y: 88, size: 160, delay: 1.0, dur: 4.5, opacity: 0.18 },
    { x: 60, y: 50, size: 300, delay: 2.7, dur: 3.2, opacity: 0.22 },
    { x: 40, y: 35, size: 120, delay: 0.5, dur: 4.8, opacity: 0.28 },
  ];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {PULSE_CONFIG.map((p, i) => (
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
              rgba(251, 191, 36, ${p.opacity}) 0%,
              rgba(245, 158, 11, ${p.opacity * 0.5}) 42%,
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

/** Stats badge – exactly the same as in Features/HowItWorks */
const StatsBadgeCard: FC<{ value: string; label: string; index: number }> = ({
  value,
  label,
  index,
}) => {
  // Choose icon based on label for variety
  const Icon = label.includes("Riders")
    ? Users
    : label.includes("Cities")
      ? MapPin
      : label.includes("Rating")
        ? Star
        : Clock;

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

/** Feature card (small, used in "What's Coming") */
const FeatureCard: FC<{ feature: typeof features[0]; index: number }> = ({ feature, index }) => {
  const Icon = feature.icon;
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
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-md">
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="font-bold text-gray-900 mb-1 font-syne">{feature.title}</h3>
      <p className="text-sm text-gray-500 font-dmsans">{feature.desc}</p>
    </motion.div>
  );
};

/** Milestone row – custom but styled consistently */
const MilestoneRow: FC<Milestone & { index: number }> = ({ label, done, active, index }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${active
          ? "border-orange-300 bg-orange-50/50"
          : done
            ? "border-green-300 bg-green-50/30"
            : "border-amber-200/40 bg-white/50"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active
            ? "bg-orange-100 text-orange-600"
            : done
              ? "bg-green-100 text-green-600"
              : "bg-amber-100/50 text-gray-400"
          }`}
      >
        {done ? (
          <CheckCircle size={16} />
        ) : active ? (
          <span className={`w-2.5 h-2.5 rounded-full bg-orange-500 ${!prefersReducedMotion ? "animate-pulse" : ""}`} />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        )}
      </div>
      <p className={`flex-1 text-sm font-medium ${done ? "text-gray-900" : active ? "text-orange-800" : "text-gray-400"}`}>
        {label}
      </p>
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full ${active
            ? "bg-orange-100 text-orange-700"
            : done
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
      >
        {done ? "Done" : active ? "In Progress" : "Pending"}
      </span>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Download: FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProgress(90), 400);
    return () => clearTimeout(t);
  }, []);

  const handleNotify = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support notifications.",
        variant: "destructive",
      });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setIsSubscribed(true);
      new Notification("Xpool App Update", {
        body: "You'll be notified as soon as the app goes live!",
      });
      toast({
        title: "You're on the list! 🎉",
        description: "We'll notify you the moment Xpool goes live.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Enable notifications in your browser to get launch alerts.",
        variant: "destructive",
      });
    }
  }, []);

  return (
    <>
      <DownloadStyles />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-black focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-50/90 to-white relative isolate">
        <Navbar />

        {/* Ambient layers */}
        <PulseBackground />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
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
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="text-center mb-12">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-6">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                Currently in Final QA Testing
              </span>
            </div>

            {/* Icon with ping */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xl">
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                {!prefersReducedMotion && (
                  <span className="absolute inset-0 rounded-3xl border-2 border-amber-400/50 animate-ping" />
                )}
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight tracking-tight font-syne">
              Xpool App is{" "}
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Almost Here
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed font-dmsans">
              “India’s fastest taxi pooling app is coming—be first when we launch.”
            </p>

            {/* Progress bar */}
            <div className="mb-8 text-left max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2.5 text-sm">
                <span className="text-gray-500 font-medium font-dmsans">Development Progress</span>
                <span className="font-black text-gray-900 text-base tabular-nums font-syne">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden border border-amber-200/60 bg-amber-100/80">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #ef4444, #f97316, #facc15)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {!prefersReducedMotion && (
                    <span className="progress-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  )}
                </motion.div>
              </div>
              <p className="mt-2 text-xs text-gray-400 text-right font-dmsans">
                Estimated launch in ~14 days
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <button
                onClick={handleNotify}
                disabled={isSubscribed}
                className="cta-shimmer px-8 py-4 rounded-2xl text-base font-bold inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle size={18} />
                    You're on the list!
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    Notify Me at Launch
                  </>
                )}
              </button>

              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-ghost-light px-8 py-4 rounded-2xl text-base font-semibold inline-flex items-center justify-center gap-2"
              >
                <Play size={16} />
                See Features
              </button>
            </div>

            {isSubscribed && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-sm text-green-600 font-semibold flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={16} />
                Notifications enabled — we'll ping you instantly!
              </motion.p>
            )}

            {/* Stats badges */}
            <div className="flex flex-wrap justify-center gap-4">
              {stats.map((stat, idx) => (
                <StatsBadgeCard key={stat.label} value={stat.value} label={stat.label} index={idx} />
              ))}
            </div>
          </motion.div>

          {/* ── Status cards (simplified, no motion needed) ── */}
          <motion.div
            variants={!prefersReducedMotion ? fadeUp : {}}
            className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto my-16"
          >
            <StatusCard icon={<Smartphone size={20} />} title="Mobile App" subtitle="Nearly Complete" />
            <StatusCard icon={<Clock size={20} />} title="QA Testing" subtitle="In Progress" />
            <StatusCard icon={<Bell size={20} />} title="Alerts" subtitle="Push Notify" />
          </motion.div>

          {/* ── Milestones section ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 font-syne">
                Launch Milestones
              </h2>
              <p className="text-sm text-gray-500 font-dmsans">
                Here's where we are on the road to launch
              </p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {milestones.map((m, idx) => (
                <MilestoneRow key={m.label} {...m} index={idx} />
              ))}
            </div>
          </motion.div>

          {/* ── Features section ── */}
          <motion.div
            id="features"
            variants={!prefersReducedMotion ? fadeUp : {}}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 font-syne">
                What's Coming
              </h2>
              <p className="text-sm text-gray-500 font-dmsans">
                Features built to make every ride better
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
              {features.map((feature, idx) => (
                <FeatureCard key={feature.title} feature={feature} index={idx} />
              ))}
            </div>
          </motion.div>

          {/* ── Final CTA ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}}>
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-12 text-center overflow-hidden">
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
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 leading-tight font-syne">
                  Be the First to Ride with Xpool
                </h2>
                <p className="text-white/80 mb-8 text-sm sm:text-base max-w-md mx-auto font-dmsans">
                  Enable notifications and get instant access the moment the app launches on the
                  Play Store & App Store.
                </p>

                <button
                  onClick={handleNotify}
                  disabled={isSubscribed}
                  className="inline-flex items-center gap-2 bg-white text-amber-800 font-bold px-8 py-4 rounded-2xl text-sm sm:text-base hover:bg-white/95 active:scale-95 transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle size={18} className="text-green-500" />
                      You're Subscribed!
                    </>
                  ) : (
                    <>
                      <Bell size={18} />
                      Get Launch Alert
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="mt-4 text-xs text-white/40 font-dmsans">
                  No spam. Just one ping when we go live.
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

export default Download;

// ─────────────────────────────────────────────────────────────────────────────
// Simple StatusCard (no motion needed)
// ─────────────────────────────────────────────────────────────────────────────
const StatusCard: FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="bg-white/70 backdrop-blur-sm border border-amber-200/50 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center mx-auto mb-2 text-amber-600">
      {icon}
    </div>
    <p className="font-black text-gray-900 text-xs sm:text-sm font-syne">{title}</p>
    <p className="text-gray-400 text-xs mt-0.5 hidden sm:block font-dmsans">{subtitle}</p>
  </div>
);