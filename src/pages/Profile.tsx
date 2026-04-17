import React, { useState, useEffect, useMemo, useCallback, useRef, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Calendar, Camera, ImagePlus,
  ShieldCheck, ArrowLeft, LogOut, ChevronRight, CheckCircle2,
  Sparkles, Zap, Shield, X, Loader2, Upload,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProfileSummaryDialog from "@/components/sections/ProfileSummaryDialog";

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
   Default Male Avatar SVG (inline data URI)
───────────────────────────────────────────────────────── */
const DEFAULT_MALE_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="64" fill="#FEF3C7"/>
  <circle cx="64" cy="48" r="22" fill="#F59E0B"/>
  <path d="M64 76c-24 0-40 14-40 32v4h80v-4c0-18-16-32-40-32z" fill="#F59E0B"/>
  <circle cx="64" cy="48" r="18" fill="#FDE68A"/>
  <ellipse cx="64" cy="46" rx="12" ry="14" fill="#FBBF24"/>
  <circle cx="57" cy="44" r="2" fill="#92400E"/>
  <circle cx="71" cy="44" r="2" fill="#92400E"/>
  <path d="M60 52c2 2 6 2 8 0" stroke="#92400E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M64 76c-20 0-36 12-36 28v4h72v-4c0-16-16-28-36-28z" fill="#FDE68A"/>
  <rect x="52" y="66" width="24" height="12" rx="6" fill="#FDE68A"/>
</svg>
`)}`;

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
  const { user, profile, isLoading, logout, refreshProfile } = useAuthContext();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [isLoading, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ── Profile Photo Upload ── */
  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!user || !file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, WebP, or GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create a preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // If storage bucket doesn't exist, use base64 approach
        console.warn("Storage upload failed, using base64 fallback:", uploadError);
        
        // Convert to base64 and store as data URL in profile
        const base64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        });

        const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: base64,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        if (updateError) throw updateError;
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        if (updateError) throw updateError;
      }

      await refreshProfile();
      setShowPhotoOptions(false);
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Failed to upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  }, [user, refreshProfile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = useCallback(async () => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      await refreshProfile();
      setPhotoPreview(null);
      setShowPhotoOptions(false);
    } catch (err) {
      console.error("Error removing photo:", err);
    } finally {
      setUploadingPhoto(false);
    }
  }, [user, refreshProfile]);

  /* ── Profile Photo URL Resolution ── */
  const avatarUrl = useMemo(() => {
    if (photoPreview) return photoPreview;
    if (profile?.avatar_url) return profile.avatar_url;
    // Check user metadata for Google avatar
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    if (user?.user_metadata?.picture) return user.user_metadata.picture;
    return null;
  }, [profile?.avatar_url, user?.user_metadata, photoPreview]);

  const initials = useMemo(() => {
    if (!profile?.full_name) return "?";
    const parts = profile.full_name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }, [profile?.full_name]);

  const memberSince = useMemo(() => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    }
    return new Date().toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }, [user?.created_at]);

  const authProvider = useMemo(() => {
    if (user?.app_metadata?.provider === 'google') return 'Google';
    if (user?.phone) return 'Phone';
    return 'Email';
  }, [user]);

  if (isLoading || !profile) return null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

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
        .photo-options-overlay {
          animation: fadeIn 0.2s ease-out;
        }
        .photo-options-dialog {
          animation: scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(255,149,0,0.22), 0 0 0 4px rgba(255,255,255,0.9); }
          50% { box-shadow: 0 4px 32px rgba(255,149,0,0.35), 0 0 0 6px rgba(255,255,255,0.95); }
        }
        .avatar-uploading {
          animation: avatarPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <main className="pt-[100px] md:pt-[120px] pb-24 px-4 max-w-5xl mx-auto relative">
        {/* Dot grid overlay */}
        <div className="profile-dot-grid absolute inset-0 pointer-events-none" />

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
                {/* Avatar with photo upload */}
                <div className="mb-6 relative">
                  <div className={`profile-avatar-ring ${uploadingPhoto ? 'avatar-uploading' : ''}`}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile.full_name || "Profile"}
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-28 h-28 rounded-full object-cover bg-white"
                        style={{ pointerEvents: "none" }}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          (e.target as HTMLImageElement).src = DEFAULT_MALE_AVATAR;
                        }}
                      />
                    ) : (
                      <img
                        src={DEFAULT_MALE_AVATAR}
                        alt="Default avatar"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-28 h-28 rounded-full object-cover bg-amber-50"
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                  </div>

                  {/* Upload overlay when uploading */}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-full p-2">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                      </div>
                    </div>
                  )}

                  {/* Online dot */}
                  <div
                    className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white"
                    style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
                  />

                  {/* Camera button — opens photo options */}
                  <button
                    onClick={() => setShowPhotoOptions(true)}
                    className="absolute bottom-1 left-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 hover:scale-110 hover:bg-amber-50 transition-all cursor-pointer"
                    style={{ color: T.orange }}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Auth provider badge */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      background: authProvider === 'Google' ? 'rgba(66,133,244,0.1)' : 'rgba(245,158,11,0.1)',
                      color: authProvider === 'Google' ? '#4285F4' : T.orangeDeep,
                      border: `1px solid ${authProvider === 'Google' ? 'rgba(66,133,244,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}
                  >
                    {authProvider === 'Google' ? '🔗 Connected via Google' : `📱 Via ${authProvider}`}
                  </span>
                </div>

                {/* Name & Badge */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-extrabold mb-1 flex items-center justify-center gap-2" style={{ color: T.navy }}>
                    {profile.full_name || "Awesome User"}
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
                    { icon: Shield, label: "Since", value: memberSince },
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
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(245,158,11,0.1)" }}
                  >
                    <User className="w-5 h-5" style={{ color: T.orange }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: T.navy }}>Personal Information</h3>
                </div>
                
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 hover:shadow-md hover:-translate-y-0.5"
                  style={{ 
                    background: "rgba(251,191,36,0.1)", 
                    color: T.orangeDeep,
                    border: "1px solid rgba(245,158,11,0.2)"
                  }}
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={<User />} label="Full Name" value={profile.full_name || "Not provided"} />
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

      {/* ══════════════════════════════════════════
          Photo Options Dialog
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showPhotoOptions && (
          <>
            {/* Backdrop */}
            <div
              className="photo-options-overlay fixed inset-0 z-[2000]"
              style={{
                background: "rgba(10,15,28,0.5)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              onClick={() => setShowPhotoOptions(false)}
            />
            {/* Dialog */}
            <div
              className="photo-options-dialog fixed z-[2001]"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(380px, 90vw)",
                background: "#ffffff",
                borderRadius: 28,
                boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(245,158,11,0.1)",
                padding: "32px 24px 24px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowPhotoOptions(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Title */}
              <h3 className="text-xl font-extrabold text-center mb-2" style={{ color: T.navy }}>
                Profile Photo
              </h3>
              <p className="text-sm text-center text-gray-500 font-medium mb-6">
                Choose how you want to update your photo
              </p>

              {/* Current photo preview */}
              <div className="flex justify-center mb-6">
                <div className="profile-avatar-ring">
                  <img
                    src={avatarUrl || DEFAULT_MALE_AVATAR}
                    alt="Current profile"
                    className="w-24 h-24 rounded-full object-cover bg-white"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_MALE_AVATAR;
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${T.orange}, ${T.gold})`,
                    color: T.navy,
                    border: "none",
                    boxShadow: `0 4px 16px ${T.orangeGlow}`,
                  }}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-bold">Upload Photo</div>
                    <div className="text-[11px] font-medium opacity-70">JPG, PNG, WebP up to 5MB</div>
                  </div>
                </button>

                {avatarUrl && avatarUrl !== DEFAULT_MALE_AVATAR && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-red-50 transition-all"
                    style={{
                      background: "transparent",
                      color: "#EF4444",
                      border: "1.5px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <X className="w-5 h-5" />
                    Remove Photo
                  </button>
                )}

                <button
                  onClick={() => setShowPhotoOptions(false)}
                  className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Dialog */}
      <ProfileSummaryDialog 
        open={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          // Refresh profile to get latest data
          refreshProfile();
        }} 
      />
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
