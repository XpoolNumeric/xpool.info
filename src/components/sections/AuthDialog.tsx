import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
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
  Phone,
  Loader2,
  ArrowLeft,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts/AuthContext";

// ---------- Constants ----------
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const GOOGLE_CLIENT_ID = '933710679999-idbqpvaq2a9e0mbi0qc6vuu4nifjej96.apps.googleusercontent.com';

// ---------- Supabase Auth Integration ----------
// Phone OTP: Vonage is configured as SMS provider in Supabase Dashboard.
// Google OAuth: Google provider is configured in Supabase Dashboard.
// Both methods create proper auth.users entries in Supabase Auth.

// ---------- Helper: Sync profile to Supabase profiles table (optional) ----------
const syncProfileToSupabase = async (userId: string, profile: any) => {
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      phone: profile.phone || '',
      full_name: profile.fullName || '',
      email: profile.email || '',
      city: profile.city || '',
      dob: profile.dob || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // profiles table may not exist — gracefully skip
  }
};

// ---------- Types ----------
interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp" | "link-phone" | "link-otp";

// ---------- Inline Styles (Hero-matching) ----------
const AuthStyles = memo(() => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .auth-dialog-overlay {
      backdrop-filter: blur(12px) !important;
      background: rgba(0, 0, 0, 0.35) !important;
    }

    .auth-dialog-content {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(
        170deg,
        rgba(255, 251, 235, 0.98) 0%,
        rgba(254, 249, 231, 0.97) 35%,
        rgba(255, 253, 245, 0.98) 100%
      ) !important;
      border: 1.5px solid rgba(245, 158, 11, 0.18) !important;
      box-shadow:
        0 32px 80px rgba(0, 0, 0, 0.12),
        0 8px 24px rgba(245, 158, 11, 0.08),
        0 0 0 1px rgba(245, 158, 11, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
    }

    .auth-trust-bar {
      background: linear-gradient(90deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.12));
      border-bottom: 1px solid rgba(245, 158, 11, 0.12);
    }

    .auth-input-group {
      border: 1.5px solid rgba(245, 158, 11, 0.18);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(8px);
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .auth-input-group:focus-within {
      border-color: rgba(245, 158, 11, 0.5);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1), 0 4px 12px rgba(245, 158, 11, 0.08);
      background: rgba(255, 255, 255, 0.85);
    }
    .auth-input-group.error {
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .auth-icon-box {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.12);
    }

    @keyframes auth-shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    .auth-cta-shimmer {
      background: linear-gradient(
        110deg,
        #f59e0b 0%, #fbbf24 30%,
        #fde68a 50%, #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: auth-shimmer 3s linear infinite;
      color: #1a0800 !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 24px rgba(245, 158, 11, 0.35), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
      transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }
    .auth-cta-shimmer:hover {
      filter: brightness(1.07);
      box-shadow: 0 8px 36px rgba(245, 158, 11, 0.5), 0 1px 0 rgba(255, 255, 255, 0.35) inset;
      transform: translateY(-1px);
    }
    .auth-cta-shimmer:active {
      transform: translateY(0);
    }
    .auth-cta-shimmer:disabled {
      opacity: 0.5;
      animation: none;
      filter: grayscale(0.3);
      transform: none;
    }

    .auth-google-btn {
      border: 1.5px solid rgba(245, 158, 11, 0.18) !important;
      background: rgba(255, 255, 255, 0.7) !important;
      backdrop-filter: blur(8px);
      font-weight: 600 !important;
      color: #374151 !important;
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
    .auth-google-btn:hover {
      background: rgba(255, 255, 255, 0.9) !important;
      border-color: rgba(245, 158, 11, 0.35) !important;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.12), 0 1px 0 rgba(255, 255, 255, 0.5) inset;
      transform: translateY(-1px);
    }
    .auth-google-btn:active {
      transform: translateY(0);
    }

    .auth-google-icon-box {
      background: linear-gradient(135deg, #f8f9fa, #fff);
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .auth-divider {
      position: relative;
      width: 100%;
      height: 1px;
      margin: 2rem 0;
    }
    .auth-divider::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.25), transparent);
    }
    .auth-divider-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      padding: 0 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #b45309;
      background-color: #fef9e7; /* Match dialog background precisely */
      z-index: 10;
    }

    .auth-step-badge {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #b45309;
      font-family: 'Inter', sans-serif;
    }

    @keyframes auth-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
      50%       { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
    }
    .auth-pulse-ring {
      animation: auth-pulse-ring 2.5s ease-in-out infinite;
    }

    @keyframes auth-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .auth-blink-dot {
      animation: auth-blink 1.6s ease-in-out infinite;
    }

    @keyframes auth-success-pop {
      0%   { transform: scale(0.5); opacity: 0; }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    .auth-success-pop {
      animation: auth-success-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .auth-otp-char {
      font-family: 'Inter', monospace;
      letter-spacing: 0.4em;
      caret-color: #f59e0b;
    }

    .auth-policy-link {
      color: #b45309;
      text-decoration: underline;
      text-decoration-color: rgba(180, 83, 9, 0.3);
      text-underline-offset: 2px;
      transition: text-decoration-color 0.2s ease;
    }
    .auth-policy-link:hover {
      text-decoration-color: rgba(180, 83, 9, 0.7);
    }

    /* Dot grid overlay for depth */
    .auth-dot-grid {
      background-image: radial-gradient(rgba(245, 158, 11, 0.06) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    @media (prefers-reduced-motion: reduce) {
      .auth-cta-shimmer,
      .auth-pulse-ring,
      .auth-blink-dot,
      .auth-success-pop {
        animation: none !important;
      }
    }
  `}</style>
));
AuthStyles.displayName = "AuthStyles";

// ---------- Animation Variants ----------
const fadeSlide = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.25, ease: "easeOut" } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ---------- Custom Hook (auth logic) ----------
function useAuth(initialStep: Step = "phone") {
  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const isValidPhone = PHONE_REGEX.test(phone);

  const sendOtp = useCallback(async () => {
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const phoneNumber = `+91${phone}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (signInError) throw signInError;

      setStep("otp");
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValidPhone, phone]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`OTP must be ${OTP_LENGTH} digits.`);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const phoneNumber = `+91${phone}`;
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      return true;
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError("Invalid OTP. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [phone, otp]);

  const sendLinkOtp = useCallback(async () => {
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const phoneNumber = `+91${phone}`;
      const { error: updateError } = await supabase.auth.updateUser({ phone: phoneNumber });
      if (updateError) throw updateError;
      setStep("link-otp");
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("Error sending link OTP:", err);
      setError(err.message || "Failed to send link OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValidPhone, phone]);

  const verifyLinkOtp = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`OTP must be ${OTP_LENGTH} digits.`);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const phoneNumber = `+91${phone}`;
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'phone_change',
      });
      if (verifyError) throw verifyError;
      return true;
    } catch (err: any) {
      console.error("Error verifying link OTP:", err);
      setError("Invalid OTP. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [phone, otp]);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setLoading(false);
    setError(null);
    setResendTimer(0);
  }, []);

  return {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone,
    sendOtp, verifyOtp, reset,
    sendLinkOtp, verifyLinkOtp,
  };
}

// ---------- Social Icons ----------
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ---------- Subcomponents ----------
const TrustBar = memo(() => (
  <div className="auth-trust-bar flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-t-3xl">
    <ShieldCheck className="h-4 w-4 text-amber-600" aria-hidden="true" />
    <span className="text-amber-700" style={{ fontFamily: "'Inter', sans-serif" }}>
      Secure & encrypted login
    </span>
  </div>
));
TrustBar.displayName = "TrustBar";

const StepBadge = memo(({ currentStep, total = 3 }: { currentStep: number; total?: number }) => (
  <div className="flex justify-center mt-4">
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="auth-step-badge px-4 py-1.5 text-xs font-bold rounded-full tracking-wider uppercase"
    >
      Step {currentStep} of {total}
    </motion.span>
  </div>
));
StepBadge.displayName = "StepBadge";

interface PhoneStepProps {
  phone: string;
  setPhone: (val: string) => void;
  isValidPhone: boolean;
  loading: boolean;
  onSendOtp: () => void;
  error: string | null;
}

const PhoneStep = ({
  phone, setPhone, isValidPhone, loading, onSendOtp, error,
}: PhoneStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, ""));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValidPhone && !loading) onSendOtp();
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mt-6 space-y-5"
    >
      <motion.div variants={staggerChild}>
        <div className={`auth-input-group flex items-center gap-3 rounded-2xl px-4 py-4 ${error ? "error" : ""}`}>
          <div className="auth-icon-box h-10 w-10 flex items-center justify-center rounded-xl shrink-0">
            <Phone className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <span className="text-amber-700/70 text-sm font-semibold shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>
            +91
          </span>
          <Input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="Enter mobile number"
            value={phone}
            maxLength={10}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-lg w-full min-w-0 bg-transparent placeholder:text-gray-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
            aria-invalid={!!error}
            aria-describedby={error ? "phone-error" : undefined}
          />
          {isValidPhone && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            id="phone-error"
            className="text-sm text-red-500 flex items-center gap-1.5 px-1"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={staggerChild}>
        <Button
          disabled={!isValidPhone || loading}
          onClick={onSendOtp}
          className="auth-cta-shimmer w-full h-14 rounded-2xl text-lg"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      </motion.div>
    </motion.div>
  );
};

interface OtpStepProps {
  phone: string;
  otp: string;
  setOtp: (val: string) => void;
  loading: boolean;
  onVerify: () => void;
  onBack: () => void;
  onResend: () => void;
  resendTimer: number;
  error: string | null;
}

const OtpStep = ({
  phone, otp, setOtp, loading, onVerify, onBack, onResend, resendTimer, error,
}: OtpStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, ""));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === OTP_LENGTH && !loading) onVerify();
  };

  const canResend = resendTimer === 0 && !loading;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mt-6 space-y-5"
    >
      <motion.div variants={staggerChild}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-amber-700/70 hover:text-amber-800 transition-colors group"
          aria-label="Change phone number"
        >
          <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-100/60 group-hover:bg-amber-200/60 transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Change number</span>
        </button>
      </motion.div>

      {/* OTP sent confirmation pill */}
      <motion.div variants={staggerChild} className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-300/60 bg-green-50/80 text-green-700 text-xs font-semibold tracking-wide">
          <span className="auth-blink-dot h-2 w-2 rounded-full bg-green-500" />
          OTP sent to +91 {phone}
        </div>
      </motion.div>

      <motion.div variants={staggerChild}>
        <div className={`auth-input-group flex items-center gap-3 rounded-2xl px-4 py-4 ${error ? "error" : ""}`}>
          <div className="auth-icon-box h-10 w-10 flex items-center justify-center rounded-xl shrink-0 auth-pulse-ring">
            <Lock className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="••••••"
            value={otp}
            maxLength={OTP_LENGTH}
            onChange={handleOtpChange}
            onKeyDown={handleKeyDown}
            className="auth-otp-char border-0 text-center text-2xl tracking-[0.3em] focus-visible:ring-0 w-full bg-transparent"
            aria-invalid={!!error}
            aria-describedby={error ? "otp-error" : undefined}
          />
          {otp.length === OTP_LENGTH && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            id="otp-error"
            className="text-sm text-red-500 flex items-center gap-1.5 px-1"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={staggerChild}>
        <Button
          disabled={otp.length !== OTP_LENGTH || loading}
          onClick={onVerify}
          className="auth-cta-shimmer w-full h-14 rounded-2xl text-lg"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>
      </motion.div>

      <motion.div variants={staggerChild} className="text-center text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
        {canResend ? (
          <button
            onClick={onResend}
            className="text-amber-700 hover:text-amber-800 font-semibold hover:underline transition-colors"
            disabled={loading}
          >
            Resend OTP
          </button>
        ) : (
          <span className="text-gray-500">
            Resend OTP in <span className="font-bold text-amber-700">{resendTimer}s</span>
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};

// ---------- Google Login via ID Token (popup — shows "Xpool", not Supabase URL) ----------
// Inner component that must live inside GoogleOAuthProvider
const GoogleLoginInner = ({
  onGoogleIdToken,
  loading,
}: {
  onGoogleIdToken: (idToken: string) => void;
  loading: boolean;
}) => {
  return (
    <>
      {/* Decorative divider */}
      <div className="auth-divider">
        <span className="auth-divider-label">or</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.35 } }}
        className="w-full relative"
      >
        {loading ? (
          <Button
            variant="outline"
            disabled
            className="auth-google-btn w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            <span className="font-semibold">Signing in...</span>
          </Button>
        ) : (
          <div className="relative w-full group">
            {/* Custom styled button visible to user */}
            <Button
              variant="outline"
              className="auth-google-btn w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base group-hover:bg-white/90 group-hover:border-amber-500/30 transition-all duration-300"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="auth-google-icon-box h-9 w-9 flex items-center justify-center rounded-xl shrink-0">
                <GoogleIcon />
              </span>
              <span className="font-semibold">Continue with Google</span>
            </Button>
            
            {/* Invisible Google Login overlay that actually handles the sign-in */}
            <div 
              className="absolute inset-x-0 inset-y-0 opacity-0 overflow-hidden rounded-2xl cursor-pointer flex justify-center items-center" 
              style={{ zIndex: 20 }}
            >
              <div className="w-full transform scale-[1.5]"> {/* Scale up to ensure full button coverage */}
                <GoogleLogin
                  onSuccess={(credentialResponse: CredentialResponse) => {
                    if (credentialResponse.credential) {
                      onGoogleIdToken(credentialResponse.credential);
                    }
                  }}
                  onError={() => console.error('Google Login Failed')}
                  size="large"
                  width="360"
                  text="continue_with"
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

// Wrapper that provides GoogleOAuthProvider context
const GoogleLoginSection = (props: {
  onGoogleIdToken: (idToken: string) => void;
  loading: boolean;
}) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <GoogleLoginInner {...props} />
  </GoogleOAuthProvider>
);

// ---------- Main Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone,
    sendOtp, verifyOtp, reset,
    sendLinkOtp, verifyLinkOtp,
  } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);

  // ---------- Auto-Login Check ----------
  useEffect(() => {
    if (open && user && user.phone) {
      onClose();
      navigate("/available-rides");
    }
  }, [open, user, onClose, navigate]);

  // ---------- Phone OTP Verify → Sync to Supabase ----------
  const handleVerify = useCallback(async () => {
    const success = await verifyOtp();
    if (success) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: { phone: phone }
          });
          await syncProfileToSupabase(user.id, { phone });
        }
      } catch (err) {
        console.error('Post-OTP sync error (non-blocking):', err);
      }
      onClose();
      navigate("/available-rides");
    }
  }, [verifyOtp, phone, onClose, navigate]);

  // ---------- Phone Link OTP Verify ----------
  const handleVerifyLink = useCallback(async () => {
    const success = await verifyLinkOtp();
    if (success) {
       try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncProfileToSupabase(user.id, { email: user.email, fullName: user.user_metadata?.full_name, phone });
        }
      } catch (err) {
        console.error('Post-Link sync error:', err);
      }
      onClose();
      navigate("/available-rides");
    }
  }, [verifyLinkOtp, phone, onClose, navigate]);

  // ---------- Google Auth → ID Token → Supabase (popup, shows "Xpool" not Supabase URL) ----------
  const handleGoogleIdToken = useCallback(async (idToken: string) => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (signInError) throw signInError;

      if (data.user) {
        if (!data.user.phone) {
          // Instruct user to link phone!
          setGoogleLoading(false);
          setStep("link-phone");
          return;
        } else {
          await syncProfileToSupabase(data.user.id, { email: data.user.email, fullName: data.user.user_metadata?.full_name });
        }
      }

      setGoogleLoading(false);
      onClose();
      navigate('/available-rides');
    } catch (err: any) {
      console.error('Supabase Google ID Token error:', err);
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }, [setError, onClose, navigate, setStep]);

  const handleResend = useCallback(() => {
    if (step === "link-otp") sendLinkOtp();
    else sendOtp();
  }, [step, sendOtp, sendLinkOtp]);

  const handleCloseAuth = useCallback(() => {
    reset();
    setGoogleLoading(false);
    onClose();
  }, [reset, onClose]);

  return (
    <>
      <AuthStyles />

      <Dialog open={open} onOpenChange={handleCloseAuth}>
        <DialogContent className="auth-dialog-content sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border-0">
          <div className="auth-dot-grid absolute inset-0 opacity-10 pointer-events-none rounded-3xl" />

          <TrustBar />

          <div className="p-6 md:p-8 space-y-6 relative z-10">

            <DialogHeader className="space-y-3">
              <DialogDescription className="sr-only">
                Authentication process to continue booking
              </DialogDescription>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {step === "phone" ? "Welcome to Xpool" : step === "link-phone" ? "Link Phone Number" : "Verify Number"}
                </DialogTitle>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  {step === "phone"
                    ? "Verify your account to enjoy seamless rides across India."
                    : step === "link-phone" 
                    ? "Please provide your phone number to complete account setup."
                    : `Enter the OTP sent to +91 ${phone} to proceed.`}
                </p>
              </div>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {(step === "phone" || step === "link-phone") ? (
                <motion.div key="phone" {...fadeSlide}>
                  <PhoneStep
                    phone={phone}
                    setPhone={setPhone}
                    isValidPhone={isValidPhone}
                    loading={loading}
                    onSendOtp={step === "link-phone" ? sendLinkOtp : sendOtp}
                    error={error}
                  />
                </motion.div>
              ) : (
                <motion.div key="otp" {...fadeSlide}>
                  <OtpStep
                    phone={phone}
                    otp={otp}
                    setOtp={setOtp}
                    loading={loading}
                    onVerify={step === "link-otp" ? handleVerifyLink : handleVerify}
                    onBack={() => setStep(step === "link-otp" ? "link-phone" : "phone")}
                    onResend={handleResend}
                    resendTimer={resendTimer}
                    error={error}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {(step === "phone" || step === "otp") && (
              <>
                <div id="recaptcha-container" className="my-2 flex justify-center"></div>

                <GoogleLoginSection
                  onGoogleIdToken={handleGoogleIdToken}
                  loading={googleLoading}
                />
              </>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              className="mt-2 text-[11px] text-center text-gray-400 px-2 leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              By continuing, you agree to our{" "}
              <span className="auth-policy-link cursor-pointer">Terms</span>{" "}
              &{" "}
              <span className="auth-policy-link cursor-pointer">Privacy</span>
            </motion.p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthDialog;