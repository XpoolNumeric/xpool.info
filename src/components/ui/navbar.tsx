import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Download, Menu, X, Sparkles, ChevronRight, LogOut, User } from "lucide-react";
import xpoolLogo from "@/assets/xpool-logo.jpeg";

/* ─────────────────────────────────────────────────────────
   Design Tokens
───────────────────────────────────────────────────────── */
const T = {
  navy: "#0A0F1C",
  navyMid: "#111827",
  orange: "#FF9500",
  orangeDeep: "#E07800",
  orangeGlow: "rgba(255,149,0,0.22)",
  gold: "#FFBA00",
  amber: "#FFD060",
  white: "#FFFFFF",
  ivory: "#FFF8ED",
  muted: "#6B7280",
  border: "rgba(229,231,235,0.55)",
  borderHover: "rgba(255,149,0,0.35)",
};

/* ─────────────────────────────────────────────────────────
   Nav Items
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Home", to: "/", icon: "●", badge: false },
  { label: "How it Works", to: "/how-it-works", icon: "◆", badge: false },
  { label: "Features", to: "/features", icon: "▲", badge: false },
  { label: "Verify Docs", to: "/verify", icon: "✓", badge: true },
  { label: "Download", to: "/download", icon: "⬇", badge: false },
  { label: "Contact", to: "/contact", icon: "◉", badge: false },
];

/* ─────────────────────────────────────────────────────────
   Scroll Progress Bar
───────────────────────────────────────────────────────── */
const ScrollProgress = () => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${T.orange}, ${T.gold}, ${T.amber})`,
          boxShadow: `0 0 12px ${T.orange}88`,
          transition: "width 0.08s linear",
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Active Pip
───────────────────────────────────────────────────────── */
const ActivePip = () => (
  <span
    style={{
      display: "inline-block",
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${T.amber} 0%, ${T.orange} 100%)`,
      boxShadow: `0 0 8px ${T.orange}, 0 0 16px ${T.orangeGlow}`,
      marginRight: 6,
      animation: "pipPulse 2s ease-in-out infinite",
      flexShrink: 0,
    }}
  />
);

/* ─────────────────────────────────────────────────────────
   New Badge (enhanced for better visibility)
───────────────────────────────────────────────────────── */
const NewBadge = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 999,
      background: `linear-gradient(135deg, ${T.orange}60, ${T.gold}70)`,
      border: `1px solid ${T.orange}`,
      fontSize: "0.6rem",
      fontWeight: 800,
      letterSpacing: "0.1em",
      color: T.navy,
      textTransform: "uppercase" as const,
      fontFamily: "'DM Sans', sans-serif",
      marginLeft: 6,
      boxShadow: `0 2px 6px ${T.orange}40`,
      animation: "badgePop 3s ease-in-out infinite",
    }}
  >
    New
  </span>
);

/* ─────────────────────────────────────────────────────────
   Desktop NavLink
───────────────────────────────────────────────────────── */
interface NavLinkProps {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick?: () => void;
}

const NavLink = ({ item, isActive, onClick }: NavLinkProps) => {
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
        fontWeight: isActive ? 700 : 500,
        fontSize: "0.875rem",
        letterSpacing: "0.015em",
        color: isActive ? T.orange : hovered ? T.navyMid : T.muted,
        textDecoration: "none",
        padding: "6px 4px",
        transition: "color 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {isActive && (
        <span
          style={{
            position: "absolute",
            inset: "0 -8px",
            borderRadius: 8,
            background: `radial-gradient(ellipse at 50% 100%, ${T.orangeGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      {isActive && <ActivePip />}
      {item.label}
      {item.badge && <NewBadge />}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1.5,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${T.orange}, ${T.gold})`,
          transform: isActive || hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 6px ${T.orange}88`,
        }}
      />
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
   Logo (with swapped colors)
───────────────────────────────────────────────────────── */
interface LogoProps {
  small?: boolean;
  mobileStyle?: boolean;
  onClick?: () => void;
}

const Logo = ({ small = false, mobileStyle = false, onClick }: LogoProps) => {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const updateName = () => {
      const storedProfile = localStorage.getItem("profile");
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          if (profile.fullName) {
            const first = profile.fullName.trim().split(" ")[0];
            setFirstName(first.charAt(0).toUpperCase() + first.slice(1).toLowerCase());
          } else {
            setFirstName("");
          }
        } catch (e) {
          setFirstName("");
        }
      } else {
        setFirstName("");
      }
    };

    updateName();
    window.addEventListener("storage", updateName);
    const interval = setInterval(updateName, 2000);
    return () => {
      window.removeEventListener("storage", updateName);
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      to="/"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: small ? 8 : 10,
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: small ? 28 : 36,
          height: small ? 28 : 36,
          borderRadius: small ? 8 : 10,
          overflow: "hidden",
          boxShadow: `0 2px 12px ${T.orange}40, 0 0 0 1px ${T.orange}20`,
          flexShrink: 0,
        }}
      >
        <img
          src={xpoolLogo}
          alt="Xpool logo"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 2,
            left: 3,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.35)",
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: small ? "1.15rem" : "1.4rem",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          userSelect: "none" as const,
        }}
      >
        {firstName ? (
          <span style={{ color: mobileStyle ? T.navy : T.navy }}>Hi, {firstName}</span>
        ) : (
          <>
            <span style={{ color: mobileStyle ? T.navy : T.orange }}>X</span>
            <span style={{ color: mobileStyle ? "#FFD700" : T.navy }}>pool</span>
          </>
        )}
      </span>
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
   Support Button – now a clickable tel link
───────────────────────────────────────────────────────── */
const SupportButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="tel:+917904790007"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "9px 20px",
        borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.83rem",
        letterSpacing: "0.01em",
        color: hovered ? T.orange : "#374151",
        background: hovered ? T.ivory : T.white,
        border: `1.5px solid ${hovered ? T.borderHover : T.border}`,
        cursor: "pointer",
        transition: "all 0.22s ease",
        width: fullWidth ? "100%" : "auto",
        whiteSpace: "nowrap" as const,
        boxShadow: hovered ? `0 0 0 3px ${T.orangeGlow}` : "none",
        textDecoration: "none",
      }}
    >
      <Phone
        style={{
          width: 14,
          height: 14,
          color: T.orange,
          transition: "transform 0.2s ease",
          transform: hovered ? "rotate(-15deg) scale(1.1)" : "rotate(0deg) scale(1)",
          flexShrink: 0,
        }}
      />
      Support
    </a>
  );
};

/* ─────────────────────────────────────────────────────────
   Download Button – now a Link to /download
───────────────────────────────────────────────────────── */
const DownloadButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to="/download"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "9px 22px",
        borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 800,
        fontSize: "0.83rem",
        letterSpacing: "0.02em",
        color: T.navy,
        background: hovered
          ? `linear-gradient(135deg, ${T.orangeDeep} 0%, #F0A000 100%)`
          : `linear-gradient(135deg, ${T.orange} 0%, ${T.gold} 100%)`,
        border: "none",
        boxShadow: hovered
          ? `0 8px 30px ${T.orange}55, 0 0 0 3px ${T.orangeGlow}, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 4px 16px ${T.orange}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        cursor: "pointer",
        transform: hovered ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        width: fullWidth ? "100%" : "auto",
        whiteSpace: "nowrap" as const,
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          backgroundPosition: hovered ? "100% 0" : "-100% 0",
          transition: "background-position 0.55s ease",
          borderRadius: 999,
          pointerEvents: "none",
        }}
      />
      <Download
        style={{
          width: 14,
          height: 14,
          color: T.navy,
          flexShrink: 0,
          position: "relative",
        }}
      />
      <span style={{ position: "relative" }}>Download App</span>
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
   Profile Button
───────────────────────────────────────────────────────── */
const ProfileButton = ({ profile, fullWidth = false }: { profile: any, fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  const picture = profile?.picture;
  const initial = profile?.fullName?.charAt(0)?.toUpperCase() || "U";
  return (
    <Link
      to="/profile"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "4px 14px 4px 4px",
        borderRadius: 999,
        background: hovered ? T.ivory : T.white,
        border: `1.5px solid ${hovered ? T.borderHover : T.border}`,
        boxShadow: hovered ? `0 0 0 3px ${T.orangeGlow}` : "none",
        textDecoration: "none",
        transition: "all 0.22s ease",
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: `linear-gradient(135deg, ${T.orange}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontWeight: "bold", fontSize: "0.85rem" }}>
        {picture ? <img src={picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: T.navy }}>Profile</span>
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
   Logout Button
───────────────────────────────────────────────────────── */
const LogoutButton = ({ onLogout, fullWidth = false }: { onLogout: () => void, fullWidth?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onLogout}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "9px 16px",
        borderRadius: 999,
        background: hovered ? "rgba(239, 68, 68, 0.05)" : "transparent",
        border: `1.5px solid ${hovered ? "rgba(239, 68, 68, 0.4)" : "transparent"}`,
        textDecoration: "none",
        transition: "all 0.22s ease",
        color: hovered ? "rgb(239, 68, 68)" : T.muted,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.85rem",
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
      }}
    >
      <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
      Logout
    </button>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Navbar
───────────────────────────────────────────────────────── */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hideBar, setHideBar] = useState(false);
  const [mouseX, setMouseX] = useState(0.5);
  const [profile, setProfile] = useState<any>(null);
  const lastScrollY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const updateProfile = () => {
      const stored = localStorage.getItem("profile");
      if (stored) {
        try {
          const p = JSON.parse(stored);
          // Support older sessions where isLoggedIn wasn't set explicitly
          const isActive = p.isLoggedIn || p.fullName || p.email || p.phone;
          setProfile(isActive ? p : null);
        } catch { setProfile(null); }
      } else { setProfile(null); }
    };
    updateProfile();
    window.addEventListener("storage", updateProfile);
    return () => window.removeEventListener("storage", updateProfile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("profile");
    window.dispatchEvent(new Event("storage"));
    setProfile(null);
  };

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHideBar(y > lastScrollY.current && y > 90);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => setMouseX(e.clientX / window.innerWidth);
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const glowX = 20 + mouseX * 60;

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
          zIndex: 1000,
          transform: hideBar && !isOpen ? "translateY(-110%)" : "translateY(0)",
          transition:
            "transform 0.38s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, box-shadow 0.3s ease",
          background: scrolled ? "rgba(255,255,255,0.90)" : T.white,
          backdropFilter: scrolled ? "blur(20px) saturate(200%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(200%)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(255,149,0,0.12)" : T.border}`,
          boxShadow: scrolled
            ? "0 4px 40px rgba(15,22,35,0.08), 0 1px 0 rgba(255,149,0,0.08)"
            : "none",
        }}
      >
        {/* Mouse-tracking top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent ${glowX - 25}%, ${T.orange} ${glowX}%, ${T.gold} ${glowX + 15}%, transparent ${glowX + 40}%)`,
            opacity: scrolled ? 1 : 0.45,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: scrolled ? 60 : 68,
              transition: "height 0.3s ease",
            }}
          >
            {/* Logo */}
            <Logo />

            {/* Desktop Nav */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 28 }}>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  isActive={location.pathname === item.to}
                />
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 10 }}>
              {profile ? (
                <>
                  <ProfileButton profile={profile} />
                  <LogoutButton onLogout={handleLogout} />
                </>
              ) : (
                <>
                  <SupportButton />
                  <DownloadButton />
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="navbar-hamburger md:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                borderRadius: 12,
                border: `1.5px solid ${isOpen ? T.orange + "70" : T.border}`,
                background: isOpen
                  ? `linear-gradient(135deg, ${T.ivory}, rgba(255,149,0,0.06))`
                  : "transparent",
                color: isOpen ? T.orange : T.navy,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                boxShadow: isOpen ? `0 0 0 3px ${T.orangeGlow}` : "none",
                flexShrink: 0,
              }}
            >
              {isOpen
                ? <X style={{ width: 18, height: 18 }} />
                : <Menu style={{ width: 18, height: 18 }} />
              }
            </button>
          </div>
        </div>

        <ScrollProgress />
      </nav>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(10,15,28,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* ── Mobile Drawer ── */}
      <div
        className="md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          width: "min(340px, 92vw)",
          background: T.white,
          boxShadow:
            "-12px 0 60px rgba(10,15,28,0.22), -1px 0 0 rgba(255,149,0,0.1)",
          transform: isOpen ? "translateX(0)" : "translateX(105%)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            background: `radial-gradient(circle at top right, ${T.orange}12, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 18px",
            borderBottom: "1px solid rgba(229,231,235,0.5)",
          }}
        >
          <Logo small mobileStyle onClick={() => setIsOpen(false)} />
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1.5px solid ${T.border}`,
              background: "transparent",
              color: T.navy,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Section label */}
        <div
          style={{
            padding: "16px 24px 4px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: T.muted,
          }}
        >
          Navigation
        </div>

        {/* Links */}
        <nav style={{ padding: "4px 16px", flex: 1 }}>
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
                  justifyContent: "space-between",
                  padding: "13px 14px",
                  borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.93rem",
                  color: isActive ? T.orange : T.navy,
                  background: isActive
                    ? `linear-gradient(135deg, ${T.ivory}, rgba(255,149,0,0.05))`
                    : "transparent",
                  border: `1px solid ${isActive ? T.orange + "28" : "transparent"}`,
                  textDecoration: "none",
                  marginBottom: 3,
                  transition: "all 0.2s ease",
                  animation: isOpen
                    ? `mobileSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.055 + 0.12}s both`
                    : "none",
                  boxShadow: isActive ? `0 2px 12px ${T.orange}18` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive
                        ? `linear-gradient(135deg, ${T.orange}22, ${T.gold}22)`
                        : "rgba(243,244,246,0.7)",
                      border: `1px solid ${isActive ? T.orange + "33" : "rgba(229,231,235,0.6)"}`,
                      fontSize: "0.65rem",
                      color: isActive ? T.orange : T.muted,
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>
                    {item.label}
                    {item.badge && <NewBadge />}
                  </span>
                </div>
                <ChevronRight
                  style={{
                    width: 15,
                    height: 15,
                    color: isActive ? T.orange : "rgba(156,163,175,0.5)",
                    transform: isActive ? "translateX(2px)" : "translateX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </Link>
            );
          })}
        </nav>

        {/* App info strip */}
        <div
          style={{
            margin: "8px 16px",
            padding: "14px 16px",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${T.orange}0A, ${T.gold}14)`,
            border: `1px solid ${T.orange}22`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Sparkles style={{ width: 16, height: 16, color: T.orange, flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: T.navy,
                marginBottom: 1,
              }}
            >
              Xpool app is launching soon!!
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.72rem",
                color: T.muted,
              }}
            >
              New features &amp; performance boost
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div
          style={{
            padding: "14px 20px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: `1px solid ${T.border}`,
            marginTop: 8,
          }}
        >
          {profile ? (
            <>
              <ProfileButton profile={profile} fullWidth />
              <LogoutButton onLogout={() => { handleLogout(); setIsOpen(false); }} fullWidth />
            </>
          ) : (
            <>
              <SupportButton fullWidth />
              <DownloadButton fullWidth />
            </>
          )}
        </div>
      </div>

      {/* ── Global Keyframes ── */}
      <style>{`
        @keyframes pipPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.65; transform: scale(0.72); }
        }
        @keyframes badgePop {
          0%, 90%, 100% { transform: scale(1); }
          95%            { transform: scale(1.12); }
        }
        @keyframes mobileSlideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @media (min-width: 768px) {
          .navbar-hamburger { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;