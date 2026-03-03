import { FC, memo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  MapPin,
  MessageCircle,
  KeyRound,
  DollarSign,
  CreditCard,
  Shield,
  Clock,
  Star,
  Gift,
  Settings,      // ✅ Added missing Settings import
  ArrowRight,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  accent?: string;
}

interface StatsBadge {
  icon: typeof Shield;
  value: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const features: Feature[] = [
  {
    id: 1,
    title: "Quick Ride Booking",
    description:
      "Book your ride in seconds. Enter pickup and drop locations and get instantly matched with nearby drivers.",
    icon: Smartphone,
    accent: "#FF6B35",
  },
  {
    id: 2,
    title: "Real-Time Location Tracking",
    description:
      "Track your driver's live location from acceptance to destination with precise GPS updates.",
    icon: MapPin,
    accent: "#FF8C42",
  },
  {
    id: 3,
    title: "Seamless Communication",
    description:
      "Chat or call drivers securely within the app—no need to share personal phone numbers.",
    icon: MessageCircle,
    accent: "#FFA552",
  },
  {
    id: 4,
    title: "OTP Ride Verification",
    description:
      "Every ride starts with OTP verification to ensure rider safety and prevent misuse.",
    icon: KeyRound,
    accent: "#FF6B35",
  },
  {
    id: 5,
    title: "Transparent & Affordable Fares",
    description:
      "Real-time fare calculation with zero hidden charges. What you see is what you pay.",
    icon: DollarSign,
    accent: "#FF8C42",
  },
  {
    id: 6,
    title: "Multiple Payment Options",
    description:
      "Pay via UPI, Wallet, Debit/Credit Card, or Cash—whatever suits you best.",
    icon: CreditCard,
    accent: "#FFA552",
  },
  {
    id: 7,
    title: "Driver & Customer Safety",
    description:
      "Verified drivers, SOS support, and strict safety protocols for peace of mind.",
    icon: Shield,
    accent: "#FF6B35",
  },
  {
    id: 8,
    title: "Ride History & Invoices",
    description:
      "Access trip history, download invoices, and manage ride expenses easily.",
    icon: Clock,
    accent: "#FF8C42",
  },
  {
    id: 9,
    title: "Ratings & Reviews",
    description:
      "Rate drivers and provide feedback to improve service quality across the platform.",
    icon: Star,
    accent: "#FFA552",
  },
  {
    id: 10,
    title: "Promotions & Offers",
    description:
      "Get exclusive discounts, referral rewards, and seasonal offers directly in-app.",
    icon: Gift,
    accent: "#FF6B35",
  },
  {
    id: 11,
    title: "Admin Dashboard",
    description:
      "Advanced admin tools for monitoring rides, managing drivers, and maintaining quality.",
    icon: Settings,   // ✅ Now Settings is properly imported
    accent: "#FF8C42",
  },
];

const STATS_BADGES: StatsBadge[] = [
  { icon: Shield, value: "50K+", label: "Active Riders" },
  { icon: Zap, value: "12K+", label: "Verified Drivers" },
  { icon: Clock, value: "99%", label: "Safety Score" },
  { icon: Gift, value: "11", label: "Core Features" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Global Styles (extended)
// ─────────────────────────────────────────────────────────────────────────────
const FeaturesStyles = () => (
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

    /* ----- Blink dot for eyebrow ----- */
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    .blink-dot {
      animation: blink 1.5s ease-in-out infinite;
    }

    /* ----- Scroll bounce indicator ----- */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(4px); }
    }
    .scroll-bounce {
      animation: bounce 2s ease-in-out infinite;
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

    /* ----- Feature card custom styles ----- */
    .feature-card {
      background: white;
      border: 1px solid var(--color-amber-200);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: var(--shadow-md);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .feature-card:hover {
      border-color: var(--color-amber-400);
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
    }

    /* ----- Icon wrap ----- */
    .icon-wrap {
      width: 3rem;
      height: 3rem;
      border-radius: 1rem;
      background: rgba(251, 191, 36, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    /* ----- Disable animations for reduced motion ----- */
    @media (prefers-reduced-motion: reduce) {
      .pulse-blob,
      .cta-shimmer,
      .feature-card:hover,
      .blink-dot,
      .scroll-bounce {
        animation: none !important;
        transform: none !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants (defined outside to prevent recreation)
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components (memoized)
// ─────────────────────────────────────────────────────────────────────────────

/** Soft amber glow blobs (copied from Hero) */
const PulseBackground: FC = () => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  const PULSE_CONFIG = [
    { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, opacity: 0.30 },
    { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, opacity: 0.22 },
    { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, opacity: 0.28 },
    { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, opacity: 0.20 },
    { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, opacity: 0.25 },
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
PulseBackground.displayName = "PulseBackground";

/** Statistics badge – styled exactly like Hero's TrustBadgeCard */
const StatsBadgeCard: FC<{ badge: StatsBadge; index: number }> = memo(
  ({ badge, index }) => {
    const Icon = badge.icon;
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        custom={index}
        variants={{
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
        }}
        initial="hidden"
        animate="visible"
        whileHover={!prefersReducedMotion ? { y: -3, transition: { duration: 0.18 } } : undefined}
        className="flex flex-col items-center justify-center gap-1.5 px-6 py-5 rounded-2xl border border-amber-200/60 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow"
        style={{ minWidth: 130, transform: "translateZ(0)" }}
        role="figure"
        aria-label={`${badge.value} ${badge.label}`}
      >
        <div className="flex items-center gap-1.5">
          <Icon size={16} strokeWidth={2.5} className="text-amber-500" aria-hidden="true" />
          <span className="text-2xl font-black leading-none text-gray-900 font-syne">
            {badge.value}
          </span>
        </div>
        <span className="text-[10.5px] font-semibold text-gray-500 tracking-wider uppercase whitespace-nowrap font-dmsans">
          {badge.label}
        </span>
      </motion.div>
    );
  }
);
StatsBadgeCard.displayName = "StatsBadgeCard";

/** Individual feature card – animated with fadeUp */
const FeatureCard: FC<{ feature: Feature; index: number }> = memo(
  ({ feature, index }) => {
    const Icon = feature.icon;
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] },
          },
        }}
        whileHover={!prefersReducedMotion ? { y: -5, transition: { duration: 0.2 } } : undefined}
        className="feature-card relative"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="icon-wrap">
          <Icon size={24} className="text-amber-600" strokeWidth={1.8} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 font-syne">{feature.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed font-dmsans">{feature.description}</p>

        {/* Optional ghost number */}
        <span
          className="absolute bottom-3 right-4 text-7xl font-black text-amber-100 select-none"
          aria-hidden="true"
        >
          {feature.id.toString().padStart(2, "0")}
        </span>
      </motion.div>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Features: FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <FeaturesStyles />

      {/* Skip link */}
      <a
        href="#features-grid"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-black focus:font-bold focus:shadow-lg"
      >
        Skip to features
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

        {/* Main content wrapped in <main> for accessibility */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div
            variants={!prefersReducedMotion ? containerVariants : {}}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-8"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 blink-dot" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                11 Powerful Capabilities
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-5 font-syne"
            >
              Built for{" "}
              <span className="text-amber-500" style={{ textShadow: "0 2px 0 rgba(160,80,0,0.15)" }}>
                Speed
              </span>{" "}
              <br className="hidden sm:block" />
              <span className="text-amber-500" style={{ textShadow: "0 2px 0 rgba(160,80,0,0.15)" }}>
                & Safety
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="text-gray-500 text-base sm:text-lg max-w-2xl mb-12 leading-relaxed font-dmsans"
            >
              Everything you need for a safe, affordable, and seamless ride-sharing experience —
              engineered for riders and drivers alike.
            </motion.p>

            {/* Stats badges */}
            <motion.div
              variants={!prefersReducedMotion ? containerVariants : {}}
              className="flex flex-wrap justify-center gap-4 mb-20"
            >
              {STATS_BADGES.map((badge, idx) => (
                <StatsBadgeCard key={badge.label} badge={badge} index={idx} />
              ))}
            </motion.div>

            {/* Features grid */}
            <motion.div
              id="features-grid"
              variants={!prefersReducedMotion ? containerVariants : {}}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
            >
              {features.map((feature, idx) => (
                <FeatureCard key={feature.id} feature={feature} index={idx} />
              ))}
            </motion.div>

            {/* CTA Section */}
            <motion.div
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="mt-32 text-center"
            >
              <div className="relative max-w-3xl mx-auto px-4 py-16 rounded-3xl bg-white/70 backdrop-blur-sm border border-amber-200/50 shadow-xl">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 font-syne">
                  Smarter rides <span className="text-amber-500">start here</span>
                </h2>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto font-dmsans">
                  Join thousands who rely on Xpool for safe, reliable, and affordable rides every day.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div
                    whileHover={!prefersReducedMotion ? { scale: 1.04 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.97 } : {}}
                    style={{ transform: "translateZ(0)" }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="cta-shimmer px-9 py-6 text-base rounded-2xl gap-2 font-bold font-dmsans"
                    >
                      <Link to="/download">
                        Download App
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </Link>
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={!prefersReducedMotion ? { scale: 1.04 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.97 } : {}}
                    style={{ transform: "translateZ(0)" }}
                  >
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="btn-ghost-light px-9 py-6 text-base rounded-2xl gap-2 font-dmsans"
                    >
                      <Link to="/contact">Become a Driver</Link>
                    </Button>
                  </motion.div>
                </div>

                {/* Tag strip */}
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {["Free to Download", "OTP Verified", "24/7 Support", "Secure Payments"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-amber-700 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/50"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>

        {/* Scroll indicator (respects reduced motion) */}
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

Features.displayName = "Features";

export default Features;