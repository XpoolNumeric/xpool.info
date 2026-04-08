import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { sendPhoneOtp } from "@/lib/supabase/edgeFunctions";
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
  Phone,
  Mail,
  Loader2,
  ArrowLeft,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ProfileSummaryDialog from "./ProfileSummaryDialog";
import { useAuthContext } from "@/contexts/AuthContext";

// ---------- Constants ----------
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

// ---------- Utility: extract clean 10-digit Indian mobile ----------
export function extractIndianPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  // strip everything non-digit
  const digits = raw.replace(/\D/g, "");
  // handle +91XXXXXXXXXX or 91XXXXXXXXXX or plain XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  if (digits.length === 10) return digits;
  return digits.slice(-10); // best effort
}

// ---------- Types ----------
interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp";

// ---------- Inline Styles ----------
const AuthStyles = memo(() => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .auth-dialog-overlay {
      backdrop-filter: blur(16px) !important;
      background: rgba(0,0,0,0.4) !important;
    }

    .auth-dialog-content {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%) !important;
      border: 1.5px solid rgba(180,83,9,0.13) !important;
      box-shadow:
        0 48px 120px rgba(0,0,0,0.12),
        0 4px 20px rgba(245,158,11,0.07),
        inset 0 1px 0 rgba(255,255,255,0.85) !important;
    }

    .auth-trust-bar {
      background: rgba(251,191,36,0.08);
      border-bottom: 1px solid rgba(245,158,11,0.12);
    }

    .auth-input-group {
      border: 1.5px solid rgba(245,158,11,0.18);
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
    }
    .auth-input-group:focus-within {
      border-color: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245,158,11,0.13), 0 8px 16px rgba(245,158,11,0.07);
      background: #ffffff;
      transform: translateY(-1px);
    }
    .auth-input-group.error {
      border-color: rgba(239,68,68,0.45);
      box-shadow: 0 0 0 4px rgba(239,68,68,0.1);
      background: rgba(254,242,242,0.7);
    }
    .auth-input-group.success {
      border-color: rgba(16,185,129,0.4);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
    }

    .auth-icon-box {
      background: rgba(251,191,36,0.1);
      border: 1px solid rgba(245,158,11,0.1);
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
      box-shadow: 0 4px 24px rgba(245,158,11,0.35), 0 1px 0 rgba(255,255,255,0.3) inset;
      transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }
    .auth-cta-shimmer:hover:not(:disabled) {
      filter: brightness(1.06);
      box-shadow: 0 8px 36px rgba(245,158,11,0.5), 0 1px 0 rgba(255,255,255,0.35) inset;
      transform: translateY(-2px);
    }
    .auth-cta-shimmer:active:not(:disabled) { transform: translateY(0); }
    .auth-cta-shimmer:disabled {
      opacity: 0.55;
      animation: none;
      filter: grayscale(0.25);
      cursor: not-allowed;
    }

    .auth-google-btn {
      border: 1.5px solid rgba(180,83,9,0.14) !important;
      background: #ffffff !important;
      font-weight: 600 !important;
      color: #374151 !important;
      transition: all 0.25s cubic-bezier(0.22,1,0.36,1) !important;
    }
    .auth-google-btn:hover {
      background: #fdfdfd !important;
      border-color: rgba(245,158,11,0.3) !important;
      box-shadow: 0 6px 16px rgba(245,158,11,0.1) !important;
      transform: translateY(-1px) !important;
    }

    .auth-divider::before {
      content: '';
      position: absolute;
      left: 0; right: 0; top: 50%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(245,158,11,0.22), transparent);
    }

    .auth-step-badge {
      background: rgba(251,191,36,0.1);
      border: 1px solid rgba(245,158,11,0.18);
      color: #b45309;
    }

    @keyframes auth-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
      50%       { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
    }
    .auth-pulse-ring { animation: auth-pulse-ring 2.5s ease-in-out infinite; }

    @keyframes auth-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }
    .auth-blink-dot { animation: auth-blink 1.6s ease-in-out infinite; }

    @keyframes auth-success-pop {
      0%   { transform: scale(0.5); opacity: 0; }
      60%  { transform: scale(1.18); }
      100% { transform: scale(1); opacity: 1; }
    }
    .auth-success-pop { animation: auth-success-pop 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }

    .auth-otp-char {
      font-family: 'Inter', monospace;
      letter-spacing: 0.45em;
      caret-color: #f59e0b;
    }

    .auth-policy-link {
      color: #b45309;
      text-decoration: underline;
      text-decoration-color: rgba(180,83,9,0.3);
      text-underline-offset: 2px;
      transition: text-decoration-color 0.2s ease;
      cursor: pointer;
    }
    .auth-policy-link:hover { text-decoration-color: rgba(180,83,9,0.75); }

    .auth-dot-grid {
      background-image: radial-gradient(rgba(245,158,11,0.09) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    /* OTP boxes */
    .auth-otp-boxes {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .auth-otp-box {
      width: 44px; height: 52px;
      border: 1.5px solid rgba(245,158,11,0.2);
      border-radius: 12px;
      background: rgba(255,255,255,0.9);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800;
      color: #1a0800;
      transition: all 0.2s ease;
      font-family: 'Inter', monospace;
    }
    .auth-otp-box.filled {
      border-color: #f59e0b;
      background: rgba(251,191,36,0.07);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
    }
    .auth-otp-box.active {
      border-color: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245,158,11,0.18);
      transform: scale(1.06);
    }
    .auth-otp-box.error-box {
      border-color: rgba(239,68,68,0.5);
      background: rgba(254,242,242,0.6);
    }

    @media (prefers-reduced-motion: reduce) {
      .auth-cta-shimmer,
      .auth-pulse-ring,
      .auth-blink-dot,
      .auth-success-pop { animation: none !important; }
    }
  `}</style>
));
AuthStyles.displayName = "AuthStyles";

// ---------- Animation Variants ----------
const fadeSlide: Variants = {
  initial: { opacity: 0, y: 22, scale: 0.96, filter: "blur(5px)" },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -18, scale: 0.96, filter: "blur(5px)",
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.09 } },
};

const staggerChild: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(2px)" },
  animate: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

// ---------- Custom Hook ----------
function useAuth() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
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
      // Try edge function first for enhanced OTP delivery
      const edgeResult = await sendPhoneOtp(phone);
      if (edgeResult.success) {
        setStep("otp");
        setResendTimer(RESEND_COOLDOWN);
        setOtpSentAt(Date.now());
        return;
      }
      // Fallback to direct Supabase auth OTP
      const { error: e } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
      if (e) throw e;
      setStep("otp");
      setResendTimer(RESEND_COOLDOWN);
      setOtpSentAt(Date.now());
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValidPhone, phone]);

  const verifyOtp = useCallback(async (): Promise<boolean> => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit OTP.`);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      // Always verify through Supabase to guarantee a client session is established.
      // The edge function alone does NOT set the local Supabase session, so
      // calling only it causes getUser() to return null after "success".
      const { error: e } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: "sms",
      });
      if (e) throw e;
      return true;
    } catch (err: any) {
      setError("Incorrect OTP. Please check and try again.");
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
    setOtpSentAt(null);
  }, []);

  return {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone, otpSentAt,
    sendOtp, verifyOtp, reset,
  };
}

// ---------- Google Icon ----------
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ---------- Trust Bar ----------
const TrustBar = memo(() => (
  <div className="auth-trust-bar flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-t-3xl">
    <ShieldCheck className="h-4 w-4 text-amber-600" />
    <span className="text-amber-700" style={{ fontFamily: "'Inter', sans-serif" }}>
      Secure & encrypted — Powered by Supabase
    </span>
  </div>
));
TrustBar.displayName = "TrustBar";

// ---------- OTP Box Input (premium UX) ----------
interface OtpBoxesProps {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  disabled?: boolean;
}

const OtpBoxes = ({ value, onChange, hasError, disabled }: OtpBoxesProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on hidden input
  const handleClick = () => inputRef.current?.focus();

  return (
    <div className="relative" onClick={handleClick}>
      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value}
        maxLength={OTP_LENGTH}
        disabled={disabled}
        autoFocus
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
        aria-label="OTP input"
      />
      {/* Visual boxes */}
      <div className="auth-otp-boxes cursor-text">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const char = value[i] || "";
          const isActive = i === value.length && !disabled;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={char ? { scale: [1.15, 1], transition: { duration: 0.18 } } : {}}
              className={`auth-otp-box ${char ? "filled" : ""} ${isActive ? "active" : ""} ${hasError ? "error-box" : ""}`}
            >
              {char || (isActive ? <span style={{ opacity: 0.3, fontSize: 28, lineHeight: 1 }}>|</span> : "")}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Phone Step ----------
const PhoneStep = ({
  phone, setPhone, isValidPhone, loading, onSendOtp, error,
}: {
  phone: string;
  setPhone: (v: string) => void;
  isValidPhone: boolean;
  loading: boolean;
  onSendOtp: () => void;
  error: string | null;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mt-6 space-y-4">
      <motion.div variants={staggerChild}>
        <div className={`auth-input-group flex items-center gap-3 rounded-2xl px-4 py-3.5 ${error ? "error" : isValidPhone ? "success" : ""}`}>
          <div className="auth-icon-box h-10 w-10 flex items-center justify-center rounded-[14px] shrink-0">
            <Phone className="h-5 w-5 text-amber-500" />
          </div>
          <span className="text-amber-800/60 text-sm font-bold shrink-0 border-r border-amber-200 pr-3 mr-1">
            +91
          </span>
          <Input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter" && isValidPhone && !loading) onSendOtp(); }}
            className="border-none focus-visible:ring-0 shadow-none text-lg w-full min-w-0 bg-transparent placeholder:text-gray-400 font-semibold p-0 h-auto"
            style={{ fontFamily: "'Inter', sans-serif", border: "none", boxShadow: "none", outline: "none" }}
          />
          <AnimatePresence>
            {isValidPhone && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="text-sm text-red-500 flex items-center gap-1.5 px-1 font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hint */}
      <motion.div variants={staggerChild} className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-50/60 border border-amber-100">
        <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-amber-800/70 font-medium leading-relaxed">
          We'll send a one-time password to verify your number. Standard SMS rates may apply.
        </p>
      </motion.div>

      <motion.div variants={staggerChild}>
        <Button
          disabled={!isValidPhone || loading}
          onClick={onSendOtp}
          className="auth-cta-shimmer w-full h-14 rounded-2xl text-base"
        >
          {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending OTP...</> : "Send OTP →"}
        </Button>
      </motion.div>
    </motion.div>
  );
};

// ---------- OTP Step ----------
const OtpStep = ({
  phone, otp, setOtp, loading, onVerify, onBack, onResend, resendTimer, error, otpSentAt,
}: {
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  loading: boolean;
  onVerify: () => void;
  onBack: () => void;
  onResend: () => void;
  resendTimer: number;
  error: string | null;
  otpSentAt: number | null;
}) => {
  // Auto-submit when OTP is complete — use a ref guard so we only fire once
  // per complete OTP entry. Without the guard, when `loading` flips false after
  // verification the effect re-runs and triggers a second verify call.
  const hasAutoSubmitted = useRef(false);
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !loading && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      const t = setTimeout(() => onVerify(), 350);
      return () => clearTimeout(t);
    }
    // Reset guard when user clears/changes OTP
    if (otp.length < OTP_LENGTH) {
      hasAutoSubmitted.current = false;
    }
  }, [otp, loading]);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mt-5 space-y-5">
      <motion.div variants={staggerChild}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-amber-700/70 hover:text-amber-800 transition-colors group"
        >
          <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-100/70 group-hover:bg-amber-200/60 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span className="font-semibold">Change number</span>
        </button>
      </motion.div>

      {/* Sent badge */}
      <motion.div variants={staggerChild} className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/90 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
          <span className="auth-blink-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
          OTP sent to +91 {phone}
        </div>
      </motion.div>

      {/* OTP Boxes */}
      <motion.div variants={staggerChild} className="flex flex-col items-center gap-4">
        <div className={`w-full flex flex-col items-center gap-3 rounded-2xl px-4 py-5 transition-all ${error ? "bg-red-50/40 border border-red-200/60" : "auth-input-group"}`}>
          <div className="auth-icon-box h-9 w-9 flex items-center justify-center rounded-[12px] auth-pulse-ring mb-1">
            <Lock className="h-4 w-4 text-amber-500" />
          </div>
          <OtpBoxes
            value={otp}
            onChange={setOtp}
            hasError={!!error}
            disabled={loading}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-red-500 flex items-center gap-1.5 font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={staggerChild}>
        <Button
          disabled={otp.length !== OTP_LENGTH || loading}
          onClick={onVerify}
          className="auth-cta-shimmer w-full h-14 rounded-2xl text-base"
        >
          {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : "Verify & Continue"}
        </Button>
      </motion.div>

      <motion.div variants={staggerChild} className="text-center text-sm">
        {resendTimer === 0 ? (
          <button
            onClick={onResend}
            disabled={loading}
            className="text-amber-700 hover:text-amber-950 font-bold hover:underline underline-offset-4 transition-colors disabled:opacity-50"
          >
            Resend OTP
          </button>
        ) : (
          <span className="text-gray-400 font-medium">
            Resend available in{" "}
            <span className="font-black text-amber-600 tabular-nums">{resendTimer}s</span>
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};

// ---------- Social Login ----------
const SocialLogin = ({
  googleLoading,
  setGoogleLoading,
}: {
  googleLoading: boolean;
  setGoogleLoading: (v: boolean) => void;
}) => {
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setGoogleError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="auth-divider relative my-5 flex items-center justify-center">
        <span className="relative z-10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 bg-[#fffdf5]/90">
          or continue with
        </span>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.35 } }}
        whileHover={{ scale: 1.012, translateY: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogle}
        disabled={googleLoading}
        className="auth-google-btn w-full h-13 flex items-center justify-center gap-3 rounded-2xl py-3.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {googleLoading
          ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          : <>
            <GoogleIcon />
            <span className="text-[15px] font-bold text-gray-700 tracking-tight">Continue with Google</span>
          </>
        }
      </motion.button>

      <AnimatePresence>
        {googleError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200/60 text-sm font-semibold text-red-600"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {googleError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Main AuthDialog Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const navigate = useNavigate();
  const { user, profile: contextProfile, isLoading, refreshProfile } = useAuthContext();

  const {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone, otpSentAt,
    sendOtp, verifyOtp, reset,
  } = useAuth();

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── KEY FIX: Only check auth once when dialog opens, not on every render ──
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasCheckedRef.current = false;
      return;
    }
    if (isLoading || hasCheckedRef.current) return;

    const checkAuth = async () => {
      hasCheckedRef.current = true;

      if (!user) return; // Not logged in — show auth form

      // User is logged in — check profile completeness
      if (contextProfile?.full_name) {
        // ✅ Existing user with complete profile → go straight to rides
        onClose();
        navigate("/available-rides");
        return;
      }

      // Logged in but profile incomplete → show profile dialog
      setShowProfileDialog(true);
    };

    checkAuth();
  }, [open, isLoading]); // intentionally minimal deps to avoid loop

  // ── Handle Phone OTP success ──
  const handleVerify = useCallback(async () => {
    const success = await verifyOtp();
    if (!success) return;

    // Fetch fresh user + profile after verification
    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
    if (!verifiedUser) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", verifiedUser.id)
      .single();

    if (profile?.full_name) {
      // Returning user — go directly
      onClose();
      navigate("/available-rides");
    } else {
      // New user — collect profile info
      setShowProfileDialog(true);
    }
  }, [verifyOtp, onClose, navigate]);

  const handleResend = useCallback(() => sendOtp(), [sendOtp]);

  const handleCloseAuth = useCallback(() => {
    reset();
    setGoogleLoading(false);
    onClose();
  }, [reset, onClose]);

  const handleCloseProfile = useCallback(async () => {
    setShowProfileDialog(false);
    onClose();
    await refreshProfile();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const { data: prf } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      if (prf?.full_name) navigate("/available-rides");
    }
  }, [onClose, navigate, refreshProfile]);

  const handleBackFromProfile = useCallback(() => {
    setShowProfileDialog(false);
    reset();
  }, [reset]);

  // Extract clean phone for profile dialog (from logged in user)
  const profilePhone = phone || extractIndianPhone(user?.phone);

  return (
    <>
      <AuthStyles />

      <Dialog open={open && !showProfileDialog} onOpenChange={handleCloseAuth}>
        <DialogContent className="auth-dialog-content sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border-0">
          <div className="auth-dot-grid absolute inset-0 opacity-[0.07] pointer-events-none rounded-3xl" />

          <TrustBar />

          <div className="p-6 md:p-8 space-y-5 relative z-10">
            <DialogHeader className="space-y-3">
              <DialogDescription className="sr-only">
                Sign in or create your Xpool account
              </DialogDescription>
              <div className="flex flex-col items-center text-center space-y-2">
                {/* Logo mark */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
                  className="h-16 w-16 rounded-2xl overflow-hidden mb-1 shadow-[0_8px_24px_rgba(245,158,11,0.25)] flex items-center justify-center bg-white border border-amber-500/10"
                >
                  <img src={xpoolLogo} alt="Xpool Logo" className="w-full h-full object-cover" />
                </motion.div>

                <DialogTitle
                  className="text-3xl font-black text-gray-900 tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {step === "phone" ? "Welcome to Xpool" : "Verify Your Number"}
                </DialogTitle>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[290px]">
                  {step === "phone"
                    ? "Sign in or create your account to continue booking rides."
                    : `Enter the 6-digit OTP sent to +91 ${phone}`}
                </p>
              </div>
            </DialogHeader>

            {/* Step indicator */}
            {step === "otp" && (
              <div className="flex justify-center">
                <span
                  className="auth-step-badge px-3 py-1 text-[11px] font-bold rounded-full tracking-wider uppercase"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Step 2 of 3
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div key="phone-step" {...fadeSlide}>
                  <PhoneStep
                    phone={phone}
                    setPhone={setPhone}
                    isValidPhone={isValidPhone}
                    loading={loading}
                    onSendOtp={sendOtp}
                    error={error}
                  />
                </motion.div>
              ) : (
                <motion.div key="otp-step" {...fadeSlide}>
                  <OtpStep
                    phone={phone}
                    otp={otp}
                    setOtp={setOtp}
                    loading={loading}
                    onVerify={handleVerify}
                    onBack={() => { setStep("phone"); setError(null); }}
                    onResend={handleResend}
                    resendTimer={resendTimer}
                    error={error}
                    otpSentAt={otpSentAt}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <SocialLogin googleLoading={googleLoading} setGoogleLoading={setGoogleLoading} />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.35 } }}
              className="text-[11px] text-center text-gray-400 px-2 leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              By continuing, you agree to our{" "}
              <span className="auth-policy-link">Terms of Service</span>{" "}
              &{" "}
              <span className="auth-policy-link">Privacy Policy</span>
            </motion.p>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileSummaryDialog
        open={showProfileDialog}
        phone={profilePhone}
        onClose={handleCloseProfile}
        onBack={handleBackFromProfile}
      />
    </>
  );
};

export default AuthDialog;