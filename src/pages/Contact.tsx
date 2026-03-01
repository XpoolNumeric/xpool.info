import { memo } from "react";
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
import { useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Pulse blob config — same 10-point set from Hero / Download
// ─────────────────────────────────────────────────────────────────────────────
interface PulsePoint {
  x: number; y: number; size: number; delay: number; dur: number; opacity: number;
}
const PULSE_CONFIG: PulsePoint[] = [
  { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, opacity: 0.28 },
  { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, opacity: 0.20 },
  { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, opacity: 0.25 },
  { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, opacity: 0.18 },
  { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, opacity: 0.22 },
  { x: 12, y: 88, size: 160, delay: 1.0, dur: 4.5, opacity: 0.16 },
  { x: 60, y: 50, size: 300, delay: 2.7, dur: 3.2, opacity: 0.20 },
  { x: 40, y: 35, size: 120, delay: 0.5, dur: 4.8, opacity: 0.25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Injected styles
// ─────────────────────────────────────────────────────────────────────────────
const ContactStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    @keyframes ct-pulse-fade {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }
    .ct-blob {
      animation: ct-pulse-fade ease-in-out infinite;
      will-change: opacity;
    }

    @keyframes ct-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
    .ct-blink { animation: ct-blink 1.6s ease-in-out infinite; }

    @keyframes ct-breathe {
      0%, 100% { border-color: rgba(245,158,11,0.18); }
      50%       { border-color: rgba(245,158,11,0.48); }
    }
    .ct-breathe { animation: ct-breathe 3s ease-in-out infinite; }

    @keyframes ct-fade-up {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ct-fade-up { animation: ct-fade-up 0.62s cubic-bezier(0.22,1,0.36,1) both; }

    @media (prefers-reduced-motion: reduce) {
      .ct-blob, .ct-blink, .ct-breathe, .ct-fade-up { animation: none !important; }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// PulseBackground — identical pattern to Hero & Download
// ─────────────────────────────────────────────────────────────────────────────
const PulseBackground = memo(() => {
  const rm = useReducedMotion();
  if (rm) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {PULSE_CONFIG.map((p, i) => (
        <div key={i} className="ct-blob" style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}) 0%, rgba(245,158,11,${p.opacity * 0.5}) 42%, transparent 70%)`,
          filter: "blur(44px)",
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          willChange: "opacity",
        }} />
      ))}
    </div>
  );
});
PulseBackground.displayName = "PulseBackground";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const contactMethods = [
  {
    title: "Customer Support",
    description: "Need help with a ride, payment, or app issue? Our support team is available 24/7 to assist you.",
    icon: Phone,
    value: "+91 7904790007",
    label: "Call Now",
    href: "tel:+917904790007",
    badge: "24/7 Live",
    from: "#f59e0b", to: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.10)", badgeColor: "#92400e",
    glow: "rgba(245,158,11,0.28)",
  },
  {
    title: "Email Support",
    description: "For partnerships, business inquiries, or detailed support requests, drop us an email.",
    icon: Mail,
    value: "support@xpool.app",
    label: "Send Email",
    href: "mailto:support@xpool.app",
    badge: "Quick Reply",
    from: "#f97316", to: "#fb923c",
    badgeBg: "rgba(249,115,22,0.10)", badgeColor: "#9a3412",
    glow: "rgba(249,115,22,0.24)",
  },
  {
    title: "Our Location",
    description: "We operate across major cities in India, providing fast and affordable bike taxi services.",
    icon: MapPin,
    value: "Chennai, India",
    label: "View Map",
    href: "#",
    badge: "Pan India",
    from: "#10b981", to: "#34d399",
    badgeBg: "rgba(16,185,129,0.10)", badgeColor: "#065f46",
    glow: "rgba(16,185,129,0.22)",
  },
];

const reasons = [
  { icon: Clock, title: "24/7 Support", text: "Round-the-clock assistance whenever you need it — day or night." },
  { icon: Shield, title: "Safe & Verified", text: "Every captain is background-checked and verified for your safety." },
  { icon: Users, title: "Trusted Community", text: "Join thousands of happy riders across major Indian cities." },
];

const stats = [
  { value: "50K+", label: "Happy Riders" },
  { value: "10+", label: "Cities" },
  { value: "4.8★", label: "App Rating" },
  { value: "<2min", label: "Avg Response" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const Contact = () => (
  <>
    <ContactStyles />

    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)" }}
    >
      <Navbar />

      <main className="pt-16 md:pt-20">

        {/* ════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-16 sm:py-20 md:py-28" style={{ isolation: "isolate" }}>
          <PulseBackground />

          {/* dot grid */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
            zIndex: 1,
            backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          {/* center vignette */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
            zIndex: 2,
            background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,251,235,0) 0%, rgba(255,251,235,0.65) 100%)",
          }} />

          <div className="relative container mx-auto px-4 text-center" style={{ zIndex: 10 }}>

            {/* Live pill */}
            <div className="ct-fade-up inline-flex items-center gap-2 bg-amber-50/80 border border-amber-300/60 text-amber-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm shadow-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="ct-blink h-2 w-2 rounded-full bg-green-500" />
              Support team is online
            </div>

            {/* Icon */}
            <div className="ct-fade-up flex justify-center mb-6" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center" style={{ boxShadow: "0 16px 40px rgba(245,158,11,0.32)" }}>
                <Headphones className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            {/* Heading */}
            <h1
              className="ct-fade-up text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-5 leading-tight tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif", animationDelay: "0.15s" }}
            >
              We're Here to{" "}
              <span className="relative inline-block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #f59e0b, #f97316)" }}>
                Help
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6 Q100 2 198 6" stroke="rgba(245,158,11,0.5)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p
              className="ct-fade-up text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ fontFamily: "'DM Sans', sans-serif", animationDelay: "0.2s" }}
            >
              Reach out for support, feedback, or partnerships. The Xpool team is always just a tap away.
            </p>

            {/* Stats */}
            <div className="ct-fade-up grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto" style={{ animationDelay: "0.3s" }}>
              {stats.map((s, i) => (
                <div key={i} className="ct-breathe bg-white/70 backdrop-blur-sm border border-amber-200/60 rounded-2xl px-3 py-3 sm:py-4 shadow-sm">
                  <p className="text-xl sm:text-2xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-semibold uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CONTACT CARDS
        ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 border-t border-amber-200/40" style={{ background: "rgba(255,253,245,0.6)" }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Get in Touch
              </h2>
              <p className="text-gray-400 mt-2 text-sm sm:text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Choose the channel that works best for you
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {contactMethods.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="ct-breathe ct-fade-up group bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Top gradient bar */}
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${item.from}, ${item.to})` }} />

                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, boxShadow: `0 8px 20px ${item.glow}` }}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: item.badgeBg, color: item.badgeColor, fontFamily: "'DM Sans', sans-serif" }}>
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.description}</p>

                      {/* Value pill */}
                      <div className="rounded-xl px-3 py-2.5 mb-5 border border-amber-100/80" style={{ background: "rgba(255,251,235,0.9)" }}>
                        <p className="font-bold text-gray-800 text-sm truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.value}</p>
                      </div>

                      <a
                        href={item.href}
                        className="flex items-center justify-center gap-2 w-full text-white text-sm font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, boxShadow: `0 4px 14px ${item.glow}`, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {item.label}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            WHY REACH US
        ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 border-t border-amber-200/40" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 100%)" }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)" }}>
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#f59e0b" }} />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Why Reach Out to Xpool?
              </h2>
              <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-lg mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                We don't just answer questions — we solve problems and make your ride experience smooth.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={index}
                    className="ct-breathe ct-fade-up bg-white/80 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-amber-200/50 hover:shadow-md transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-200/50" style={{ background: "rgba(245,158,11,0.09)" }}>
                        <Icon className="w-5 h-5" style={{ color: "#f59e0b" }} />
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <h4 className="text-base font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>{reason.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{reason.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FAQ TEASER
        ════════════════════════════════════════════ */}
        <section className="py-12 sm:py-16 border-y border-amber-200/40" style={{ background: "rgba(255,253,245,0.8)" }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 max-w-3xl mx-auto text-center sm:text-left">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)" }}>
                <Star className="w-7 h-7" style={{ color: "#f59e0b" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Looking for quick answers?
                </h3>
                <p className="text-sm text-gray-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Check our Help Center for FAQs on rides, payments, safety, and more — available in the app.
                </p>
              </div>
              <a
                href="#"
                className="flex-shrink-0 inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 whitespace-nowrap hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 4px 16px rgba(245,158,11,0.30)", fontFamily: "'DM Sans', sans-serif" }}
              >
                <Zap className="w-4 h-4" />
                Help Center
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ef4444 100%)" }}>
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/8 blur-2xl" />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          <div className="relative container mx-auto px-4 text-center" style={{ zIndex: 10 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white/90 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="ct-blink w-2 h-2 rounded-full bg-green-400" />
              Available right now
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Need Immediate Help?
            </h2>

            <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Call or email us anytime. Our support team is always ready to help you ride smoothly with Xpool.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <a
                href="tel:+917904790007"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white font-bold px-7 py-4 rounded-2xl text-sm sm:text-base hover:bg-white/95 active:scale-95 transition-all shadow-xl"
                style={{ color: "#92400e", fontFamily: "'DM Sans', sans-serif" }}
              >
                <Phone className="w-5 h-5" /> Call Support
              </a>
              <a
                href="mailto:support@xpool.app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/25 px-7 py-4 rounded-2xl font-semibold text-sm sm:text-base hover:bg-white/20 active:scale-95 transition-all backdrop-blur"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Mail className="w-5 h-5" /> Email Us
              </a>
            </div>

            <p className="mt-6 text-xs text-white/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Average response time: under 2 minutes
            </p>
          </div>
        </section>

      </main>
    </div>
  </>
);

export default Contact;