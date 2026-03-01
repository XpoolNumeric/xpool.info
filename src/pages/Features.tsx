import Navbar from "@/components/ui/navbar";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  Settings,
  ArrowRight,
  Zap,
} from "lucide-react";

/* ---------------------------------- */
/* Types                              */
/* ---------------------------------- */

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

/* ---------------------------------- */
/* Feature Data                       */
/* ---------------------------------- */

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
    icon: Settings,
    accent: "#FF8C42",
  },
];

/* ---------------------------------- */
/* Intersection Observer Hook         */
/* ---------------------------------- */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ---------------------------------- */
/* Animated Counter                   */
/* ---------------------------------- */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------------------------------- */
/* Page Component                     */
/* ---------------------------------- */

const Features = (): JSX.Element => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 30;
      const y = (clientY / innerHeight - 0.5) * 30;
      heroRef.current.style.setProperty("--mouse-x", `${x}px`);
      heroRef.current.style.setProperty("--mouse-y", `${y}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0F", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Bebas+Neue&display=swap');

        * { box-sizing: border-box; }

        :root {
          --orange: #FF6B35;
          --orange-mid: #FF8C42;
          --orange-light: #FFA552;
          --bg: #0A0A0F;
          --bg-card: #111118;
          --bg-card-hover: #16161F;
          --border: rgba(255,107,53,0.12);
          --border-hover: rgba(255,107,53,0.35);
          --text: #F0EEE9;
          --text-muted: #6E6C7A;
          --text-mid: #A8A6B5;
        }

        /* Mobile-first adjustments */
        @media (max-width: 600px) {
          .hero-title {
            font-size: clamp(48px, 12vw, 80px) !important;
          }
          .hero-sub {
            font-size: 16px !important;
            padding: 0 16px;
          }
          .stats-bar {
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px;
          }
          .stat-item {
            flex: 1 1 calc(50% - 16px);
            padding: 12px 8px !important;
            border-right: none !important;
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
          }
          .stat-value {
            font-size: 28px !important;
          }
          .stat-label {
            font-size: 10px !important;
          }
          .section-title {
            font-size: clamp(32px, 8vw, 56px) !important;
          }
          .feature-card {
            padding: 24px !important;
          }
          .icon-wrap {
            width: 44px !important;
            height: 44px !important;
          }
          .card-title {
            font-size: 16px !important;
          }
          .card-desc {
            font-size: 13px !important;
          }
          .cta-section {
            padding: 80px 16px !important;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }

        .hero-bg {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none;
        }
        .hero-orb {
          position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.35;
        }
        .hero-orb-1 {
          width: 600px; height: 600px; top: -150px; left: -100px;
          background: radial-gradient(circle, #FF6B35 0%, transparent 70%);
          transform: translate(var(--mouse-x, 0), var(--mouse-y, 0));
          transition: transform 0.8s ease;
        }
        .hero-orb-2 {
          width: 400px; height: 400px; bottom: -80px; right: -80px;
          background: radial-gradient(circle, #FF8C42 0%, transparent 70%);
          transform: translate(calc(var(--mouse-x, 0) * -0.6), calc(var(--mouse-y, 0) * -0.6));
          transition: transform 1s ease;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,107,53,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,107,53,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%);
        }

        .hero-label {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(255,107,53,0.25);
          background: rgba(255,107,53,0.08);
          color: var(--orange-mid);
          font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 28px;
        }

        .hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(64px, 10vw, 120px);
          line-height: 0.92;
          color: var(--text);
          letter-spacing: 0.01em;
          margin: 0 0 28px;
        }
        .hero-title .gradient-word {
          background: linear-gradient(135deg, #FF6B35 0%, #FFA552 50%, #FF6B35 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .hero-sub {
          font-size: 18px; font-weight: 300;
          color: var(--text-mid); max-width: 520px; margin: 0 auto; line-height: 1.7;
        }

        /* Stats bar */
        .stats-bar {
          display: flex; align-items: center; justify-content: center; gap: 0;
          margin-top: 56px; border-radius: 16px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(20px);
          overflow: hidden; max-width: 680px; margin-left: auto; margin-right: auto;
        }
        .stat-item {
          flex: 1; padding: 20px 24px; text-align: center;
          border-right: 1px solid var(--border);
          position: relative;
        }
        .stat-item:last-child { border-right: none; }
        .stat-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px; color: var(--orange); letter-spacing: 0.02em; line-height: 1;
        }
        .stat-label {
          font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em;
          text-transform: uppercase; margin-top: 4px;
        }

        /* Section heading */
        .section-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--orange);
          margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(42px, 6vw, 72px);
          color: var(--text); line-height: 1; letter-spacing: 0.01em; margin: 0;
        }

        /* Feature card */
        .feature-card {
          position: relative; border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 32px;
          transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden; cursor: default;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px; opacity: 0;
          background: radial-gradient(circle at var(--cx,50%) var(--cy,50%), rgba(255,107,53,0.08) 0%, transparent 60%);
          transition: opacity 0.4s ease;
        }
        .feature-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,107,53,0.08);
        }
        .feature-card:hover::before { opacity: 1; }

        .feature-card .card-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 80px; line-height: 1;
          color: rgba(255,107,53,0.06);
          position: absolute; top: 16px; right: 20px;
          pointer-events: none; user-select: none;
          transition: color 0.3s ease;
        }
        .feature-card:hover .card-number { color: rgba(255,107,53,0.12); }

        .icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          position: relative; margin-bottom: 20px;
          background: rgba(255,107,53,0.1);
          border: 1px solid rgba(255,107,53,0.15);
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover .icon-wrap {
          background: rgba(255,107,53,0.15);
          border-color: rgba(255,107,53,0.3);
          box-shadow: 0 0 20px rgba(255,107,53,0.2);
        }

        .card-title {
          font-size: 17px; font-weight: 600; color: var(--text);
          margin: 0 0 10px; letter-spacing: -0.01em;
        }
        .card-desc {
          font-size: 14px; color: var(--text-muted); line-height: 1.65; margin: 0;
          font-weight: 300;
        }

        .card-shine {
          position: absolute; inset: 0; border-radius: 20px; opacity: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
          transition: opacity 0.3s ease;
        }
        .feature-card:hover .card-shine { opacity: 1; }

        /* Stagger animation */
        .stagger-in {
          opacity: 0; transform: translateY(28px);
          animation: fadeUp 0.6s ease forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* CTA */
        .cta-section {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0E0A08 0%, #150F09 50%, #0A0A0F 100%);
          border-top: 1px solid rgba(255,107,53,0.1);
        }
        .cta-bg-glow {
          position: absolute; width: 800px; height: 400px;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: radial-gradient(ellipse, rgba(255,107,53,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 12px;
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
          color: #fff; font-weight: 600; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 24px rgba(255,107,53,0.3);
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(255,107,53,0.45);
        }
        .btn-primary:hover::after { opacity: 1; }

        .btn-secondary {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 32px; border-radius: 12px;
          border: 1px solid rgba(255,107,53,0.25);
          color: var(--text); font-weight: 500; font-size: 15px;
          text-decoration: none;
          background: rgba(255,107,53,0.05);
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          border-color: rgba(255,107,53,0.5);
          background: rgba(255,107,53,0.1);
          transform: translateY(-2px);
        }

        /* Featured card (larger) */
        .feature-card.featured {
          grid-column: span 1;
          background: linear-gradient(135deg, #111118 0%, #130E0B 100%);
        }

        /* Floating tag strip */
        .tag-strip {
          display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;
        }
        .tag {
          font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--orange-mid);
          padding: 4px 10px; border-radius: 6px;
          background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.15);
        }

        /* Divider line */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,107,53,0.3), transparent);
          margin: 0;
        }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{ position: "relative", paddingTop: "140px", paddingBottom: "100px", textAlign: "center" }}
      >
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          <div className="hero-label" style={{ display: "inline-flex" }}>
            <Zap size={12} />
            11 Powerful Capabilities
          </div>

          <h1 className="hero-title">
            BUILT FOR <span className="gradient-word">SPEED</span>
            <br />& SAFETY
          </h1>

          <p className="hero-sub">
            Everything you need for a safe, affordable, and seamless ride-sharing experience—engineered for riders and drivers alike.
          </p>

          {/* Stats */}
          <div className="stats-bar" style={{ marginTop: "48px" }}>
            <div className="stat-item">
              <div className="stat-value">
                <AnimatedCounter target={50} suffix="K+" />
              </div>
              <div className="stat-label">Active Riders</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                <AnimatedCounter target={12} suffix="K+" />
              </div>
              <div className="stat-label">Verified Drivers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                <AnimatedCounter target={99} suffix="%" />
              </div>
              <div className="stat-label">Safety Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                <AnimatedCounter target={11} />
              </div>
              <div className="stat-label">Core Features</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── Features Grid ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ marginBottom: "64px" }}>
            <p className="section-eyebrow">Platform Features</p>
            <h2 className="section-title">WHAT SETS<br />XPOOL APART</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {features.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CTA ── */}
      <section className="cta-section" style={{ padding: "120px 24px" }}>
        <div className="cta-bg-glow" />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <p className="section-eyebrow">Get Started Today</p>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px,8vw,88px)",
              color: "var(--text)",
              lineHeight: 0.95,
              letterSpacing: "0.01em",
              margin: "0 0 24px",
            }}
          >
            SMARTER RIDES
            <br />
            <span style={{ color: "var(--orange)" }}>START HERE</span>
          </h2>

          <p style={{ fontSize: "17px", color: "var(--text-muted)", fontWeight: 300, lineHeight: 1.7, marginBottom: "48px" }}>
            Join thousands who rely on Xpool for safe, reliable, and affordable rides every day.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/download" className="btn-primary">
              Download App
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Become a Driver
            </Link>
          </div>

          <div className="tag-strip" style={{ justifyContent: "center", marginTop: "40px" }}>
            {["Free to Download", "OTP Verified", "24/7 Support", "Secure Payments"].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;

/* ---------------------------------- */
/* Feature Card Component             */
/* ---------------------------------- */

interface FeatureCardProps {
  feature: Feature;
  delay?: number;
}

const FeatureCard = ({ feature, delay = 0 }: FeatureCardProps): JSX.Element => {
  const Icon = feature.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, inView } = useInViewSimple();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--cx", `${cx}%`);
    card.style.setProperty("--cy", `${cy}%`);
  };

  return (
    <div
      ref={(el) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className="feature-card stagger-in"
      onMouseMove={handleMouseMove}
      style={{
        animationDelay: inView ? `${delay}ms` : "9999s",
        animationPlayState: inView ? "running" : "paused",
      }}
    >
      {/* Large ghost number */}
      <span className="card-number">{String(feature.id).padStart(2, "0")}</span>

      {/* Shine layer */}
      <div className="card-shine" />

      {/* Icon */}
      <div className="icon-wrap">
        <Icon size={22} color="var(--orange)" strokeWidth={1.8} />
      </div>

      {/* Content */}
      <h3 className="card-title">{feature.title}</h3>
      <p className="card-desc">{feature.description}</p>
    </div>
  );
};

/* Simple useInView for cards */
function useInViewSimple() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}