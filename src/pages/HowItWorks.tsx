import { useEffect, useRef, useState, memo } from "react";
import {
  MapPin, Users, Shield, CreditCard, Star, Clock,
  DollarSign, CheckCircle, Phone, Bike, Sparkles,
  Download, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";
import { useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — unified with Hero / Download / Contact
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  navy: "#1c1917",
  white: "#ffffff",
  ivory: "#fffbeb",
  g500: "#6b7280",
  g900: "#111827",
  syne: "'Syne', sans-serif",
  dm: "'DM Sans', sans-serif",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pulse config — same 8-point set as all other pages
// ─────────────────────────────────────────────────────────────────────────────
const BLOBS = [
  { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, o: 0.28 },
  { x: 25, y: 65, size: 140, delay: 0.8, dur: 4.1, o: 0.20 },
  { x: 50, y: 18, size: 260, delay: 1.5, dur: 3.8, o: 0.25 },
  { x: 75, y: 80, size: 180, delay: 0.3, dur: 5.0, o: 0.18 },
  { x: 90, y: 30, size: 220, delay: 2.1, dur: 3.5, o: 0.22 },
  { x: 12, y: 88, size: 160, delay: 1.0, dur: 4.5, o: 0.16 },
  { x: 60, y: 50, size: 300, delay: 2.7, dur: 3.2, o: 0.20 },
  { x: 40, y: 35, size: 120, delay: 0.5, dur: 4.8, o: 0.25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Global styles
// ─────────────────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    @keyframes hiw-blob   { 0%,100%{opacity:0}  50%{opacity:1} }
    @keyframes hiw-up     { from{opacity:0;transform:translateY(28px)}  to{opacity:1;transform:translateY(0)} }
    @keyframes hiw-left   { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes hiw-right  { from{opacity:0;transform:translateX(28px)}  to{opacity:1;transform:translateX(0)} }
    @keyframes hiw-float  { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(1deg)} }
    @keyframes hiw-spin   { to{transform:translate(-50%,-50%) rotate(360deg)} }
    @keyframes hiw-blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes hiw-breath { 0%,100%{border-color:rgba(245,158,11,0.18)} 50%{border-color:rgba(245,158,11,0.50)} }
    @keyframes hiw-ring   { 0%{box-shadow:0 0 0 0 rgba(245,158,11,0.45)} 70%{box-shadow:0 0 0 16px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }

    .hiw-b  { animation:hiw-blob ease-in-out infinite; will-change:opacity; }
    .hiw-bl { animation:hiw-blink 1.6s ease-in-out infinite; }
    .hiw-br { animation:hiw-breath 3s ease-in-out infinite; }
    .hiw-fl { animation:hiw-float 4.5s ease-in-out infinite; }
    .hiw-sp { animation:hiw-spin 14s linear infinite; }
    .hiw-ri { animation:hiw-ring 2.2s infinite; }

    .step-card {
      background:rgba(255,255,255,0.86);
      backdrop-filter:blur(10px);
      border:1px solid rgba(245,158,11,0.20);
      border-radius:24px; padding:38px 34px;
      position:relative; overflow:hidden;
      transition:box-shadow .3s, transform .3s;
      animation:hiw-breath 3s ease-in-out infinite;
    }
    .step-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg,${T.amber},${T.orange});
      transform:scaleX(0); transform-origin:left;
      transition:transform .4s cubic-bezier(.34,1.56,.64,1);
    }
    .step-card:hover::before { transform:scaleX(1); }
    .step-card:hover { box-shadow:0 24px 56px rgba(245,158,11,0.16); transform:translateY(-4px); }

    .step-ghost {
      position:absolute; right:18px; top:10px;
      font-family:${T.syne}; font-weight:900; font-size:5.5rem; line-height:1;
      background:linear-gradient(135deg,rgba(245,158,11,0.10),rgba(249,115,22,0.05));
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      user-select:none; pointer-events:none;
    }

    .benefit-card {
      background:rgba(255,255,255,0.86);
      backdrop-filter:blur(8px);
      border:1px solid rgba(245,158,11,0.18);
      border-radius:20px; padding:28px 22px;
      position:relative; overflow:hidden;
      transition:all .3s;
      animation:hiw-breath 3s ease-in-out infinite;
    }
    .benefit-card::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg,${T.amber},${T.orange});
      transform:scaleX(0); transform-origin:center; transition:transform .35s ease;
    }
    .benefit-card:hover::after { transform:scaleX(1); }
    .benefit-card:hover { box-shadow:0 16px 40px rgba(245,158,11,0.15); transform:translateY(-6px); border-color:rgba(245,158,11,0.38); }

    .hiw-connector { width:2px; margin:0 auto; background:linear-gradient(to bottom,rgba(245,158,11,0.5),transparent); }

    .btn-pri {
      display:inline-flex; align-items:center; gap:9px;
      background:${T.white}; color:#92400e;
      font-family:${T.dm}; font-weight:700;
      border:none; border-radius:16px; padding:16px 32px; font-size:1rem;
      cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,0.10);
      transition:transform .2s, box-shadow .2s;
    }
    .btn-pri:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 16px 40px rgba(0,0,0,0.16); }

    .btn-sec {
      display:inline-flex; align-items:center; gap:9px;
      background:rgba(255,255,255,0.12); color:${T.white};
      font-family:${T.dm}; font-weight:600;
      border:1.5px solid rgba(255,255,255,0.28); border-radius:16px;
      padding:16px 32px; font-size:1rem;
      cursor:pointer; backdrop-filter:blur(8px);
      transition:background .2s, transform .2s, border-color .2s;
    }
    .btn-sec:hover { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.55); transform:translateY(-3px); }

    @media (max-width:768px) {
      .step-grid   { grid-template-columns:1fr !important; }
      .step-visual { display:none !important; }
      .step-text   { order:0 !important; }
      .step-card   { padding:26px 20px; }
    }
    @media (prefers-reduced-motion:reduce) {
      .hiw-b,.hiw-bl,.hiw-br,.hiw-fl,.hiw-sp,.hiw-ri { animation:none !important; }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// PulseBackground
// ─────────────────────────────────────────────────────────────────────────────
const PulseBackground = memo(() => {
  const rm = useReducedMotion();
  if (rm) return null;
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {BLOBS.map((p, i) => (
        <div key={i} className="hiw-b" style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle,rgba(251,191,36,${p.o}) 0%,rgba(245,158,11,${p.o * 0.5}) 42%,transparent 70%)`,
          filter: "blur(44px)",
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, willChange: "opacity",
        }} />
      ))}
    </div>
  );
});
PulseBackground.displayName = "PulseBackground";

// ─────────────────────────────────────────────────────────────────────────────
// useReveal
// ─────────────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────────────────────
// StepCard
// ─────────────────────────────────────────────────────────────────────────────
function StepCard({ step, index, total }: {
  step: { number: string; title: string; description: string; icon: any };
  index: number; total: number;
}) {
  const Icon = step.icon;
  const { ref, visible } = useReveal(0.1);
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div style={{
        width: "100%", maxWidth: 920,
        opacity: visible ? 1 : 0,
        animation: visible ? `${isEven ? "hiw-left" : "hiw-right"} 0.65s cubic-bezier(0.16,1,0.3,1) both` : "none",
      }}>
        <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>

          {/* Text card */}
          <div className="step-text" style={{ order: isEven ? 0 : 1 }}>
            <div className="step-card">
              <span className="step-ghost">{step.number}</span>

              {/* Icon orb */}
              <div className={index === 0 ? "hiw-ri" : ""} style={{
                width: 76, height: 76, borderRadius: "50%",
                background: `linear-gradient(135deg,${T.amber},${T.orange})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20, boxShadow: "0 8px 24px rgba(245,158,11,0.30)",
              }}>
                <Icon style={{ width: 34, height: 34, color: T.white }} />
              </div>

              {/* Step pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.22)",
                borderRadius: 999, padding: "3px 12px", marginBottom: 14,
              }}>
                <span style={{ fontFamily: T.dm, fontWeight: 700, fontSize: "0.76rem", color: T.amber, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Step {step.number}
                </span>
              </div>

              <h3 style={{ fontFamily: T.syne, fontWeight: 900, fontSize: "1.45rem", color: T.g900, marginBottom: 12, lineHeight: 1.2 }}>
                {step.title}
              </h3>
              <p style={{ fontFamily: T.dm, fontSize: "0.95rem", color: T.g500, lineHeight: 1.78 }}>
                {step.description}
              </p>
            </div>
          </div>

          {/* Visual orb */}
          <div className="step-visual" style={{ order: isEven ? 1 : 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="hiw-fl" style={{ animationDelay: `${index * 0.5}s`, position: "relative", width: 160, height: 160 }}>
              {/* spinning dashed ring */}
              <div className="hiw-sp" style={{
                position: "absolute", top: "50%", left: "50%",
                width: 210, height: 210,
                border: "2px dashed rgba(245,158,11,0.22)", borderRadius: "50%",
              }} />
              {/* mid ring */}
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 160, height: 160, borderRadius: "50%",
                border: "1px solid rgba(245,158,11,0.15)",
                background: "rgba(255,251,235,0.50)", backdropFilter: "blur(6px)",
              }} />
              {/* core */}
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 88, height: 88, borderRadius: "50%",
                background: `linear-gradient(135deg,${T.amber},${T.orange})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(245,158,11,0.42)", zIndex: 1,
              }}>
                <Icon style={{ width: 36, height: 36, color: T.white }} />
              </div>
              {/* badge */}
              <div style={{
                position: "absolute", top: -4, right: -4, zIndex: 2,
                width: 34, height: 34, borderRadius: "50%",
                background: T.navy, color: T.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.syne, fontWeight: 900, fontSize: "0.88rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.24)",
              }}>
                {step.number}
              </div>
            </div>
          </div>
        </div>
      </div>

      {index < total - 1 && (
        <div className="hiw-connector" style={{ height: 52, marginTop: 8 }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BenefitCard
// ─────────────────────────────────────────────────────────────────────────────
function BenefitCard({ icon: Icon, title, text, index }: { icon: any; title: string; text: string; index: number }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div ref={ref} className="benefit-card" style={{
      animation: visible ? `hiw-up 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both` : "none",
      opacity: visible ? undefined : 0,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `linear-gradient(135deg,${T.amber},${T.orange})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, boxShadow: "0 6px 18px rgba(245,158,11,0.28)",
      }}>
        <Icon style={{ width: 24, height: 24, color: T.white }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <CheckCircle style={{ width: 17, height: 17, color: "#22c55e", flexShrink: 0 }} />
        <p style={{ fontFamily: T.syne, fontWeight: 900, color: T.g900, fontSize: "0.95rem", margin: 0 }}>{title}</p>
      </div>
      <p style={{ fontFamily: T.dm, fontSize: "0.875rem", color: T.g500, lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const steps = [
  { number: "1", title: "Book Your Ride", description: "Open the Xpool app or website. Enter your pickup and drop location. Instantly view fare estimate and available vehicle options.", icon: MapPin },
  { number: "2", title: "Get Matched with a Captain", description: "Our system finds the nearest available driver. View their name, photo, bike number, and rating. Track their real-time location until pickup.", icon: Users },
  { number: "3", title: "Enjoy a Safe & Affordable Ride", description: "All Captains are KYC-verified with background checks. Helmets provided. Enjoy fast and affordable rides through city traffic.", icon: Shield },
  { number: "4", title: "Seamless Payments", description: "Pay via UPI, card, wallet, or cash. Receive instant invoices and earn cashback through Xpool offers.", icon: CreditCard },
  { number: "5", title: "Rate & Review", description: "Rate your Captain after every ride. Your feedback helps us improve safety and service quality.", icon: Star },
];

const benefits = [
  { icon: Clock, title: "Fast Pickups", text: "Pickup in under 5 minutes — no waiting around." },
  { icon: DollarSign, title: "Affordable Fares", text: "Cheaper than cabs & autos for every commute." },
  { icon: Shield, title: "Verified Captains", text: "Every captain is KYC-checked and background-verified." },
  { icon: Phone, title: "24/7 Support", text: "Our team is always available to help you." },
];

const stats = [
  { value: "50K+", label: "Happy Riders" },
  { value: "5 min", label: "Avg Pickup" },
  { value: "30+", label: "Cities" },
  { value: "4.8★", label: "App Rating" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const hero = useReveal(0.1);

  return (
    <>
      <Styles />
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${T.ivory} 0%,#fef9e7 45%,#fffdf5 100%)`, overflowX: "hidden" }}>
        <Navbar />

        <main style={{ paddingTop: 64 }}>

          {/* ══════════════════════════════ HERO ══════════════════════════════ */}
          <section style={{ position: "relative", overflow: "hidden", padding: "96px 24px 128px", isolation: "isolate" }}>
            <PulseBackground />

            {/* dot grid */}
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
              backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
            {/* center vignette */}
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
              background: "radial-gradient(ellipse 70% 60% at 50% 45%,rgba(255,251,235,0) 0%,rgba(255,251,235,0.65) 100%)",
            }} />

            <div ref={hero.ref} style={{ position: "relative", zIndex: 10, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>

              {/* Badge */}
              <div style={{ animation: hero.visible ? "hiw-up 0.5s ease both" : "none", opacity: hero.visible ? undefined : 0, marginBottom: 24 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.28)",
                  borderRadius: 999, padding: "6px 18px",
                  fontFamily: T.dm, fontWeight: 600, color: "#92400e", fontSize: "0.85rem",
                  backdropFilter: "blur(6px)",
                }}>
                  <span className="hiw-bl" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <Bike style={{ width: 15, height: 15, color: T.amber }} />
                  Simple · Safe · Affordable
                </span>
              </div>

              {/* Heading */}
              <h1 style={{
                fontFamily: T.syne, fontWeight: 900,
                fontSize: "clamp(2.4rem,6vw,4.2rem)",
                color: T.g900, marginBottom: 20, lineHeight: 1.08, letterSpacing: "-0.025em",
                animation: hero.visible ? "hiw-up 0.6s 0.1s ease both" : "none",
                opacity: hero.visible ? undefined : 0,
              }}>
                How{" "}
                <span style={{ background: `linear-gradient(90deg,${T.amber},${T.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Xpool
                </span>{" "}
                Works
              </h1>

              <p style={{
                fontFamily: T.dm, fontSize: "1.08rem", color: T.g500,
                lineHeight: 1.78, maxWidth: 500, margin: "0 auto 44px",
                animation: hero.visible ? "hiw-up 0.6s 0.2s ease both" : "none",
                opacity: hero.visible ? undefined : 0,
              }}>
                Booking a ride with Xpool is quick, simple, and reliable —
                perfect for daily commutes, college, and city travel.
              </p>

              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(2,1fr)",
                gap: 12, maxWidth: 420, margin: "0 auto",
                animation: hero.visible ? "hiw-up 0.6s 0.3s ease both" : "none",
                opacity: hero.visible ? undefined : 0,
              }}>
                {stats.map((s, i) => (
                  <div key={i} className="hiw-br" style={{
                    background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(245,158,11,0.20)", borderRadius: 16,
                    padding: "14px 18px", boxShadow: "0 2px 12px rgba(245,158,11,0.07)",
                  }}>
                    <p style={{ fontFamily: T.syne, fontWeight: 900, fontSize: "1.5rem", color: T.g900, margin: 0 }}>{s.value}</p>
                    <p style={{ fontFamily: T.dm, fontSize: "0.72rem", color: "#9ca3af", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wave into steps */}
            <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 10 }}>
              <svg viewBox="0 0 1440 48" fill="none" style={{ display: "block", width: "100%" }}>
                <path d="M0,0 C360,48 1080,48 1440,0 L1440,48 L0,48 Z" fill="rgba(255,253,245,0.6)" />
              </svg>
            </div>
          </section>

          {/* ══════════════════════════════ STEPS ══════════════════════════════ */}
          <section style={{ padding: "80px 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontFamily: T.syne, fontWeight: 900, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: T.g900, letterSpacing: "-0.02em", marginBottom: 8 }}>
                Your Ride in{" "}
                <span style={{ background: `linear-gradient(90deg,${T.amber},${T.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  5 Simple Steps
                </span>
              </h2>
              <p style={{ fontFamily: T.dm, color: T.g500, fontSize: "1rem", maxWidth: 420, margin: "0 auto" }}>
                From booking to rating — the complete Xpool experience
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              {steps.map((s, i) => <StepCard key={s.number} step={s} index={i} total={steps.length} />)}
            </div>
          </section>

          {/* ══════════════════════════════ WHY XPOOL ══════════════════════════════ */}
          <section style={{
            padding: "80px 24px 100px",
            background: "rgba(255,253,245,0.65)",
            borderTop: "1px solid rgba(245,158,11,0.14)",
            borderBottom: "1px solid rgba(245,158,11,0.14)",
          }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.22)",
                  borderRadius: 999, padding: "5px 16px", marginBottom: 16,
                }}>
                  <Sparkles style={{ width: 15, height: 15, color: T.amber }} />
                  <span style={{ fontFamily: T.dm, fontWeight: 700, color: "#92400e", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Why Xpool?
                  </span>
                </div>
                <h2 style={{ fontFamily: T.syne, fontWeight: 900, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: T.g900, letterSpacing: "-0.02em", marginBottom: 8 }}>
                  Built for your everyday commute
                </h2>
                <p style={{ fontFamily: T.dm, color: T.g500, fontSize: "0.97rem", maxWidth: 380, margin: "0 auto" }}>
                  Everything you need for a stress-free daily ride
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 22 }}>
                {benefits.map((b, i) => <BenefitCard key={i} icon={b.icon} title={b.title} text={b.text} index={i} />)}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════ CTA ══════════════════════════════ */}
          <section style={{
            padding: "100px 24px",
            background: `linear-gradient(135deg,${T.amber} 0%,${T.orange} 55%,${T.red} 100%)`,
            position: "relative", overflow: "hidden", textAlign: "center",
          }}>
            {/* blobs */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.06),transparent 70%)", pointerEvents: "none" }} />

            {/* dot grid */}
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08,
              backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }} />

            {/* rings */}
            {[200, 340, 480].map((sz, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: sz, height: sz,
                border: `1px solid rgba(255,255,255,${0.07 - i * 0.015})`,
                borderRadius: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
              }} />
            ))}

            <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
              {/* online badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 999, padding: "6px 18px", marginBottom: 24, backdropFilter: "blur(8px)",
              }}>
                <span className="hiw-bl" style={{ width: 8, height: 8, borderRadius: "50%", background: "#86efac", display: "inline-block" }} />
                <span style={{ fontFamily: T.dm, fontWeight: 600, color: "rgba(255,255,255,0.9)", fontSize: "0.84rem" }}>App available now</span>
              </div>

              <h2 style={{ fontFamily: T.syne, fontWeight: 900, fontSize: "clamp(2rem,5vw,3.2rem)", color: T.white, letterSpacing: "-0.025em", marginBottom: 16, lineHeight: 1.1 }}>
                Ready to Experience{" "}
                <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 8, padding: "2px 10px" }}>Xpool?</span>
              </h2>

              <p style={{ fontFamily: T.dm, fontSize: "1.05rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.72, maxWidth: 480, margin: "0 auto 44px" }}>
                Download the app today and enjoy fast, affordable, and safe rides across the city.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                <button className="btn-pri">
                  <Download style={{ width: 18, height: 18, color: T.amber }} />
                  Download for Android
                  <ArrowRight style={{ width: 16, height: 16, color: T.amber }} />
                </button>
                <button className="btn-sec">
                  <Download style={{ width: 18, height: 18 }} />
                  Download for iOS
                </button>
              </div>

              <p style={{ marginTop: 20, fontFamily: T.dm, fontSize: "0.78rem", color: "rgba(255,255,255,0.38)" }}>
                Available on Play Store & App Store · Free to download
              </p>
            </div>
          </section>

        </main>
      </div>
    </>
  );
};

export default HowItWorks;