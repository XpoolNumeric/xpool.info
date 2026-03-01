import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Download, ChevronDown } from "lucide-react";
import xpoolLogo from "@/assets/xpool-logo.jpeg";

/* ─────────────────────────────────────────
   Design Tokens
───────────────────────────────────────── */
const TOKENS = {
  navy: "#0F1623",
  navyLight: "#1a2438",
  orange: "#FF9500",
  orangeDark: "#E07800",
  gold: "#E8A000",
  yellow: "#FFD700",          // added for mobile X
  white: "#FFFFFF",
  offWhite: "#FAFAF8",
  ivory: "#FFF8ED",
  glass: "rgba(255,255,255,0.82)",
  glassBorder: "rgba(255,149,0,0.14)",
  shadow: "0 4px 32px rgba(15,22,35,0.08), 0 1px 4px rgba(255,149,0,0.06)",
  shadowHover: "0 8px 48px rgba(15,22,35,0.12), 0 2px 8px rgba(255,149,0,0.10)",
};

/* ─────────────────────────────────────────
   Nav Items
───────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "How it Works", to: "/how-it-works" },
  { label: "Features", to: "/features" },
  { label: "Download", to: "/download" },
  { label: "Contact", to: "/contact" },
];

/* ─────────────────────────────────────────
   Animated NavLink
───────────────────────────────────────── */
const NavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[0];
  isActive: boolean;
  onClick?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={item.to}
      replace
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: isActive ? 600 : 500,
        fontSize: "0.875rem",
        letterSpacing: "0.01em",
        color: isActive ? TOKENS.orange : hovered ? TOKENS.navyLight : "#4B5563",
        textDecoration: "none",
        padding: "4px 2px",
        transition: "color 0.2s ease",
        display: "inline-block",
      }}
    >
      {item.label}

      {/* Underline indicator */}
      <span
        style={{
          position: "absolute",
          bottom: -2,
          left: 0,
          right: 0,
          height: 2,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${TOKENS.orange}, ${TOKENS.gold})`,
          transform: isActive || hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </Link>
  );
};

/* ─────────────────────────────────────────
   Pill Badge
───────────────────────────────────────── */
const NewBadge = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 6px",
      borderRadius: 999,
      background: `linear-gradient(135deg, ${TOKENS.orange}22, ${TOKENS.gold}33)`,
      border: `1px solid ${TOKENS.orange}44`,
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: TOKENS.orangeDark,
      textTransform: "uppercase",
      fontFamily: "'DM Sans', sans-serif",
      marginLeft: 6,
      verticalAlign: "middle",
    }}
  >
    New
  </span>
);

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────── */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hideBar, setHideBar] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  /* Smart hide-on-scroll */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      setHideBar(y > lastScrollY.current && y > 80);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleNavClick = (to: string) => {
    setIsOpen(false);
    if (to.startsWith("#")) {
      document.querySelector(to)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ── Main Bar ── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: hideBar && !isOpen ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, box-shadow 0.3s ease",
          background: scrolled ? TOKENS.glass : TOKENS.white,
          backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
          borderBottom: `1px solid ${scrolled ? TOKENS.glassBorder : "rgba(229,231,235,0.6)"}`,
          boxShadow: scrolled ? TOKENS.shadow : "none",
        }}
      >
        {/* Thin accent line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${TOKENS.orange} 30%, ${TOKENS.gold} 70%, transparent 100%)`,
            opacity: scrolled ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: scrolled ? 60 : 68,
              transition: "height 0.3s ease",
            }}
          >
            {/* ── Logo – always on the left ── */}
            <Link
              to="/"
              className="navbar-logo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: `0 2px 10px ${TOKENS.orange}30`,
                }}
              >
                <img
                  src={xpoolLogo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                <span className="logo-x" style={{ color: TOKENS.navy }}>X</span>
                <span className="logo-pool" style={{ color: TOKENS.orange }}>pool</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div
              className="hidden md:flex"
              style={{ alignItems: "center", gap: 32 }}
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  isActive={location.pathname === item.to}
                  onClick={() => handleNavClick(item.to)}
                />
              ))}
            </div>

            {/* ── Desktop CTA Buttons ── */}
            <div
              className="hidden md:flex"
              style={{ alignItems: "center", gap: 10 }}
            >
              <SupportButton />
              <DownloadButton />
            </div>

            {/* ── Mobile Hamburger – stays on the right, hidden on desktop via CSS ── */}
            <button
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className="navbar-hamburger md:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1.5px solid ${isOpen ? TOKENS.orange + "60" : "rgba(229,231,235,0.8)"}`,
                background: isOpen ? TOKENS.ivory : "transparent",
                color: TOKENS.navy,
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              {isOpen
                ? <X style={{ width: 20, height: 20 }} />
                : <Menu style={{ width: 20, height: 20 }} />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer Overlay ── */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 98,
          background: "rgba(15,22,35,0.35)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── Mobile Drawer Panel ── */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
          width: "min(320px, 90vw)",
          background: TOKENS.white,
          boxShadow: "-8px 0 48px rgba(15,22,35,0.18)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: `1px solid rgba(229,231,235,0.6)`,
          }}
        >
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          >
            <img
              src={xpoolLogo}
              alt=""
              style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.2rem",
                letterSpacing: "-0.03em",
              }}
            >
              <span className="logo-x" style={{ color: TOKENS.navy }}>X</span>
              <span className="logo-pool" style={{ color: TOKENS.orange }}>pool</span>
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid rgba(229,231,235,0.8)",
              background: "transparent",
              color: TOKENS.navy,
              cursor: "pointer",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div style={{ padding: "12px 16px", flex: 1 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                replace
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 12px",
                  borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.95rem",
                  color: isActive ? TOKENS.orange : TOKENS.navy,
                  background: isActive ? TOKENS.ivory : "transparent",
                  textDecoration: "none",
                  marginBottom: 2,
                  transition: "background 0.15s ease, color 0.15s ease",
                  animation: isOpen ? `slideIn 0.3s ease ${i * 0.04 + 0.1}s both` : "none",
                }}
              >
                {/* Active dot */}
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: isActive ? TOKENS.orange : "transparent",
                    border: `1.5px solid ${isActive ? TOKENS.orange : "rgba(156,163,175,0.5)"}`,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                />
                {item.label}
                {item.label === "Download" && <NewBadge />}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer CTAs */}
        <div
          style={{
            padding: "16px 24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid rgba(229,231,235,0.6)",
          }}
        >
          <SupportButton fullWidth />
          <DownloadButton fullWidth />
        </div>
      </div>

      {/* Keyframe animation and responsive overrides */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* 🔧 Force hamburger to be hidden on desktop (screens ≥ 768px) */
        @media (min-width: 768px) {
          .navbar-hamburger {
            display: none !important;
          }
        }

        /* Mobile-only adjustments – logo colours */
        @media (max-width: 768px) {
          .logo-x {
            color: ${TOKENS.yellow} !important;
          }
          .logo-pool {
            color: ${TOKENS.navy} !important;
          }
        }
      `}</style>
    </>
  );
};

/* ─────────────────────────────────────────
   Reusable CTA Buttons
───────────────────────────────────────── */
const SupportButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "8px 18px",
        borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.85rem",
        color: hovered ? TOKENS.orange : TOKENS.navy,
        background: hovered ? TOKENS.ivory : TOKENS.white,
        border: `1.5px solid ${hovered ? TOKENS.orange + "80" : "rgba(209,213,219,0.8)"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        width: fullWidth ? "100%" : "auto",
        whiteSpace: "nowrap",
      }}
    >
      <Phone
        style={{
          width: 15,
          height: 15,
          color: TOKENS.orange,
          flexShrink: 0,
        }}
      />
      Support
    </button>
  );
};

const DownloadButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "8px 20px",
        borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: TOKENS.navy,
        background: hovered
          ? `linear-gradient(135deg, ${TOKENS.orangeDark} 0%, #F0A000 100%)`
          : `linear-gradient(135deg, ${TOKENS.orange} 0%, ${TOKENS.gold} 100%)`,
        border: "none",
        boxShadow: hovered
          ? "0 8px 28px rgba(255,149,0,0.40)"
          : "0 3px 14px rgba(255,149,0,0.28)",
        cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.2s ease",
        width: fullWidth ? "100%" : "auto",
        whiteSpace: "nowrap",
      }}
    >
      <Download
        style={{
          width: 15,
          height: 15,
          color: TOKENS.navy,
          flexShrink: 0,
        }}
      />
      Download App
    </button>
  );
};

export default Navbar;