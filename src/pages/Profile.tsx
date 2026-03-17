import React, { useState, useEffect, useMemo, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Calendar, Camera,
  ShieldCheck, ArrowLeft, LogOut, ChevronRight, CheckCircle2,
  Sparkles, Zap, Shield,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

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
};

/* ─────────────────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────────────────── */
const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

/* ─────────────────────────────────────────────────────────
   Profile Page
───────────────────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    city: string;
    dob: string;
    picture: string;
    isLoggedIn: boolean;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const isActive = parsed.isLoggedIn || parsed.fullName || parsed.email || parsed.phone;
        if (!isActive) {
          navigate("/");
        } else {
          setProfile(parsed);
        }
      } catch (e) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("profile");
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  const initials = useMemo(() => {
    if (!profile?.fullName) return "?";
    const parts = profile.fullName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }, [profile?.fullName]);

  if (!profile) return null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .profile-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1.5px solid rgba(245,158,11,0.12);
          box-shadow: 0 20px 60px rgba(0,0,0,0.06), 0 4px 16px rgba(245,158,11,0.06);
        }
        .profile-avatar-ring {
          background: linear-gradient(135deg, ${T.orange}, ${T.gold}, ${T.amber});
          padding: 3px;
          border-radius: 9999px;
          box-shadow: 0 4px 24px ${T.orangeGlow}, 0 0 0 4px rgba(255,255,255,0.9);
        }
        .profile-stat-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(245,158,11,0.12);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .profile-stat-card:hover {
          border-color: rgba(245,158,11,0.3);
          box-shadow: 0 8px 24px rgba(245,158,11,0.1);
          transform: translateY(-2px);
        }
        .profile-dot-grid {
          background-image: radial-gradient(rgba(245,158,11,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .profile-divider {
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent);
        }
        .profile-info-row {
          border: 1.5px solid rgba(245,158,11,0.08);
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .profile-info-row:hover {
          border-color: rgba(245,158,11,0.2);
          box-shadow: 0 4px 12px rgba(245,158,11,0.06);
        }
        .profile-activity-row {
          transition: all 0.2s ease;
        }
        .profile-activity-row:hover {
          background: rgba(255,149,0,0.04);
          border-color: rgba(255,149,0,0.15) !important;
        }
        .profile-logout-btn {
          border: 2px solid rgba(255,149,0,0.2);
          color: ${T.orangeDeep};
          background: transparent;
          transition: all 0.3s ease;
        }
        .profile-logout-btn:hover {
          background: ${T.orange};
          color: white;
          border-color: ${T.orange};
          box-shadow: 0 8px 24px ${T.orangeGlow};
        }
      `}</style>

      <main className="pt-[100px] md:pt-[120px] pb-24 px-4 max-w-5xl mx-auto relative">
        {/* Dot grid overlay */}
        <div className="profile-dot-grid absolute inset-0 pointer-events-none" />

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8 cursor-pointer relative z-10"
          onClick={() => navigate(-1)}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-all"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1.5px solid rgba(245,158,11,0.18)",
              color: T.orange,
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold" style={{ color: T.muted }}>Back</span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-8 relative z-10"
        >
          {/* ═══════════════════════════════════════════
              LEFT COLUMN — Profile ID Card
          ═══════════════════════════════════════════ */}
          <motion.div variants={fadeSlide}>
            <div className="profile-card rounded-[28px] p-8 relative overflow-hidden">
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${T.orange}, ${T.gold}, ${T.amber}, ${T.gold}, ${T.orange})` }}
              />

              {/* Dot grid */}
              <div className="profile-dot-grid absolute inset-0 pointer-events-none opacity-30" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Avatar */}
                <div className="mb-6 relative">
                  <div className="profile-avatar-ring">
                    {profile.picture ? (
                      <img
                        src={profile.picture}
                        alt={profile.fullName}
                        className="w-28 h-28 rounded-full object-cover bg-white"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-extrabold"
                        style={{
                          background: `linear-gradient(135deg, ${T.ivory}, #fff)`,
                          color: T.orange,
                        }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  {/* Online dot */}
                  <div
                    className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white"
                    style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
                  />
                  {/* Camera button */}
                  <button
                    className="absolute bottom-1 left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 hover:scale-110 transition-transform"
                    style={{ color: T.orange }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Name & Badge */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-extrabold mb-1 flex items-center justify-center gap-2" style={{ color: T.navy }}>
                    {profile.fullName || "Awesome User"}
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                    style={{
                      background: `linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))`,
                      border: "1px solid rgba(245,158,11,0.2)",
                      color: T.orangeDeep,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Xpool Premium Rider
                  </div>
                </div>

                {/* Divider */}
                <div className="profile-divider w-full h-[1px] mb-6" />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 w-full mb-6">
                  {[
                    { icon: Zap, label: "Rides", value: "0" },
                    { icon: Shield, label: "Since", value: new Date().toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) },
                    { icon: Sparkles, label: "Points", value: "0" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="profile-stat-card rounded-2xl p-3 text-center">
                        <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: T.orange }} />
                        <div className="text-lg font-extrabold" style={{ color: T.navy }}>{stat.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.muted }}>{stat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Account Status */}
                <div
                  className="w-full p-4 rounded-2xl flex items-center gap-4 mb-6"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1.5px solid rgba(245,158,11,0.1)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,158,11,0.1)", color: T.orangeDeep }}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: T.muted }}>Account Status</p>
                    <p className="text-sm font-bold text-green-600">Verified ✓</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="profile-logout-btn w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out Securely
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════
              RIGHT COLUMN — Personal Information
          ═══════════════════════════════════════════ */}
          <motion.div variants={fadeSlide} className="flex flex-col gap-6">
            <div className="profile-card rounded-[28px] p-8 flex-1">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold" style={{ color: T.navy }}>Personal Information</h3>
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(245,158,11,0.1)" }}
                >
                  <User className="w-5 h-5" style={{ color: T.orange }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={<User />} label="Full Name" value={profile.fullName || "Not provided"} />
                <InfoItem icon={<Phone />} label="Phone Number" value={profile.phone ? `+91 ${profile.phone}` : "Not provided"} />
                <InfoItem icon={<Mail />} label="Email Address" value={profile.email || "Not linked"} />
                <InfoItem icon={<MapPin />} label="City" value={profile.city || "Not selected"} />
                <InfoItem icon={<Calendar />} label="Date of Birth" value={
                  profile.dob
                    ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                    : "Not set"
                } />
              </div>

              {/* Divider */}
              <div className="profile-divider w-full h-[1px] my-8" />

              {/* Recent Activity */}
              <h3 className="text-lg font-bold mb-6" style={{ color: T.navy }}>Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { title: "Ride to Tech Park", date: "Coming soon", type: "Sedan" },
                  { title: "Airport Transfer", date: "Coming soon", type: "SUV" },
                ].map((ride, i) => (
                  <div
                    key={i}
                    className="profile-activity-row group p-4 rounded-2xl flex items-center justify-between cursor-pointer"
                    style={{ border: "1.5px solid rgba(245,158,11,0.08)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          background: "rgba(243,244,246,0.7)",
                          border: "1px solid rgba(229,231,235,0.6)",
                        }}
                      >
                        <MapPin className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: T.navy }}>{ride.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: T.muted }}>{ride.date} • {ride.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Info Item Component
───────────────────────────────────────────────────────── */
function InfoItem({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return (
    <div
      className="profile-info-row flex gap-4 items-center p-4 rounded-2xl"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(245,158,11,0.1)",
          color: "#FF9500",
        }}
      >
        {cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#6B7280" }}>{label}</p>
        <p className="font-semibold text-[15px] truncate" style={{ color: "#0A0F1C" }}>{value}</p>
      </div>
    </div>
  );
}
