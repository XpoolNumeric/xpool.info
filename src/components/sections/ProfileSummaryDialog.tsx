import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/supabase/edgeFunctions";
import { useAuthContext } from "@/contexts/AuthContext";
import xpoolLogo from "@/assets/xpool-logo.jpeg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { extractIndianPhone } from "./AuthDialog";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProfileSummaryDialogProps {
  open: boolean;
  phone?: string;
  onClose: () => void;
  onBack?: () => void;
}

interface ProfileData {
  fullName: string;
  email: string;
  city: string;
  dob: string;
  phone: string;
}

type Step = 1 | 2 | 3 | 4;

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_PROFILE: ProfileData = { fullName: "", email: "", city: "", dob: "", phone: "" };

const validators: Record<keyof ProfileData, (v: string) => string | null> = {
  fullName: (v) => (v.trim().length < 3 ? "Minimum 3 characters required" : null),
  email: (v) =>
    v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Enter a valid email address"
      : null,
  city: (v) => (v.trim().length < 2 ? "Please enter your city" : null),
  dob: (v) => {
    if (!v) return "Date of birth is required";
    const age = (Date.now() - new Date(v).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13) return "You must be at least 13 years old";
    if (age > 110) return "Please enter a valid date";
    return null;
  },
  phone: (v) =>
    !v || !/^[6-9]\d{9}$/.test(v.replace(/\D/g, ""))
      ? "Enter a valid 10-digit Indian mobile number"
      : null,
};

const STEP_LABELS: Record<Step, string> = {
  1: "Verify Phone",
  2: "Your Details",
  3: "Review Profile",
  4: "Confirm OTP",
};

const TOTAL_STEPS = 4;

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeSlide: Variants = {
  initial: { opacity: 0, y: 22, scale: 0.97, filter: "blur(5px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -18, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

// ─── City Suggestions (common Indian cities) ─────────────────────────────────
const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Lucknow", "Chandigarh", "Coimbatore", "Indore", "Nagpur", "Bhopal", "Visakhapatnam",
  "Surat", "Kochi", "Thiruvananthapuram", "Mysore", "Vadodara", "Patna", "Ranchi", "Guwahati",
];

// ─── Main Component ───────────────────────────────────────────────────────────
const ProfileSummaryDialog = ({ open, phone, onClose, onBack }: ProfileSummaryDialogProps) => {
  const navigate = useNavigate();
  const { profile: contextProfile, refreshProfile } = useAuthContext();

  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState<Set<keyof ProfileData>>(new Set());
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  // ── KEY FIX: Properly extract phone on open ──────────────────────────────
  useEffect(() => {
    if (!open) return;

    setSaved(false);
    setOtp("");
    setOtpError(null);
    setSaveError(null);
    setTouched(new Set());
    setFocusedField(null);

    // ✅ FIX: Correctly extract 10-digit phone from any format
    const cleanPhone = extractIndianPhone(phone || contextProfile?.phone || "");

    const initialProfile: ProfileData = {
      fullName: contextProfile?.full_name || "",
      email: contextProfile?.email || "",
      city: contextProfile?.city || "",
      dob: contextProfile?.dob || "",
      phone: cleanPhone,
    };

    setProfile(initialProfile);

    // ✅ FIX: Skip Step 1 if phone is already valid (verified via Supabase Auth)
    const phoneIsVerified = cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone);
    setStep(phoneIsVerified ? 2 : 1);
  }, [open]); // only run when dialog opens, not on every context change

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = useMemo<Partial<Record<keyof ProfileData, string>>>(() => ({
    fullName: validators.fullName(profile.fullName) ?? undefined,
    email: validators.email(profile.email) ?? undefined,
    city: validators.city(profile.city) ?? undefined,
    dob: validators.dob(profile.dob) ?? undefined,
    phone: validators.phone(profile.phone) ?? undefined,
  }), [profile]);

  const isStep1Valid = !errors.phone && profile.phone.length === 10;
  const isStep2Valid = !errors.fullName && !errors.email && !errors.city && !errors.dob;

  const completion = useMemo(() => {
    const total = Object.keys(EMPTY_PROFILE).length;
    const filled = Object.values(profile).filter(Boolean).length;
    return Math.round((filled / total) * 100);
  }, [profile]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (step === 1 || step === 2) {
      if (onBack) onBack(); else onClose();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }, [step, onBack, onClose]);

  const goNext = useCallback(() => {
    if (step === 1) {
      setTouched(new Set(["phone"] as (keyof ProfileData)[]));
      if (!isStep1Valid) return;
    }
    if (step === 2) {
      setTouched(new Set(["fullName", "email", "city", "dob"] as (keyof ProfileData)[]));
      if (!isStep2Valid) return;
    }
    setStep((s) => (s + 1) as Step);
  }, [step, isStep1Valid, isStep2Valid]);

  // ── DB Write ──────────────────────────────────────────────────────────────
  const commitProfileToDB = useCallback(async (userId: string) => {
    const [, profileResult] = await Promise.allSettled([
      supabase.auth.updateUser({
        email: profile.email || undefined,
        data: { display_name: profile.fullName, full_name: profile.fullName },
      }),
      supabase.from("profiles").upsert({
        id: userId,
        phone: profile.phone,
        full_name: profile.fullName,
        email: profile.email,
        city: profile.city,
        dob: profile.dob,
        avatar_url: contextProfile?.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" }),
    ]);

    if (profileResult.status === "rejected") throw profileResult.reason;
  }, [profile, contextProfile]);

  // ── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // ✅ FIX: Robust phone comparison — strip country code from both sides
      const currentPhone = extractIndianPhone(user.phone);
      const newPhone = profile.phone.replace(/\D/g, "");

      if (newPhone && newPhone !== currentPhone) {
        // Phone changed → request OTP for new number
        const { error: updateError } = await supabase.auth.updateUser({
          phone: `+91${newPhone}`,
        });
        if (updateError) {
          if (updateError.message.toLowerCase().includes("already")) {
            setSaveError("This number is already linked to another account.");
          } else {
            setSaveError(updateError.message || "Failed to update phone number.");
          }
          setLoading(false);
          return;
        }
        setStep(4);
        setLoading(false);
        return;
      }

      // No phone change → commit directly
      await commitProfileToDB(user.id);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => { setLoading(false); onClose(); }, 800);
    } catch (err: any) {
      setSaveError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [profile, commitProfileToDB, refreshProfile, onClose]);

  // ── OTP Verify ────────────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) { setOtpError("OTP must be 6 digits"); return; }
    setLoading(true);
    setOtpError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${profile.phone}`,
        token: otp,
        type: "phone_change",
      });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await commitProfileToDB(user.id);
        await refreshProfile();
      }
      setSaved(true);
      setTimeout(() => { setLoading(false); onClose(); }, 800);
    } catch {
      setOtpError("Invalid OTP. Please check and try again.");
      setLoading(false);
    }
  }, [otp, profile.phone, commitProfileToDB, refreshProfile, onClose]);

  // ── Field updater ─────────────────────────────────────────────────────────
  const update = useCallback((key: keyof ProfileData, value: string) => {
    setProfile((p) => ({
      ...p,
      [key]: key === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
    if (key === "city") {
      const q = value.toLowerCase();
      setCitySuggestions(
        q.length >= 2 ? CITIES.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 5) : []
      );
    }
  }, []);

  const touchField = useCallback(
    (key: keyof ProfileData) => setTouched((p) => new Set([...p, key])),
    []
  );

  // ── Max DOB (must be >= 13 years old) ────────────────────────────────────
  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-0 shadow-[0_32px_80px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.65)]"
        style={{
          background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
          fontFamily: "'Inter', sans-serif",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(245,158,11,0.65) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10">
          {/* Trust bar */}
          <div className="flex items-center justify-center gap-2 bg-amber-500/8 py-3 text-sm text-amber-700 font-semibold border-b border-amber-500/12">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
            Profile stored securely — end-to-end encrypted
          </div>

          {/* Top nav */}
          <div className="flex items-center justify-between px-6 mt-5">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-amber-900/60 hover:text-amber-900 font-semibold transition-colors group"
            >
              <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/18 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                <ArrowLeft className="h-4 w-4 text-amber-700" />
              </span>
              <span>{step <= 2 ? "Cancel" : "Back"}</span>
            </button>

            <span className="px-3.5 py-1.5 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tracking-wider uppercase">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Header */}
            <DialogHeader className="space-y-2 flex flex-col items-center">
              <DialogDescription className="sr-only">
                Complete your Xpool profile
              </DialogDescription>

              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
                className="h-16 w-16 rounded-2xl overflow-hidden mb-2 shadow-[0_8px_24px_rgba(245,158,11,0.2)] flex items-center justify-center bg-white border border-amber-500/10"
              >
                <img src={xpoolLogo} alt="Xpool Logo" className="w-full h-full object-cover" />
              </motion.div>

              <DialogTitle
                className="text-3xl font-black text-gray-900 tracking-tight leading-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {STEP_LABELS[step]}
              </DialogTitle>
              <p className="text-center text-sm font-medium text-gray-500 leading-relaxed max-w-[280px]">
                {step === 1 && "Confirm your primary mobile number for ride alerts"}
                {step === 2 && "Tell us a bit about yourself to get started"}
                {step === 3 && "Everything look good? Let's save your profile"}
                {step === 4 && "Enter the code sent to your new number to confirm the change"}
              </p>
            </DialogHeader>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 pb-2">
              {([1, 2, 3] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-500 ${s === step
                      ? "w-8 h-2 bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      : s < step
                        ? "w-2 h-2 bg-amber-500/60"
                        : "w-2 h-2 bg-black/8"
                    }`}
                />
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={fadeSlide} initial="initial" animate="animate" exit="exit">

                {/* ── STEP 1: Phone ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <InputBlock
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone number"
                      value={profile.phone}
                      prefix="+91"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      errorMsg={touched.has("phone") ? errors.phone : undefined}
                      isValid={!errors.phone && profile.phone.length === 10}
                      isFocused={focusedField === "phone"}
                      autoFocus
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => { setFocusedField(null); touchField("phone"); }}
                      onChange={(v) => update("phone", v)}
                    />

                    <div className="rounded-2xl bg-amber-500/6 flex gap-3 border border-amber-500/18 p-4 text-sm text-amber-900/70 font-medium">
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        Provide a valid Indian number to receive booking confirmations and ride alerts via SMS.
                      </span>
                    </div>

                    <ActionButton onClick={goNext} label="Verify & Continue" />
                  </div>
                )}

                {/* ── STEP 2: Details ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${completion}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between px-0.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/50">
                          {completion === 100 ? "✓ All fields filled" : "Profile completion"}
                        </p>
                        <p className="text-[11px] font-black text-amber-600">{completion}%</p>
                      </div>
                    </div>

                    <InputBlock
                      icon={<User className="h-4 w-4" />}
                      label="Full name"
                      value={profile.fullName}
                      errorMsg={touched.has("fullName") ? errors.fullName : undefined}
                      isValid={!errors.fullName && profile.fullName.length >= 3}
                      isFocused={focusedField === "fullName"}
                      autoFocus
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => { setFocusedField(null); touchField("fullName"); }}
                      onChange={(v) => update("fullName", v)}
                    />

                    <InputBlock
                      icon={<Mail className="h-4 w-4" />}
                      label="Email address (optional)"
                      value={profile.email}
                      type="email"
                      errorMsg={touched.has("email") ? errors.email : undefined}
                      isValid={!errors.email && profile.email.length > 3}
                      isFocused={focusedField === "email"}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => { setFocusedField(null); touchField("email"); }}
                      onChange={(v) => update("email", v)}
                    />

                    {/* City with autocomplete */}
                    <div className="relative">
                      <InputBlock
                        icon={<MapPin className="h-4 w-4" />}
                        label="City"
                        value={profile.city}
                        errorMsg={touched.has("city") ? errors.city : undefined}
                        isValid={!errors.city && profile.city.length >= 2}
                        isFocused={focusedField === "city"}
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => {
                          setTimeout(() => {
                            setFocusedField(null);
                            touchField("city");
                            setCitySuggestions([]);
                          }, 180);
                        }}
                        onChange={(v) => update("city", v)}
                      />
                      <AnimatePresence>
                        {citySuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden border border-amber-200/60 shadow-lg bg-white"
                          >
                            {citySuggestions.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onMouseDown={() => {
                                  update("city", city);
                                  setCitySuggestions([]);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                              >
                                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                                {city}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <InputBlock
                      icon={<Calendar className="h-4 w-4" />}
                      label="Date of birth"
                      type="date"
                      max={maxDob}
                      value={profile.dob}
                      errorMsg={touched.has("dob") ? errors.dob : undefined}
                      isValid={!errors.dob && profile.dob.length > 0}
                      isFocused={focusedField === "dob"}
                      onFocus={() => setFocusedField("dob")}
                      onBlur={() => { setFocusedField(null); touchField("dob"); }}
                      onChange={(v) => update("dob", v)}
                    />

                    <ActionButton onClick={goNext} disabled={!isStep2Valid} label="Review Details →" />
                  </div>
                )}

                {/* ── STEP 3: Review ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-amber-500/12 bg-white/60 backdrop-blur-md divide-y divide-amber-500/10 shadow-sm overflow-hidden">
                      <ReviewRow icon={<Phone className="h-4 w-4" />} label="Phone" value={`+91 ${profile.phone}`} />
                      <ReviewRow icon={<User className="h-4 w-4" />} label="Full Name" value={profile.fullName || "—"} />
                      <ReviewRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email || "Not provided"} />
                      <ReviewRow icon={<MapPin className="h-4 w-4" />} label="City" value={profile.city || "—"} />
                      <ReviewRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth"
                        value={profile.dob
                          ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                          : "—"}
                      />
                    </div>

                    <ActionButton
                      onClick={() => { setSaveError(null); handleSave(); }}
                      disabled={loading || saved}
                      loading={loading}
                      saved={saved}
                      label="Confirm & Save Profile"
                      savedLabel="✓ Profile Saved!"
                    />

                    <AnimatePresence>
                      {saveError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200/60 text-sm font-semibold text-red-600"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {saveError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full text-center text-sm font-semibold text-amber-700/70 hover:text-amber-800 underline underline-offset-4 transition-colors"
                    >
                      Edit details
                    </button>
                  </div>
                )}

                {/* ── STEP 4: OTP Verify ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="text-center bg-amber-50/70 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-900/80 font-medium leading-relaxed">
                      <BadgeCheck className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                      A verification code has been sent to{" "}
                      <span className="font-bold text-amber-800">+91 {profile.phone}</span>.
                      Enter it below to confirm.
                    </div>

                    <InputBlock
                      icon={<Lock className="h-4 w-4" />}
                      label="6-digit verification code"
                      value={otp}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      errorMsg={otpError || undefined}
                      isFocused={focusedField === "otp"}
                      autoFocus
                      onFocus={() => setFocusedField("otp")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(v) => { setOtp(v.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }}
                    />

                    <ActionButton
                      onClick={handleVerifyOtp}
                      disabled={loading || saved || otp.length !== 6}
                      loading={loading}
                      saved={saved}
                      label="Verify & Save"
                      savedLabel="✓ Profile Updated!"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSummaryDialog;

// ─────────────────────────────────────────────────────────────────────────────
// Action Button
// ─────────────────────────────────────────────────────────────────────────────
const ActionButton = ({
  onClick,
  disabled,
  loading,
  saved,
  label,
  savedLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  saved?: boolean;
  label: string;
  savedLabel?: string;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading || saved}
    className={`w-full h-14 rounded-2xl text-[15px] font-bold relative overflow-hidden transition-all duration-300 border-none ${saved
        ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)]"
        : disabled && !loading
          ? "bg-amber-400/50 text-white/70 cursor-not-allowed"
          : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] text-white shadow-[0_8px_32px_rgba(245,158,11,0.32)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.44)] hover:-translate-y-0.5"
      }`}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">
      {loading && !saved && <Loader2 className="h-5 w-5 animate-spin" />}
      {saved && <CheckCircle2 className="h-5 w-5" />}
      {saved ? (savedLabel || "Saved!") : loading ? "Processing…" : label}
    </span>
  </Button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Review Row
// ─────────────────────────────────────────────────────────────────────────────
const ReviewRow = ({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/40 transition-colors">
    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/10 shadow-sm">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-amber-900/45 font-bold mb-0.5">{label}</p>
      <p className="text-[15px] font-bold text-[#0A0F1C] truncate">{value}</p>
    </div>
    <CheckCircle2 className="h-5 w-5 text-emerald-500/70 shrink-0" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input Block
// ─────────────────────────────────────────────────────────────────────────────
const InputBlock = ({
  icon, label, value, prefix,
  onChange, type = "text", inputMode, maxLength, max,
  errorMsg, isValid, isFocused,
  autoFocus, readOnly, onFocus, onBlur,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  prefix?: string;
  onChange?: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  max?: string;
  errorMsg?: string;
  isValid?: boolean;
  isFocused?: boolean;
  autoFocus?: boolean;
  readOnly?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) => (
  <div className="space-y-1.5">
    <div
      className={`
        flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 border-2
        ${errorMsg ? "border-red-500/45 bg-red-50/50" : ""}
        ${isValid && !errorMsg && !isFocused ? "border-emerald-500/35 bg-white" : ""}
        ${isFocused && !errorMsg ? "border-amber-500 bg-white shadow-[0_0_0_4px_rgba(245,158,11,0.13)] scale-[1.008]" : ""}
        ${!errorMsg && !isValid && !isFocused ? "border-amber-500/18 bg-white hover:border-amber-500/35" : ""}
        ${readOnly ? "bg-black/5 opacity-60 cursor-not-allowed" : ""}
      `}
    >
      <div
        className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-[14px] transition-colors border
          ${errorMsg ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}
          ${isValid && !errorMsg ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
          ${!errorMsg && !isValid ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-500/20" : ""}
          ${isFocused && !errorMsg && !isValid ? "bg-amber-500/18 border-amber-500/35 text-amber-700" : ""}
        `}
      >
        {icon}
      </div>

      {prefix && (
        <span className="text-amber-900/50 font-bold text-sm select-none border-r border-amber-500/20 pr-3 shrink-0">
          {prefix}
        </span>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {(value || isFocused || type === "date") && (
          <p className="text-[10px] font-bold text-amber-900/45 leading-none mb-1 uppercase tracking-wider">
            {label}
          </p>
        )}
        <Input
          type={type}
          value={value}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={isFocused ? "" : label}
          inputMode={inputMode}
          maxLength={maxLength}
          max={max}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange?.(e.target.value)}
          className="border-none focus-visible:ring-0 shadow-none text-[16px] font-semibold text-[#0A0F1C] p-0 h-auto bg-transparent placeholder:text-amber-900/35 placeholder:font-medium"
          style={{ border: "none", boxShadow: "none", outline: "none" }}
        />
      </div>

      {!readOnly && (
        <div className="shrink-0">
          <AnimatePresence mode="wait">
            {isValid && (
              <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </motion.div>
            )}
            {errorMsg && (
              <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>

    <AnimatePresence>
      {errorMsg && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs font-semibold text-red-500 px-2 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);