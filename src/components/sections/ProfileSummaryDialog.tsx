import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
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
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const EMPTY_PROFILE: ProfileData = {
  fullName: "",
  email: "",
  city: "",
  dob: "",
  phone: "",
};

const validators: Record<keyof ProfileData, (v: string) => string | null> = {
  fullName: (v) => (v.trim().length < 3 ? "Must be at least 3 characters" : null),
  email: (v) =>
    v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Enter a valid email address"
      : null,
  city: (v) => (v.trim().length < 2 ? "Enter your city" : null),
  dob: (v) => (!v ? "Date of birth is required" : null),
  phone: (v) => (!v || !/^[6-9]\d{9}$/.test(v.replace(/\D/g, '')) ? "Enter a valid 10-digit number" : null),
};

const STEP_LABELS: Record<Step, string> = {
  1: "Verify Phone",
  2: "Your Details",
  3: "Review",
  4: "Verify OTP",
};

const TOTAL_STEPS = 4;

// Premium Styling Tokens
const T = {
  orange: "#FF9500",
  orangeGlow: "rgba(255,149,0,0.22)",
  gold: "#FFBA00",
  ivory: "#FFF8ED",
};

import { Variants } from "framer-motion";

const fadeSlide: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, scale: 0.98, filter: "blur(4px)", transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
};

const ProfileSummaryDialog = ({
  open,
  phone,
  onClose,
  onBack,
}: ProfileSummaryDialogProps) => {
  const navigate = useNavigate();
  const { profile: contextProfile, refreshProfile } = useAuthContext();

  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState<Set<keyof ProfileData>>(new Set());
  const [focusedField, setFocusedField] = useState<keyof ProfileData | string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaved(false);
    setOtp("");
    setOtpError(null);
    setSaveError(null);
    setTouched(new Set());

    let initialPhone = phone || "";
    if (contextProfile) {
      initialPhone = contextProfile.phone || initialPhone;
      setProfile({
        fullName: contextProfile.full_name || "",
        email: contextProfile.email || "",
        city: contextProfile.city || "",
        dob: contextProfile.dob || "",
        phone: initialPhone,
      });
    } else {
      setProfile({ ...EMPTY_PROFILE, phone: initialPhone });
    }

    // Professional Flow: Skip to step 2 if phone is already verified/available and valid
    if (initialPhone && /^[6-9]\d{9}$/.test(initialPhone.replace(/\D/g, ''))) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [open, contextProfile, phone]);

  const errors = useMemo<Partial<Record<keyof ProfileData, string>>>(() => ({
    fullName: validators.fullName(profile.fullName) ?? undefined,
    email: validators.email(profile.email) ?? undefined,
    city: validators.city(profile.city) ?? undefined,
    dob: validators.dob(profile.dob) ?? undefined,
    phone: validators.phone(profile.phone) ?? undefined,
  }), [profile]);

  const isStep1Valid = !errors.phone && profile.phone.length > 0;
  const isStep2Valid = !errors.fullName && !errors.email && !errors.city && !errors.dob;

  const completion = useMemo(() => {
    const fields = Object.values(profile);
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const goBack = useCallback(() => {
    if (step === 1) {
      if (onBack) {
        onBack();
      } else {
        onClose();
      }
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }, [step, onBack, onClose]);

  const goNext = useCallback(() => {
    if (step === 1) {
      setTouched(new Set(["phone"]));
      if (!isStep1Valid) return;
    }
    if (step === 2) {
      setTouched(new Set(["fullName", "email", "city", "dob"] as (keyof ProfileData)[]));
      if (!isStep2Valid) return;
    }
    setStep((s) => (s + 1) as Step);
  }, [step, isStep1Valid, isStep2Valid]);

  const commitProfileToDB = async (userId: string) => {
      // 1. Update auth.users metadata
      await supabase.auth.updateUser({
        email: profile.email,
        data: { display_name: profile.fullName, full_name: profile.fullName }
      });

      // 2. Upsert into public.profiles table
      await supabase.from('profiles').upsert({ 
          id: userId, phone: profile.phone, full_name: profile.fullName, 
          email: profile.email, city: profile.city, dob: profile.dob, 
          updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  };

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Use user.phone directly instead of contextProfile to avoid sync delays after login
      const currentPhone = (user.phone || "").replace("+91", "");
      if (profile.phone !== currentPhone && profile.phone) {
        // Send OTP for new phone
        const { error: updateError } = await supabase.auth.updateUser({ phone: `+91${profile.phone}` });
        if (updateError) {
          console.error("Phone update error:", updateError);
          setLoading(false);
          
          if (updateError.message.toLowerCase().includes('already been registered')) {
             setSaveError("This phone number is already linked to another account.");
          } else {
             setSaveError(updateError.message || "Failed to update phone number.");
          }
          return;
        }
        setStep(4); // Display OTP input step
        setLoading(false);
        return;
      }

      // If no phone change, commit directly
      await commitProfileToDB(user.id);
      await refreshProfile();
      
      setSaved(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);

    } catch (err) {
      console.error("Error saving profile:", err);
      setLoading(false);
    }
  }, [profile, contextProfile, refreshProfile, onClose]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError("OTP must be 6 digits"); return; }
    setLoading(true);
    setOtpError(null);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${profile.phone}`,
        token: otp,
        type: 'phone_change'
      });
      if (verifyError) throw verifyError;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await commitProfileToDB(user.id);
         await refreshProfile();
      }

      setSaved(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);
    } catch (err) {
      setOtpError("Invalid OTP. Please try again.");
      setLoading(false);
    }
  };

  const update = (key: keyof ProfileData, value: string) => {
    if (key === 'phone') {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const touchField = (key: keyof ProfileData) =>
    setTouched((prev) => new Set([...prev, key]));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-0 shadow-[0_32px_80px_rgba(0,0,0,0.12),_inset_0_1px_0_rgba(255,255,255,0.6)]" 
        style={{ 
          background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(245,158,11,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />

        <div className="relative z-10">
          {/* TRUST BAR */}
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 py-3 text-sm text-amber-700 font-medium border-b border-amber-500/10">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
            Profile stored securely on this device
          </div>

          {/* TOP NAV: back + step badge */}
          <div className="flex items-center justify-between px-6 mt-5">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-amber-900/60 hover:text-amber-900 font-semibold transition-colors group"
            >
              <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                <ArrowLeft className="h-4 w-4 text-amber-700" />
              </span>
              <span>
                {step === 1 ? "Cancel" : "Back"}
              </span>
            </button>

            <span className="px-4 py-1.5 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tracking-wider uppercase">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          <div className="p-6 space-y-6">

            {/* HEADER */}
            <DialogHeader className="space-y-2 flex flex-col items-center">
              <DialogDescription className="sr-only">
                Provide your personal details to complete the setup
              </DialogDescription>
              <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                {STEP_LABELS[step]}
              </DialogTitle>
              <p className="text-center text-sm font-medium text-gray-500 leading-relaxed max-w-[280px]">
                {step === 1 && "Confirm or update your primary phone number"}
                {step === 2 && "Fill in your personal details to continue"}
                {step === 3 && "Review your information before saving"}
                {step === 4 && "Enter the verification code to secure your account."}
              </p>
            </DialogHeader>

            {/* STEP DOTS */}
            <div className="flex items-center justify-center gap-2 pb-4">
              {([1, 2, 3] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-500 ${s === step
                      ? "w-8 h-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : s < step
                        ? "w-2 h-2 bg-amber-500/60"
                        : "w-2 h-2 bg-black/5"
                    }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* ---- STEP 1: Phone Confirm ---- */}
                {step === 1 && (
                  <div className="space-y-6">
                    <InputBlock
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone number"
                      value={profile.phone}
                      prefix="+91"
                      errorMsg={touched.has("phone") ? errors.phone : undefined}
                      isValid={touched.has("phone") && !errors.phone && profile.phone.length === 10}
                      isFocused={focusedField === "phone"}
                      autoFocus
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => { setFocusedField(null); touchField("phone"); }}
                      onChange={(v) => update("phone", v)}
                    />

                    <div className="rounded-2xl bg-amber-500/5 flex gap-3 border border-amber-500/20 p-4 text-sm text-amber-900/70 leading-relaxed font-medium">
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        If you logged in cleanly with Google, please provide a valid Indian mobile number for ride notifications.
                      </div>
                    </div>

                    <ActionButton 
                      onClick={goNext} 
                      disabled={touched.has("phone") && !!errors.phone}
                      label="Verify & Continue" 
                    />
                  </div>
                )}

                {/* ---- STEP 2: Personal Details ---- */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden border border-black/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out relative overflow-hidden"
                          style={{ width: `${completion}%` }}
                        >
                           <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/50">
                          {completion === 100 ? "Ready to go!" : "Almost there"}
                        </p>
                        <p className="text-[11px] font-bold text-amber-600">{completion}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <InputBlock
                        icon={<User className="h-4 w-4" />}
                        label="Full name"
                        value={profile.fullName}
                        errorMsg={touched.has("fullName") ? errors.fullName : undefined}
                        isValid={touched.has("fullName") && !errors.fullName && profile.fullName.length > 0}
                        isFocused={focusedField === "fullName"}
                        autoFocus
                        onFocus={() => setFocusedField("fullName")}
                        onBlur={() => { setFocusedField(null); touchField("fullName"); }}
                        onChange={(v) => update("fullName", v)}
                      />

                      <InputBlock
                        icon={<Mail className="h-4 w-4" />}
                        label="Email address"
                        value={profile.email}
                        errorMsg={touched.has("email") ? errors.email : undefined}
                        isValid={touched.has("email") && !errors.email && profile.email.length > 0}
                        isFocused={focusedField === "email"}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => { setFocusedField(null); touchField("email"); }}
                        onChange={(v) => update("email", v)}
                      />

                      <InputBlock
                        icon={<MapPin className="h-4 w-4" />}
                        label="City"
                        value={profile.city}
                        errorMsg={touched.has("city") ? errors.city : undefined}
                        isValid={touched.has("city") && !errors.city && profile.city.length > 0}
                        isFocused={focusedField === "city"}
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => { setFocusedField(null); touchField("city"); }}
                        onChange={(v) => update("city", v)}
                      />

                      <InputBlock
                        icon={<Calendar className="h-4 w-4" />}
                        label="Date of birth"
                        type="date"
                        value={profile.dob}
                        errorMsg={touched.has("dob") ? errors.dob : undefined}
                        isValid={touched.has("dob") && !errors.dob && profile.dob.length > 0}
                        isFocused={focusedField === "dob"}
                        onFocus={() => setFocusedField("dob")}
                        onBlur={() => { setFocusedField(null); touchField("dob"); }}
                        onChange={(v) => update("dob", v)}
                      />
                    </div>

                    <ActionButton 
                      onClick={goNext} 
                      disabled={!isStep2Valid} 
                      label="Review Details" 
                    />
                  </div>
                )}

                {/* ---- STEP 3: Review ---- */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border-2 border-amber-500/10 bg-white/50 backdrop-blur-md divide-y divide-amber-500/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                      <ReviewRow
                        icon={<Phone className="h-4 w-4" />}
                        label="Phone"
                        value={profile.phone ? `+91 ${profile.phone}` : "—"}
                      />
                      <ReviewRow
                        icon={<User className="h-4 w-4" />}
                        label="Full Name"
                        value={profile.fullName || "—"}
                      />
                      <ReviewRow
                        icon={<Mail className="h-4 w-4" />}
                        label="Email"
                        value={profile.email || "—"}
                      />
                      <ReviewRow
                        icon={<MapPin className="h-4 w-4" />}
                        label="City"
                        value={profile.city || "—"}
                      />
                      <ReviewRow
                        icon={<Calendar className="h-4 w-4" />}
                        label="Date of Birth"
                        value={
                          profile.dob
                            ? new Date(profile.dob).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                            : "—"
                        }
                      />
                    </div>

                    <ActionButton 
                      onClick={() => {
                        setSaveError(null);
                        handleSave();
                      }} 
                      disabled={loading || saved}
                      loading={loading}
                      saved={saved}
                      label="Confirm & Save"
                      savedLabel="Profile Saved!"
                    />

                    <AnimatePresence>
                      {saveError && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm font-semibold text-red-500 text-center flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {saveError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <p className="text-[11px] text-center font-medium text-amber-900/50 uppercase tracking-widest">
                      You can edit this later in your profile
                    </p>
                  </div>
                )}
                {/* ---- STEP 4: Verify OTP ---- */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center font-bold text-amber-900 mb-4 bg-amber-500/10 p-4 rounded-xl text-sm border border-amber-500/20">
                      An OTP has been sent to +91 {profile.phone}. Please enter it to verify the change.
                    </div>
                    <InputBlock
                      icon={<Lock className="h-4 w-4" />}
                      label="6-digit OTP"
                      value={otp}
                      type="text"
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
                      savedLabel="Profile Updated!"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(250%) skewX(-20deg); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSummaryDialog;

/* ================================================================
   ACTION BUTTON (Golden Shimmer)
================================================================ */
const ActionButton = ({ onClick, disabled, loading, saved, label, savedLabel }: any) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-14 rounded-2xl text-lg relative overflow-hidden transition-all duration-300 ${
        saved 
          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_8px_32px_rgba(16,185,129,0.4)] border-none"
          : disabled 
            ? "bg-amber-500/50 text-white/70 cursor-not-allowed border-none"
            : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-white font-bold border-none shadow-[0_8px_32px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.45)] hover:-translate-y-0.5"
      }`}
      style={!saved ? { textShadow: "0 1px 2px rgba(0,0,0,0.15)" } : {}}
    >
      <div className="relative z-10 flex items-center justify-center font-bold">
        {loading && !saved && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {saved && <CheckCircle2 className="mr-2 h-5 w-5 text-white" />}
        {saved ? (savedLabel || "Saved!") : loading ? "Processing..." : label}
      </div>
    </Button>
  );
};

/* ================================================================
   REVIEW ROW
================================================================ */

const ReviewRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/50 transition-colors">
    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/10 shadow-sm">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-amber-900/50 font-bold mb-0.5">{label}</p>
      <p className="text-[15px] font-bold text-[#0A0F1C] truncate">{value}</p>
    </div>
    <CheckCircle2 className="h-5 w-5 text-green-500/80 shrink-0" />
  </div>
);

/* ================================================================
   INPUT BLOCK
================================================================ */

const InputBlock = ({
  icon,
  label,
  value,
  prefix,
  onChange,
  type = "text",
  errorMsg,
  isValid,
  isFocused,
  autoFocus,
  readOnly,
  onFocus,
  onBlur,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  prefix?: string;
  onChange?: (v: string) => void;
  type?: string;
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
        ${errorMsg ? "border-red-500/50 bg-red-500/5" : ""}
        ${isValid && !errorMsg && !isFocused ? "border-green-500/40 bg-white" : ""}
        ${isFocused && !errorMsg ? "border-amber-500 bg-white shadow-[0_0_0_3px_rgba(245,158,11,0.15)] scale-[1.01]" : ""}
        ${!errorMsg && !isValid && !isFocused ? "border-amber-500/20 bg-white hover:border-amber-500/40" : ""}
        ${readOnly ? "bg-black/5 opacity-70 cursor-not-allowed" : ""}
      `}
    >
      <div
        className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-[14px] transition-colors duration-300 border
          ${errorMsg ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}
          ${isValid && !errorMsg ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" : ""}
          ${!errorMsg && !isValid ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.06),inset_0_1px_0_rgba(255,255,255,0.5)]" : ""}
          ${isFocused && !errorMsg ? "bg-amber-500/20 border-amber-500/40 text-amber-700 ring-2 ring-amber-500/20 ring-offset-1" : ""}
        `}
      >
        {icon}
      </div>

      {prefix && (
        <span className="text-amber-900/50 font-bold text-sm select-none border-r border-amber-500/20 pr-3">
          {prefix}
        </span>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {(value || isFocused || type === 'date') && !readOnly && (
          <p className="text-[10px] font-bold text-amber-900/50 leading-none mb-1 uppercase tracking-wider">
            {label}
          </p>
        )}
        <Input
          type={type}
          value={value}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={label}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange?.(e.target.value)}
          className={`border-0 focus-visible:ring-0 text-[16px] font-semibold text-[#0A0F1C] p-0 h-auto bg-transparent placeholder:text-amber-900/40 placeholder:font-medium`}
        />
      </div>

      {!readOnly && (
        <div className="shrink-0 transition-all duration-300 origin-center scale-100">
          {isValid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {errorMsg && <AlertCircle className="h-5 w-5 text-red-500" />}
        </div>
      )}
    </div>

    <AnimatePresence>
      {errorMsg && (
        <motion.p 
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="text-xs font-semibold text-red-500 px-2 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMsg}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);