import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import xpoolLogo from "@/assets/xpool-logo.jpeg";

/* ===================== Brand tokens ===================== */
const WHITE = "#FFFFFF";
const GOLD = "#E8A000";
const ORANGE = "#FF9500";
const NAVY = "#1a1a2e";
const IVORY = "#FFF3CD";
const BORDER_LIGHT = "rgba(245, 158, 11, 0.15)";
const BORDER_MEDIUM = "rgba(245, 158, 11, 0.25)";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Home", to: "/" },
    { label: "How it Works", to: "/how-it-works" },
    { label: "Features", to: "/features" },
    { label: "Download", to: "/download" },
    { label: "Contact", to: "/contact" },
  ];

  const handleNavClick = (to: string) => {
    setIsOpen(false);
    if (to.startsWith("#")) {
      const el = document.querySelector(to);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: WHITE, // solid white background
        borderBottom: `1px solid ${BORDER_LIGHT}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={xpoolLogo}
              alt="Xpool Logo"
              style={{
                height: 32,
                width: 32,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: NAVY,
                letterSpacing: "-0.02em",
              }}
            >
              Xpool
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) =>
              item.to.startsWith("#") ? (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.to)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    color: NAVY,
                    transition: "color 0.2s",
                  }}
                  className="hover:text-amber-600"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  replace
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: location.pathname === item.to ? 600 : 500,
                    fontSize: "0.95rem",
                    color: location.pathname === item.to ? ORANGE : NAVY,
                    transition: "color 0.2s",
                  }}
                  className="hover:text-amber-600"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              style={{
                borderColor: BORDER_MEDIUM,
                backgroundColor: WHITE,
                color: NAVY,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                borderRadius: 999,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = IVORY;
                e.currentTarget.style.borderColor = ORANGE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WHITE;
                e.currentTarget.style.borderColor = BORDER_MEDIUM;
              }}
            >
              <Phone className="h-4 w-4" style={{ color: ORANGE }} />
              Support
            </Button>
            <Button
              size="sm"
              className="gap-2"
              style={{
                background: `linear-gradient(135deg, ${ORANGE} 0%, #FFB300 100%)`,
                border: "none",
                color: NAVY,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                borderRadius: 999,
                boxShadow: "0 4px 14px rgba(255,149,0,0.25)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,149,0,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,149,0,0.25)";
              }}
            >
              <Download className="h-4 w-4" style={{ color: NAVY }} />
              Download App
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{
              background: "transparent",
              border: `1px solid ${BORDER_LIGHT}`,
              borderRadius: 12,
              color: NAVY,
            }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          style={{
            overflow: "hidden",
            transition: "max-height 0.3s ease, opacity 0.2s ease",
            maxHeight: isOpen ? 400 : 0,
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div
            style={{
              padding: "1rem 0",
              borderTop: `1px solid ${BORDER_LIGHT}`,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {navItems.map((item) =>
              item.to.startsWith("#") ? (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.to)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: "1rem",
                    color: NAVY,
                    textAlign: "left",
                    padding: "8px 0",
                  }}
                  className="hover:text-amber-600"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  replace
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: location.pathname === item.to ? 600 : 500,
                    fontSize: "1rem",
                    color: location.pathname === item.to ? ORANGE : NAVY,
                    display: "block",
                    padding: "8px 0",
                  }}
                  className="hover:text-amber-600"
                >
                  {item.label}
                </Link>
              )
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                style={{
                  borderColor: BORDER_MEDIUM,
                  backgroundColor: WHITE,
                  color: NAVY,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  borderRadius: 999,
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = IVORY;
                  e.currentTarget.style.borderColor = ORANGE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = WHITE;
                  e.currentTarget.style.borderColor = BORDER_MEDIUM;
                }}
              >
                <Phone className="h-4 w-4" style={{ color: ORANGE }} />
                Support
              </Button>
              <Button
                size="sm"
                className="w-full gap-2"
                style={{
                  background: `linear-gradient(135deg, ${ORANGE} 0%, #FFB300 100%)`,
                  border: "none",
                  color: NAVY,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  borderRadius: 999,
                  justifyContent: "center",
                }}
              >
                <Download className="h-4 w-4" style={{ color: NAVY }} />
                Download App
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;