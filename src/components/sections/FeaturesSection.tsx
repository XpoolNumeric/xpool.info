"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Shield, Star, ArrowRight } from "lucide-react";

/* ─── Brand tokens ────────────────────────────────────────────── */
const CREAM = "#FEF9EE";   // page background
const GOLD = "#E8A000";   // icon colour (default)
const GOLD2 = "#F5C518";   // accent yellow
const ORANGE = "#FF9500";   // new warm orange accent
const NAVY = "#1a1a2e";   // text colour
const IVORY = "#FFF3CD";   // soft icon bg (default)
// Hover palette — warm orange-yellow light (NO dark)
const H_BG = "#FFF8E1";   // card hover bg (very light warm)
const H_BOR = "#FFB300";   // card hover border
const H_ICON = "#FF9500";   // icon colour on hover
const H_IBKG = "#FFE0A0";   // icon bg on hover
const H_TAG = "#FF8C00";   // tag text on hover
const H_TBKG = "rgba(255,149,0,0.14)"; // tag bg on hover
const H_STAT = "#E67E00";   // stat number on hover
const H_ABKG = "#FFB300";   // arrow bg on hover

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

/* ─── FeatureCard ─────────────────────────────────────────────── */
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const { ref, visible } = useInView();
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;
  const T = "0.32s cubic-bezier(0.16,1,0.3,1)";

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 85}ms,
                     transform 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 85}ms`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          borderRadius: 24,
          padding: 28,
          overflow: "hidden",
          /* light warm orange-yellow on hover, white at rest */
          background: hovered ? H_BG : "#FFFFFF",
          border: `2px solid ${hovered ? H_BOR : "rgba(26,26,46,0.09)"}`,
          boxShadow: hovered
            ? "0 12px 40px rgba(255,149,0,0.18), 0 2px 8px rgba(255,149,0,0.10)"
            : "0 2px 14px rgba(0,0,0,0.06)",
          transition: `background ${T}, border-color ${T}, box-shadow ${T}`,
        }}
      >
        {/* Watermark number */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            bottom: -14,
            right: 6,
            fontFamily: "Syne, sans-serif",
            fontWeight: 900,
            fontSize: 100,
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            /* warm orange tint on hover, barely visible grey at rest */
            color: hovered
              ? "rgba(255,149,0,0.11)"
              : "rgba(26,26,46,0.045)",
            transition: `color ${T}`,
            zIndex: 0,
          }}
        >
          {feature.number}
        </span>

        {/* Content layer */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Icon + Tag row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>

            {/* Icon box */}
            <div
              style={{
                width: 52, height: 52,
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                background: hovered ? H_IBKG : IVORY,
                transition: `background ${T}`,
              }}
            >
              <Icon
                size={22}
                strokeWidth={2}
                style={{
                  color: hovered ? H_ICON : GOLD,
                  transition: `color ${T}`,
                }}
              />
            </div>

            {/* Tag pill */}
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono, monospace",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                background: hovered ? H_TBKG : IVORY,
                color: hovered ? H_TAG : "#B07D00",
                transition: `background ${T}, color ${T}`,
              }}
            >
              {feature.tag}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: 22,
              lineHeight: 1.2,
              /* stays navy — readable on light bg */
              color: NAVY,
              marginBottom: 12,
            }}
          >
            {feature.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13.5,
              lineHeight: 1.65,
              color: hovered ? "#6b5a3a" : "#5a5a72",
              marginBottom: 20,
              flex: 1,
              transition: `color ${T}`,
            }}
          >
            {feature.description}
          </p>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: hovered
                ? "rgba(255,149,0,0.22)"
                : "rgba(26,26,46,0.08)",
              marginBottom: 18,
              transition: `background ${T}`,
            }}
          />

          {/* Stat + Arrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  lineHeight: 1,
                  marginBottom: 4,
                  color: hovered ? H_STAT : NAVY,
                  transition: `color ${T}`,
                }}
              >
                {feature.stat}
              </div>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: hovered ? "#b07d30" : "#aaa",
                  transition: `color ${T}`,
                }}
              >
                {feature.statLabel}
              </div>
            </div>

            {/* Arrow circle */}
            <div
              style={{
                width: 40, height: 40,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: hovered ? H_ABKG : IVORY,
                transform: hovered ? "scale(1.1)" : "scale(1)",
                transition: `background ${T}, transform 0.22s`,
              }}
            >
              <ArrowRight
                size={16}
                style={{
                  color: hovered ? "#fff" : GOLD,
                  transition: `color ${T}`,
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── FeaturesSection ─────────────────────────────────────────── */
const FeaturesSection = () => {
  const { ref: headerRef, visible: headerVisible } = useInView(0.15);
  const [btnHov, setBtnHov] = useState(false);

  // Scroll to BookingSection (id="booking-section") on button click
  const handleBookClick = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes xpoolPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          padding: "96px 0 80px",
          background: CREAM,
          overflow: "hidden",
        }}
      >
        {/* Dot-grid */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(26,26,46,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Warm orange-gold glow top */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 420,
            pointerEvents: "none",
            background: "radial-gradient(ellipse, rgba(255,179,0,0.20) 0%, transparent 70%)",
            filter: "blur(52px)",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1160,
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          {/* ── Section header ── */}
          <div
            ref={headerRef}
            style={{
              textAlign: "center",
              marginBottom: 56,
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateY(0)" : "translateY(28px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Live badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 16px",
                borderRadius: 999,
                border: "2px solid rgba(255,179,0,0.45)",
                background: IVORY,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 7, height: 7,
                  borderRadius: "50%",
                  background: ORANGE,
                  animation: "xpoolPulse 1.8s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#B07D00",
                }}
              >
                Everything You Need
              </span>
            </div>

            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(34px, 5vw, 56px)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                color: NAVY,
                marginBottom: 14,
              }}
            >
              Ride Smarter.{" "}
              <span style={{ color: GOLD }}>Every Time.</span>
            </h2>

            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: 17,
                color: "#5a5a72",
                maxWidth: 460,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Four pillars that make Xpool the most trusted ride-sharing
              platform in 30+ cities.
            </p>
          </div>

          {/* ── Cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            {features.map((f, i) => (
              <FeatureCard key={f.number} feature={f} index={i} />
            ))}
          </div>

          {/* ── CTA strip ── */}
          <div
            style={{
              marginTop: 48,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              padding: "22px 30px",
              borderRadius: 22,
              border: "2px solid rgba(255,179,0,0.30)",
              background: `linear-gradient(135deg, ${IVORY} 0%, ${CREAM} 100%)`,
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateY(0)" : "translateY(16px)",
              transition:
                "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 320ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 320ms",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 21,
                  color: NAVY,
                  marginBottom: 4,
                }}
              >
                Ready for your first ride?
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 14,
                  color: "#5a5a72",
                }}
              >
                Join 2 million+ happy riders across 30+ cities.
              </p>
            </div>

            <button
              onClick={handleBookClick}   // 👈 scrolls to BookingSection
              onMouseEnter={() => setBtnHov(true)}
              onMouseLeave={() => setBtnHov(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 26px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                /* warm orange-yellow button — no dark */
                background: btnHov
                  ? "linear-gradient(135deg, #FF9500 0%, #FFB300 100%)"
                  : "linear-gradient(135deg, #FFB300 0%, #FF9500 100%)",
                color: "#1a1a2e",
                boxShadow: btnHov
                  ? "0 10px 32px rgba(255,149,0,0.38)"
                  : "0 4px 18px rgba(255,149,0,0.22)",
                transform: btnHov ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.2s, box-shadow 0.2s, background 0.25s",
              }}
            >
              Book Your Ride
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;