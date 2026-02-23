import { useEffect, useRef, useState } from "react";
import {
  MapPin, Users, Shield, CreditCard, Star, Clock,
  DollarSign, CheckCircle, Phone, Bike, Sparkles, Download, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

/* ── Brand tokens ── */
const ORANGE = "#FF9500";
const GOLD = "#E8A000";
const NAVY = "#1a1a2e";
const WHITE = "#FFFFFF";
const IVORY = "#FFF9ED";

/* ── Inject styles once ── */
const STYLE_ID = "xpool-hiw-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

    @keyframes hiw-fade-up {
      from { opacity:0; transform:translateY(32px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes hiw-fade-left {
      from { opacity:0; transform:translateX(-32px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes hiw-fade-right {
      from { opacity:0; transform:translateX(32px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes hiw-scale-in {
      from { opacity:0; transform:scale(0.7); }
      to   { opacity:1; transform:scale(1); }
    }
    @keyframes hiw-float {
      0%,100% { transform:translateY(0px) rotate(-2deg); }
      50%     { transform:translateY(-12px) rotate(2deg); }
    }
    @keyframes hiw-spin-slow {
      from { transform:rotate(0deg); }
      to   { transform:rotate(360deg); }
    }
    @keyframes hiw-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes hiw-pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(255,149,0,0.5); }
      70%  { box-shadow: 0 0 0 18px rgba(255,149,0,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,149,0,0); }
    }
    @keyframes hiw-dash {
      to { stroke-dashoffset: 0; }
    }
    @keyframes hiw-counter {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .hiw-visible    { animation-play-state: running !important; }
    .hiw-anim-base  { animation-play-state: paused; animation-fill-mode: both; }

    .hiw-hero-badge {
      display:inline-flex; align-items:center; gap:8px;
      background:rgba(255,255,255,0.15);
      border:1px solid rgba(255,255,255,0.3);
      border-radius:999px; padding:6px 16px;
      font-family:'DM Sans',sans-serif; font-weight:600;
      color:${WHITE}; font-size:0.85rem;
      backdrop-filter:blur(8px);
    }

    .hiw-step-card {
      background:${WHITE};
      border:1px solid rgba(245,158,11,0.12);
      border-radius:24px;
      padding:48px 40px;
      transition:box-shadow 0.3s, transform 0.3s;
      position:relative; overflow:hidden;
    }
    .hiw-step-card::before {
      content:'';
      position:absolute; top:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg, ${ORANGE}, ${GOLD});
      transform:scaleX(0);
      transform-origin:left;
      transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    .hiw-step-card:hover::before { transform:scaleX(1); }
    .hiw-step-card:hover {
      box-shadow:0 24px 60px rgba(255,149,0,0.14);
      transform:translateY(-4px);
    }

    .hiw-icon-orb {
      width:96px; height:96px;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      position:relative;
    }
    .hiw-icon-orb.pulse { animation: hiw-pulse-ring 2s infinite; }

    .hiw-step-num {
      font-family:'Syne',sans-serif;
      font-weight:800;
      font-size:5rem;
      line-height:1;
      position:absolute;
      right:24px; top:16px;
      background:linear-gradient(135deg, rgba(255,149,0,0.1), rgba(232,160,0,0.05));
      -webkit-background-clip:text;
      -webkit-text-fill-color:transparent;
      user-select:none;
    }

    .hiw-benefit-card {
      background:${WHITE};
      border:1px solid rgba(245,158,11,0.15);
      border-radius:20px;
      padding:28px 24px;
      transition:all 0.3s;
      position:relative; overflow:hidden;
    }
    .hiw-benefit-card::after {
      content:'';
      position:absolute; bottom:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg,${ORANGE},${GOLD});
      transform:scaleX(0); transform-origin:center;
      transition:transform 0.35s ease;
    }
    .hiw-benefit-card:hover::after { transform:scaleX(1); }
    .hiw-benefit-card:hover {
      box-shadow:0 16px 40px rgba(255,149,0,0.12);
      transform:translateY(-6px);
      border-color:rgba(255,149,0,0.3);
    }

    .hiw-cta-btn-primary {
      display:inline-flex; align-items:center; gap:8px;
      background:${WHITE};
      color:${NAVY};
      font-family:'DM Sans',sans-serif; font-weight:700;
      border:none; border-radius:14px;
      padding:16px 32px; font-size:1rem;
      cursor:pointer;
      box-shadow:0 8px 24px rgba(0,0,0,0.12);
      transition:transform 0.2s, box-shadow 0.2s;
      position:relative; overflow:hidden;
    }
    .hiw-cta-btn-primary::before {
      content:'';
      position:absolute; inset:0;
      background:linear-gradient(105deg,transparent 40%,rgba(255,149,0,0.15) 50%,transparent 60%);
      background-size:200% auto;
    }
    .hiw-cta-btn-primary:hover {
      transform:translateY(-3px) scale(1.02);
      box-shadow:0 16px 40px rgba(0,0,0,0.2);
    }
    .hiw-cta-btn-primary:hover::before { animation:hiw-shimmer 0.6s linear; }

    .hiw-cta-btn-secondary {
      display:inline-flex; align-items:center; gap:8px;
      background:rgba(255,255,255,0.12);
      color:${WHITE};
      font-family:'DM Sans',sans-serif; font-weight:600;
      border:1.5px solid rgba(255,255,255,0.25);
      border-radius:14px; padding:16px 32px; font-size:1rem;
      cursor:pointer;
      transition:background 0.2s, transform 0.2s, border-color 0.2s;
      backdrop-filter:blur(8px);
    }
    .hiw-cta-btn-secondary:hover {
      background:rgba(255,255,255,0.22);
      border-color:rgba(255,255,255,0.5);
      transform:translateY(-3px);
    }

    .hiw-connector {
      width:2px;
      background:linear-gradient(to bottom, ${ORANGE}, rgba(255,149,0,0));
      margin:0 auto;
    }

    .hiw-float { animation: hiw-float 4s ease-in-out infinite; }
    .hiw-spin  { animation: hiw-spin-slow 12s linear infinite; }
  `;
  document.head.appendChild(s);
}

/* ── Intersection observer hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Step card component ── */
function StepCard({
  step, index, total,
}: {
  step: { number: string; title: string; description: string; icon: any };
  index: number;
  total: number;
}) {
  const Icon = step.icon;
  const { ref, visible } = useReveal(0.1);
  const isEven = index % 2 === 0;
  const animClass = isEven ? "hiw-fade-left" : "hiw-fade-right";

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Row */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          width: "100%",
          maxWidth: 900,
          animation: visible ? `${animClass} 0.6s cubic-bezier(0.16,1,0.3,1) both` : "none",
          opacity: visible ? undefined : 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "center",
          }}
          className="hiw-step-grid"
        >
          {/* Text side */}
          <div
            style={{ order: isEven ? 0 : 1 }}
            className="hiw-step-text"
          >
            <div className="hiw-step-card">
              <span className="hiw-step-num">{step.number}</span>

              {/* Orb */}
              <div
                className={`hiw-icon-orb${index === 0 ? " pulse" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${ORANGE}, ${GOLD})`,
                  marginBottom: 24,
                  boxShadow: "0 8px 24px rgba(255,149,0,0.3)",
                }}
              >
                <Icon style={{ width: 40, height: 40, color: WHITE }} />
              </div>

              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  color: NAVY,
                  marginBottom: 12,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  color: "#64748b",
                  lineHeight: 1.75,
                }}
              >
                {step.description}
              </p>
            </div>
          </div>

          {/* Visual side */}
          <div
            style={{
              order: isEven ? 1 : 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            className="hiw-step-visual"
          >
            <div
              className="hiw-float"
              style={{
                animationDelay: `${index * 0.4}s`,
                position: "relative",
              }}
            >
              {/* Outer ring */}
              <div
                className="hiw-spin"
                style={{
                  width: 180,
                  height: 180,
                  border: `2px dashed rgba(255,149,0,0.25)`,
                  borderRadius: "50%",
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              {/* Main orb */}
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${ORANGE}22, ${GOLD}11)`,
                  border: `2px solid rgba(255,149,0,0.2)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${ORANGE}, ${GOLD})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(255,149,0,0.4)",
                  }}
                >
                  <Icon style={{ width: 36, height: 36, color: WHITE }} />
                </div>
              </div>
              {/* Step badge */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: NAVY,
                  color: WHITE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  zIndex: 2,
                  boxShadow: "0 4px 12px rgba(26,26,46,0.3)",
                }}
              >
                {step.number}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connector line */}
      {index < total - 1 && (
        <div className="hiw-connector" style={{ height: 48, marginTop: 16 }} />
      )}
    </div>
  );
}

/* ── Benefit card ── */
function BenefitCard({ icon: Icon, text, index }: { icon: any; text: string; index: number }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div
      ref={ref}
      className="hiw-benefit-card"
      style={{
        animation: visible
          ? `hiw-fade-up 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both`
          : "none",
        opacity: visible ? undefined : 0,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${ORANGE}, ${GOLD})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          boxShadow: "0 6px 18px rgba(255,149,0,0.25)",
        }}
      >
        <Icon style={{ width: 24, height: 24, color: WHITE }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <CheckCircle style={{ width: 18, height: 18, color: "#22c55e", flexShrink: 0 }} />
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            color: NAVY,
            fontSize: "0.95rem",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* ── Main page ── */
const HowItWorks = () => {
  const heroReveal = useReveal(0.1);

  const steps = [
    { number: "1", title: "Book Your Ride", description: "Open the Xpool app or website. Enter your pickup and drop location. Instantly view fare estimate and available vehicle options.", icon: MapPin },
    { number: "2", title: "Get Matched with a Captain", description: "Our system finds the nearest available driver. View their name, photo, bike number, and rating. Track their real-time location until pickup.", icon: Users },
    { number: "3", title: "Enjoy a Safe & Affordable Ride", description: "All Captains are KYC-verified with background checks. Helmets provided. Enjoy fast and affordable rides through city traffic.", icon: Shield },
    { number: "4", title: "Seamless Payments", description: "Pay via UPI, card, wallet, or cash. Receive instant invoices and earn cashback through Xpool offers.", icon: CreditCard },
    { number: "5", title: "Rate & Review", description: "Rate your Captain after every ride. Your feedback helps us improve safety and service quality.", icon: Star },
  ];

  const benefits = [
    { icon: Clock, text: "Fast pickups in under 5 minutes" },
    { icon: DollarSign, text: "Affordable fares – cheaper than cabs & autos" },
    { icon: Shield, text: "Safe rides with verified Captains" },
    { icon: Phone, text: "24/7 support whenever you need help" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: IVORY, fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <main style={{ paddingTop: 64 }}>

        {/* ── Hero ── */}
        <section
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #16213e 50%, #0f3460 100%)`,
            padding: "100px 0 120px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,149,0,0.15), transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(232,160,0,0.1), transparent 70%)`, pointerEvents: "none" }} />

          <div
            ref={heroReveal.ref}
            style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px", textAlign: "center" }}
          >
            {/* Badge */}
            <div
              style={{
                animation: heroReveal.visible ? "hiw-fade-up 0.5s ease both" : "none",
                opacity: heroReveal.visible ? undefined : 0,
                marginBottom: 24,
              }}
            >
              <span className="hiw-hero-badge">
                <Bike style={{ width: 16, height: 16 }} />
                Simple · Safe · Affordable
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                color: WHITE,
                marginBottom: 20,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                animation: heroReveal.visible ? "hiw-fade-up 0.6s 0.1s ease both" : "none",
                opacity: heroReveal.visible ? undefined : 0,
              }}
            >
              How{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${ORANGE}, ${GOLD})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Xpool
              </span>{" "}
              Works
            </h1>

            <p
              style={{
                fontSize: "1.15rem",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.75,
                animation: heroReveal.visible ? "hiw-fade-up 0.6s 0.2s ease both" : "none",
                opacity: heroReveal.visible ? undefined : 0,
              }}
            >
              Booking a ride with Xpool is quick, simple, and reliable —
              perfect for daily commutes, college, and city travel.
            </p>
          </div>

          {/* Wave divider */}
          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0 }}>
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
              <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill={IVORY} />
            </svg>
          </div>
        </section>

        {/* ── Steps ── */}
        <section style={{ padding: "80px 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
          {/* Responsive styles via a style tag trick */}
          <style>{`
            @media (max-width: 768px) {
              .hiw-step-grid { grid-template-columns: 1fr !important; }
              .hiw-step-visual { display: none !important; }
              .hiw-step-text { order: 0 !important; }
            }
          `}</style>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} total={steps.length} />
            ))}
          </div>
        </section>

        {/* ── Why Choose ── */}
        <section
          style={{
            background: WHITE,
            padding: "80px 24px 100px",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: `linear-gradient(135deg, ${ORANGE}22, ${GOLD}11)`,
                  border: `1px solid rgba(255,149,0,0.2)`,
                  borderRadius: 999,
                  padding: "6px 18px",
                  marginBottom: 16,
                }}
              >
                <Sparkles style={{ width: 16, height: 16, color: ORANGE }} />
                <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: ORANGE, fontSize: "0.85rem" }}>
                  Why Xpool?
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                  color: NAVY,
                  letterSpacing: "-0.02em",
                }}
              >
                Built for your everyday commute
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 24,
              }}
            >
              {benefits.map((b, i) => (
                <BenefitCard key={i} icon={b.icon} text={b.text} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #16213e 50%, #0f3460 100%)`,
            padding: "100px 24px",
            position: "relative",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          {/* Decorative rings */}
          {[200, 340, 480].map((size, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: size, height: size,
                border: `1px solid rgba(255,149,0,${0.08 - i * 0.02})`,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          ))}

          <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                color: WHITE,
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
            >
              Ready to Experience{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${ORANGE}, ${GOLD})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Xpool?
              </span>
            </h2>

            <p
              style={{
                fontSize: "1.1rem",
                color: "rgba(255,255,255,0.75)",
                marginBottom: 48,
                lineHeight: 1.7,
              }}
            >
              Download the app today and enjoy fast, affordable, and safe rides across the city.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "center",
              }}
            >
              <button className="hiw-cta-btn-primary">
                <Download style={{ width: 18, height: 18, color: ORANGE }} />
                Download for Android
                <ArrowRight style={{ width: 16, height: 16, color: NAVY }} />
              </button>
              <button className="hiw-cta-btn-secondary">
                <Download style={{ width: 18, height: 18 }} />
                Download for iOS
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HowItWorks;