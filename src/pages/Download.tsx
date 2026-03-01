import { useEffect, useState, memo } from "react";
import Navbar from "@/components/ui/navbar";
import { toast } from "@/components/ui/use-toast";
import { useReducedMotion } from "framer-motion";
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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Background config — lifted directly from Hero
// ─────────────────────────────────────────────────────────────────────────────
interface PulsePoint {
  x: number; y: number; size: number; delay: number; dur: number; opacity: number;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Injected styles
// ─────────────────────────────────────────────────────────────────────────────
const DownloadStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    @keyframes pulse-fade {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }
    .dl-pulse-blob {
      animation: pulse-fade ease-in-out infinite;
      will-change: opacity;
    }
    @keyframes dl-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }
    .dl-shimmer { animation: dl-shimmer 2.2s linear infinite; }

    @keyframes dl-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
    .dl-blink { animation: dl-blink 1.6s ease-in-out infinite; }

    @keyframes dl-ping {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .dl-ping { animation: dl-ping 2s ease-out infinite; }

    @keyframes dl-breathe {
      0%, 100% { border-color: rgba(245,158,11,0.18); }
      50%       { border-color: rgba(245,158,11,0.50); }
    }
    .dl-breathe { animation: dl-breathe 3s ease-in-out infinite; }

    @media (prefers-reduced-motion: reduce) {
      .dl-pulse-blob, .dl-shimmer, .dl-blink, .dl-ping, .dl-breathe {
        animation: none !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// PulseBackground — exact copy from Hero
// ─────────────────────────────────────────────────────────────────────────────
const PulseBackground = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {PULSE_CONFIG.map((p, i) => (
        <div
          key={i}
          className="dl-pulse-blob"
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}) 0%, rgba(245,158,11,${p.opacity * 0.5}) 42%, transparent 70%)`,
            filter: "blur(44px)",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            willChange: "opacity",
          }}
        />
      ))}
    </div>
  );
});
PulseBackground.displayName = "PulseBackground";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const Download = (): JSX.Element => {
  const [progress, setProgress] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setProgress(90), 400);
    return () => clearTimeout(t);
  }, []);

  const handleNotify = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Not Supported", description: "Your browser does not support notifications.", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setIsSubscribed(true);
      new Notification("Xpool App Update", { body: "You'll be notified as soon as the app goes live!" });
      toast({ title: "You're on the list! 🎉", description: "We'll notify you the moment Xpool goes live." });
    } else {
      toast({ title: "Permission Denied", description: "Enable notifications in your browser to get launch alerts.", variant: "destructive" });
    }
  };

  const milestones = [
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

  return (
    <>
      <DownloadStyles />
      <Navbar />

      {/* Root wrapper — Hero's exact base gradient */}
      <div
        className="min-h-screen overflow-x-hidden"
        style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)" }}
      >

        {/* ══════════════════════════════════════════════════════════
            HERO / ABOVE THE FOLD
        ══════════════════════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center min-h-screen pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden"
          style={{ isolation: "isolate" }}
        >
          {/* Layer 0 — amber pulse blobs (from Hero) */}
          <PulseBackground />

          {/* Layer 1 — dot grid (from Hero) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Layer 2 — center radial highlight (from Hero) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 2,
              background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,251,235,0) 0%, rgba(255,251,235,0.7) 100%)",
            }}
          />

          {/* ── Content ── */}
          <div className="relative container mx-auto px-4 max-w-3xl text-center" style={{ zIndex: 10 }}>

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-amber-50/80 border border-amber-300/60 text-amber-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm shadow-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="dl-blink h-2 w-2 rounded-full bg-amber-500" />
              Currently in Final QA Testing
            </div>

            {/* Icon + ping ring */}
            <div className="flex justify-center mb-6">
              <div className="relative inline-flex">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xl" style={{ boxShadow: "0 16px 40px rgba(245,158,11,0.35)" }}>
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <span className="dl-ping absolute inset-0 rounded-3xl border-2 border-amber-400/50" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Xpool App is{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #ef4444, #f97316, #facc15)" }}>
                Almost Here
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              “India’s fastest taxi pooling app is coming—be first when we launch.”
            </p>

            {/* Progress bar */}
            <div className="mb-8 text-left">
              <div className="flex justify-between items-center mb-2.5 text-sm">
                <span className="text-gray-500 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>Development Progress</span>
                <span className="font-black text-gray-900 text-base tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>{progress}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden border border-amber-200/60" style={{ background: "rgba(254,243,199,0.8)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #ef4444, #f97316, #facc15)" }}
                >
                  <span className="dl-shimmer absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)" }} />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400 text-right" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Estimated launch in ~14 days
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <button
                onClick={handleNotify}
                disabled={isSubscribed}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(110deg, #f59e0b 0%, #fbbf24 40%, #fde68a 55%, #fbbf24 70%, #f59e0b 100%)",
                  backgroundSize: "200% auto",
                  color: "#1a0800",
                  boxShadow: "0 4px 24px rgba(245,158,11,0.35), 0 1px 0 rgba(255,255,255,0.35) inset",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {isSubscribed
                  ? <><CheckCircle className="h-5 w-5" /> You're on the list!</>
                  : <><Rocket className="h-5 w-5" /> Notify Me at Launch</>}
              </button>

              <button
                onClick={() => document.getElementById("dl-features")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold border transition-all active:scale-95"
                style={{ borderColor: "rgba(180,83,9,0.22)", color: "#92400e", background: "rgba(251,191,36,0.07)", fontFamily: "'DM Sans', sans-serif" }}
              >
                <Play className="h-4 w-4" /> See Features
              </button>
            </div>

            {isSubscribed && (
              <p className="mb-8 text-sm text-green-600 font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Notifications enabled — we'll ping you instantly!
              </p>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="dl-breathe bg-white/70 backdrop-blur-sm border border-amber-200/60 rounded-2xl px-3 py-3 sm:py-4 shadow-sm">
                  <p className="text-xl sm:text-2xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-semibold uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            STATUS CARDS
        ══════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-14 border-y border-amber-200/40" style={{ background: "rgba(255,251,235,0.6)" }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <StatusCard icon={<Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />} title="Mobile App" subtitle="Nearly Complete" accent="#f59e0b" bg="rgba(245,158,11,0.08)" />
              <StatusCard icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6" />} title="QA Testing" subtitle="In Progress" accent="#f97316" bg="rgba(249,115,22,0.08)" />
              <StatusCard icon={<Bell className="h-5 w-5 sm:h-6 sm:w-6" />} title="Alerts" subtitle="Push Notify" accent="#10b981" bg="rgba(16,185,129,0.08)" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            MILESTONES
        ══════════════════════════════════════════════════════════ */}
        <section className="py-14 sm:py-20" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 100%)" }}>
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Launch Milestones
              </h2>
              <p className="text-sm text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Here's where we are on the road to launch
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {milestones.map((m, i) => <MilestoneRow key={i} {...m} index={i} />)}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════════════ */}
        <section id="dl-features" className="py-14 sm:py-20 border-t border-amber-200/40" style={{ background: "rgba(255,251,235,0.5)" }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                What's Coming
              </h2>
              <p className="text-sm text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Features built to make every ride better</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="dl-breathe bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-4 shadow-md" style={{ boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 mb-1 text-base" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ef4444 100%)" }}>
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/8 blur-2xl" />
          <div className="relative container mx-auto px-4 max-w-xl text-center" style={{ zIndex: 10 }}>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Be the First to Ride with Xpool
            </h2>
            <p className="text-white/80 mb-8 text-sm sm:text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Enable notifications and get instant access the moment the app launches on the Play Store & App Store.
            </p>
            <button
              onClick={handleNotify}
              disabled={isSubscribed}
              className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-sm sm:text-base hover:bg-white/95 active:scale-95 transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ color: "#92400e", fontFamily: "'DM Sans', sans-serif" }}
            >
              {isSubscribed
                ? <><CheckCircle className="w-5 h-5 text-green-500" /> You're Subscribed!</>
                : <><Bell className="w-5 h-5" /> Get Launch Alert <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="mt-4 text-xs text-white/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>No spam. Just one ping when we go live.</p>
          </div>
        </section>

      </div>
    </>
  );
};

export default Download;

// ─────────────────────────────────────────────────────────────────────────────
// StatusCard
// ─────────────────────────────────────────────────────────────────────────────
interface StatusCardProps { icon: React.ReactNode; title: string; subtitle: string; accent: string; bg: string; }

const StatusCard = ({ icon, title, subtitle, accent, bg }: StatusCardProps): JSX.Element => (
  <div className="dl-breathe bg-white/70 backdrop-blur-sm border border-amber-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center hover:shadow-md transition-all duration-300">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3" style={{ background: bg, color: accent }}>
      {icon}
    </div>
    <p className="font-black text-gray-900 text-xs sm:text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</p>
    <p className="text-gray-400 text-xs mt-0.5 hidden sm:block" style={{ fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MilestoneRow
// ─────────────────────────────────────────────────────────────────────────────
interface MilestoneRowProps { label: string; done: boolean; active?: boolean; index: number; }

const MilestoneRow = ({ label, done, active, index }: MilestoneRowProps): JSX.Element => (
  <div
    className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-300"
    style={{
      animationDelay: `${index * 0.08}s`,
      borderColor: active ? "rgba(249,115,22,0.35)" : done ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.15)",
      background: active ? "rgba(249,115,22,0.05)" : done ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.5)",
      opacity: !done && !active ? 0.6 : 1,
    }}
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: active ? "rgba(249,115,22,0.15)" : done ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.1)", color: active ? "#f97316" : done ? "#10b981" : "#9ca3af" }}>
      {done
        ? <CheckCircle className="w-4 h-4" />
        : active
          ? <span className="w-2.5 h-2.5 rounded-full bg-orange-400 dl-blink" />
          : <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
    </div>
    <p className="font-semibold text-sm sm:text-base flex-1" style={{ fontFamily: "'DM Sans', sans-serif", color: done ? "#1f2937" : active ? "#c2410c" : "#9ca3af" }}>
      {label}
    </p>
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'DM Sans', sans-serif", background: active ? "rgba(249,115,22,0.12)" : done ? "rgba(16,185,129,0.12)" : "rgba(156,163,175,0.15)", color: active ? "#c2410c" : done ? "#059669" : "#9ca3af" }}>
      {done ? "Done" : active ? "In Progress" : "Pending"}
    </span>
  </div>
);