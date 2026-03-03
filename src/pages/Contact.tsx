import { FC } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Users,
  CheckCircle,
  Headphones,
  HelpCircle,
  ArrowRight,
  Zap,
  Star,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────
interface ContactMethod {
  title: string;
  description: string;
  icon: React.ElementType;
  value: string;
  label: string;
  href: string;
  badge: string;
  from: string;
  to: string;
  badgeBg: string;
  badgeColor: string;
  glow: string;
}

const contactMethods: ContactMethod[] = [
  {
    title: "Customer Support",
    description:
      "Need help with a ride, payment, or app issue? Our support team is available 24/7 to assist you.",
    icon: Phone,
    value: "+91 7904790007",
    label: "Call Now",
    href: "tel:+917904790007",
    badge: "24/7 Live",
    from: "#f59e0b",
    to: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.10)",
    badgeColor: "#92400e",
    glow: "rgba(245,158,11,0.28)",
  },
  {
    title: "Email Support",
    description:
      "For partnerships, business inquiries, or detailed support requests, drop us an email.",
    icon: Mail,
    value: "support@xpool.app",
    label: "Send Email",
    href: "mailto:support@xpool.app",
    badge: "Quick Reply",
    from: "#f97316",
    to: "#fb923c",
    badgeBg: "rgba(249,115,22,0.10)",
    badgeColor: "#9a3412",
    glow: "rgba(249,115,22,0.24)",
  },
  {
    title: "Our Location",
    description:
      "We operate across major cities in India, providing fast and affordable bike taxi services.",
    icon: MapPin,
    value: "Chennai, India",
    label: "View Map",
    href: "#",
    badge: "Pan India",
    from: "#10b981",
    to: "#34d399",
    badgeBg: "rgba(16,185,129,0.10)",
    badgeColor: "#065f46",
    glow: "rgba(16,185,129,0.22)",
  },
];

const reasons = [
  {
    icon: Clock,
    title: "24/7 Support",
    text: "Round-the-clock assistance whenever you need it — day or night.",
  },
  {
    icon: Shield,
    title: "Safe & Verified",
    text: "Every captain is background-checked and verified for your safety.",
  },
  {
    icon: Users,
    title: "Trusted Community",
    text: "Join thousands of happy riders across major Indian cities.",
  },
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
const ContactStyles = () => (
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

    /* ----- Disable animations for reduced motion ----- */
    @media (prefers-reduced-motion: reduce) {
      .pulse-blob,
      .cta-shimmer {
        animation: none !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components (reused)
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

/** Stats badge – exactly the same as in Features/HowItWorks/Download */
const StatsBadgeCard: FC<{ value: string; label: string; index: number }> = ({
  value,
  label,
  index,
}) => {
  // Choose icon based on label for variety
  const Icon =
    label.includes("Riders")
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Contact: FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <ContactStyles />

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
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="text-center mb-16">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-6">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                Support team is online
              </span>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xl">
                <Headphones className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-5 leading-tight tracking-tight font-syne">
              We're Here to{" "}
              <span className="relative inline-block bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Help
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6 Q100 2 198 6"
                    stroke="rgba(245,158,11,0.5)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10 font-dmsans">
              Reach out for support, feedback, or partnerships. The Xpool team is always just a tap
              away.
            </p>

            {/* Stats badges */}
            <div className="flex flex-wrap justify-center gap-4">
              {stats.map((stat, idx) => (
                <StatsBadgeCard
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  index={idx}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Contact cards ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 font-syne">
                Get in Touch
              </h2>
              <p className="text-gray-500 mt-2 text-sm sm:text-base font-dmsans">
                Choose the channel that works best for you
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {contactMethods.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, delay: 0.2 + index * 0.1 },
                      },
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 overflow-hidden hover:shadow-xl transition-all"
                  >
                    {/* Top gradient bar */}
                    <div
                      className="h-1 w-full"
                      style={{ background: `linear-gradient(90deg, ${item.from}, ${item.to})` }}
                    />

                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                            boxShadow: `0 8px 20px ${item.glow}`,
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: item.badgeBg, color: item.badgeColor }}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 font-syne">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5 font-dmsans">
                        {item.description}
                      </p>

                      {/* Value pill */}
                      <div className="rounded-xl px-3 py-2.5 mb-5 border border-amber-100/80 bg-amber-50/90">
                        <p className="font-bold text-gray-800 text-sm truncate font-dmsans">
                          {item.value}
                        </p>
                      </div>

                      <a
                        href={item.href}
                        className="flex items-center justify-center gap-2 w-full text-white text-sm font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                          boxShadow: `0 4px 14px ${item.glow}`,
                        }}
                      >
                        {item.label}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Why Reach Out ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl mb-4 bg-amber-100/50 border border-amber-200/60">
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 font-syne">
                Why Reach Out to Xpool?
              </h2>
              <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg mx-auto font-dmsans">
                We don't just answer questions — we solve problems and make your ride experience
                smooth.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <motion.div
                    key={reason.title}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, delay: 0.3 + index * 0.1 },
                      },
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white/80 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-amber-200/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-200/50 bg-amber-50/80">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <h4 className="text-base font-black text-gray-900 mb-1.5 font-syne">
                      {reason.title}
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-dmsans">
                      {reason.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── FAQ Teaser ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="mb-20">
            <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 max-w-3xl mx-auto">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-100/50 border border-amber-200/60">
                <Star className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 font-syne">
                  Looking for quick answers?
                </h3>
                <p className="text-sm text-gray-500 font-dmsans">
                  Check our Help Center for FAQs on rides, payments, safety, and more — available
                  in the app.
                </p>
              </div>
              <a
                href="#"
                className="flex-shrink-0 inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 whitespace-nowrap hover:opacity-90 cta-shimmer"
              >
                <Zap className="w-4 h-4" />
                Help Center
              </a>
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
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white/90 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Available right now
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight font-syne">
                  Need Immediate Help?
                </h2>

                <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto font-dmsans">
                  Call or email us anytime. Our support team is always ready to help you ride
                  smoothly with Xpool.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <a
                    href="tel:+917904790007"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-amber-800 font-bold px-7 py-4 rounded-2xl text-sm sm:text-base hover:bg-white/95 active:scale-95 transition-all shadow-xl"
                  >
                    <Phone className="w-5 h-5" />
                    Call Support
                  </a>
                  <a
                    href="mailto:support@xpool.app"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-ghost-light px-7 py-4 rounded-2xl text-sm sm:text-base font-semibold"
                  >
                    <Mail className="w-5 h-5" />
                    Email Us
                  </a>
                </div>

                <p className="mt-6 text-xs text-white/40 font-dmsans">
                  Average response time: under 2 minutes
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

export default Contact;