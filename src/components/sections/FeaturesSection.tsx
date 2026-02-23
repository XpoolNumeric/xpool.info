"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Shield, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/* ===================== Injected Styles (professional font stack) ===================== */
const featureStyles = `
  .features-section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .feature-card {
    background: #FFFFFF;
    border: 2px solid rgba(245, 158, 11, 0.08);
    border-radius: 24px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 16px rgba(0,0,0,0.02);
  }
  .feature-card:hover {
    background: #FFFBEB;
    border-color: #f59e0b;
    box-shadow: 0 12px 40px rgba(245,158,11,0.15), 0 2px 8px rgba(245,158,11,0.1);
    transform: translateY(-4px);
  }

  .feature-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFF3CD;
    transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-icon-box {
    background: #FFE0A0;
  }
  .feature-icon {
    color: #f59e0b;
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-icon {
    color: #FF9500;
  }

  .feature-tag {
    font-family: 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Consolas', 'Courier New', monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    background: #FFF3CD;
    color: #B07D00;
    transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-tag {
    background: rgba(255,149,0,0.14);
    color: #FF8C00;
  }

  .feature-title {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-weight: 700;
    font-size: 22px;
    line-height: 1.2;
    color: #1a1a2e;
    margin-bottom: 12px;
  }

  .feature-desc {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13.5px;
    line-height: 1.65;
    color: #5a5a72;
    margin-bottom: 20px;
    flex: 1;
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-desc {
    color: #6b5a3a;
  }

  .feature-divider {
    height: 1px;
    background: rgba(26,26,46,0.08);
    margin-bottom: 18px;
    transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-divider {
    background: rgba(255,149,0,0.22);
  }

  .feature-stat {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-weight: 700;
    font-size: 26px;
    line-height: 1;
    margin-bottom: 4px;
    color: #1a1a2e;
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-stat {
    color: #E67E00;
  }

  .feature-stat-label {
    font-family: 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Consolas', 'Courier New', monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #aaa;
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-stat-label {
    color: #b07d30;
  }

  .feature-arrow {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFF3CD;
    transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s ease;
  }
  .feature-card:hover .feature-arrow {
    background: #FFB300;
    transform: scale(1.1);
  }
  .feature-arrow svg {
    color: #f59e0b;
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .feature-card:hover .feature-arrow svg {
    color: #FFFFFF;
  }

  .feature-watermark {
    position: absolute;
    bottom: -14px;
    right: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-weight: 800;
    font-size: 100px;
    line-height: 1;
    user-select: none;
    pointer-events: none;
    color: rgba(26,26,46,0.045);
    transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 0;
  }
  .feature-card:hover .feature-watermark {
    color: rgba(255,149,0,0.11);
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 999px;
    border: 2px solid rgba(245,158,11,0.45);
    background: #FFF3CD;
    margin-bottom: 22px;
  }
  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f59e0b;
    animation: pulse 1.8s ease-in-out infinite;
    display: inline-block;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .cta-strip {
    margin-top: 48px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 30px;
    border-radius: 22px;
    border: 2px solid rgba(245,158,11,0.3);
    background: linear-gradient(135deg, #FFF3CD 0%, #FEF9EE 100%);
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 26px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-weight: 600;
    font-size: 14px;
    background: linear-gradient(135deg, #FFB300 0%, #FF9500 100%);
    color: #1a1a2e;
    box-shadow: 0 4px 18px rgba(255,149,0,0.22);
    transition: transform 0.2s, box-shadow 0.2s, background 0.25s;
  }
  .cta-button:hover {
    background: linear-gradient(135deg, #FF9500 0%, #FFB300 100%);
    box-shadow: 0 10px 32px rgba(255,149,0,0.38);
    transform: scale(1.05);
  }

  .heading-professional {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .body-professional {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
`;

/* ─── useInView ───────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Feature Data ────────────────────────────────────────────── */
const features = [
  {
    icon: MapPin,
    tag: "Navigation",
    number: "01",
    title: "Real-time Tracking",
    description:
      "Live GPS updates every second. Watch your driver move on the map and know exactly when they'll arrive — no guessing.",
    stat: "< 1s",
    statLabel: "Update Interval",
  },
  {
    icon: Clock,
    tag: "Speed",
    number: "02",
    title: "Quick Booking",
    description:
      "From open app to confirmed ride in under 3 taps. Our streamlined flow removes every unnecessary step from your journey.",
    stat: "3 taps",
    statLabel: "To Book a Ride",
  },
  {
    icon: Shield,
    tag: "Safety",
    number: "03",
    title: "Secure & Safe",
    description:
      "100% verified drivers, encrypted payments, and a live safety team watching around the clock — every single ride.",
    stat: "100%",
    statLabel: "Verified Drivers",
  },
  {
    icon: Star,
    tag: "Quality",
    number: "04",
    title: "Top Rated",
    description:
      "4.8★ average across 2 million+ rides. Our riders don't settle — and neither do we.",
    stat: "4.8★",
    statLabel: "Avg. Rating",
  },
];

/* ─── FeatureCard Component ──────────────────────────────────── */
const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const { ref, visible } = useInView();
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.085, ease: [0.16, 1, 0.3, 1] }}
      className="feature-card"
      style={{ position: "relative", padding: 28, overflow: "hidden" }}
    >
      {/* Watermark */}
      <span className="feature-watermark" aria-hidden>
        {feature.number}
      </span>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Icon + Tag row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="feature-icon-box">
            <Icon size={22} strokeWidth={2} className="feature-icon" />
          </div>
          <span className="feature-tag">{feature.tag}</span>
        </div>

        <h3 className="feature-title">{feature.title}</h3>
        <p className="feature-desc">{feature.description}</p>

        <div className="feature-divider" />

        {/* Stat + Arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="feature-stat">{feature.stat}</div>
            <div className="feature-stat-label">{feature.statLabel}</div>
          </div>
          <div className="feature-arrow">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── FeaturesSection ─────────────────────────────────────────── */
const FeaturesSection = () => {
  const { ref: headerRef, visible: headerVisible } = useInView(0.15);

  const handleBookClick = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{featureStyles}</style>

      <section className="features-section" style={{
        position: "relative",
        padding: "96px 0 80px",
        background: "#FEF9EE",
        overflow: "hidden",
      }}>
        {/* Dot grid background */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(26,26,46,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        {/* Warm orange-gold glow */}
        <div aria-hidden style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 420,
          pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(255,179,0,0.20) 0%, transparent 70%)",
          filter: "blur(52px)",
        }} />

        <div style={{
          position: "relative",
          maxWidth: 1160,
          margin: "0 auto",
          padding: "0 20px",
        }}>
          {/* Section Header */}
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 28 }}
            animate={headerVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            {/* Live badge */}
            <div className="live-badge">
              <span className="live-dot" />
              <span style={{
                fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Consolas', 'Courier New', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#B07D00",
              }}>
                Everything You Need
              </span>
            </div>

            <h2 style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: "#1a1a2e",
              marginBottom: 14,
            }}>
              Ride Smarter. <span style={{ color: "#f59e0b" }}>Every Time.</span>
            </h2>

            <p style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: 17,
              color: "#5a5a72",
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.6,
            }}>
              Four pillars that make Xpool the most trusted ride-sharing platform in 30+ cities.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}>
            {features.map((f, i) => (
              <FeatureCard key={f.number} feature={f} index={i} />
            ))}
          </div>

          {/* CTA Strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="cta-strip"
          >
            <div>
              <p style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: 21,
                color: "#1a1a2e",
                marginBottom: 4,
              }}>
                Ready for your first ride?
              </p>
              <p style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontSize: 14,
                color: "#5a5a72",
              }}>
                Join 2 million+ happy riders across 30+ cities.
              </p>
            </div>

            <button onClick={handleBookClick} className="cta-button">
              Book Your Ride
              <ArrowRight size={15} />
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;