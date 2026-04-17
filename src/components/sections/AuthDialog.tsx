import {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
  useMemo,
  useTransition,
  useId,
} from "react";
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
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ProfileSummaryDialog from "./ProfileSummaryDialog";
import { useAuthContext } from "@/contexts/AuthContext";

// ---------- Constants ----------
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/i;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const MAX_RETRIES = 3;

// ---------- Utility: extract clean 10-digit Indian mobile ----------
export function extractIndianPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  if (digits.length === 10) return digits;
  return digits.slice(-10);
}

// ---------- Types ----------
interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp" | "email";

// ---------- Custom Hooks ----------

/** Manages OTP & phone authentication state with retry/resend logic */
function usePhoneAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isValidPhone = PHONE_REGEX.test(phone);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Manage countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [resendTimer]);

  const sendOtp = useCallback(async () => {
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return false;
    }
    if (attempts >= MAX_RETRIES) {
      setError("Too many attempts. Please try again later.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const edgeResult = await sendPhoneOtp(phone);
      if (edgeResult.success) {
        setResendTimer(RESEND_COOLDOWN);
        setAttempts((prev) => prev + 1);
        return true;
      }
      const { error: e } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });
      if (e) throw e;
      setResendTimer(RESEND_COOLDOWN);
      setAttempts((prev) => prev + 1);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isValidPhone, phone, attempts]);

  const verifyOtp = useCallback(async (): Promise<boolean> => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit OTP.`);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
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

  const resetPhoneState = useCallback(() => {
    setPhone("");
    setOtp("");
    setError(null);
    setResendTimer(0);
    setAttempts(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  return {
    phone,
    setPhone,
    otp,
    setOtp,
    loading,
    error,
    setError,
    resendTimer,
    isValidPhone,
    sendOtp,
    verifyOtp,
    resetPhoneState,
  };
}

/** Manages email/password authentication */
function useEmailAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = EMAIL_REGEX.test(email);

  const loginWithEmail = useCallback(async (): Promise<boolean> => {
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (e) throw e;
      return true;
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [email, password, isValidEmail]);

  const resetEmailState = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    setError,
    isValidEmail,
    loginWithEmail,
    resetEmailState,
  };
}

// ---------- Google Icon ----------
const GoogleIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
));
GoogleIcon.displayName = "GoogleIcon";

// ---------- Trust Bar ----------
const TrustBar = memo(() => (
  <div className="auth-trust-bar flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-t-3xl bg-amber-50/40">
    <ShieldCheck className="h-4 w-4 text-amber-600" />
    <span className="text-amber-700">Secure & encrypted</span>
  </div>
));
TrustBar.displayName = "TrustBar";

// ---------- OTP Box Input (enhanced with paste support) ----------
interface OtpBoxesProps {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  disabled?: boolean;
}

const OtpBoxes = memo(({ value, onChange, hasError, disabled }: OtpBoxesProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerId = useId();

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "");
      if (pasted.length > 0) {
        onChange(pasted.slice(0, OTP_LENGTH));
      }
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && value.length === 0) {
        // allow backspace to do nothing extra, but keep default behaviour
        return;
      }
      if (e.key === "Enter" && value.length === OTP_LENGTH) {
        inputRef.current?.form?.requestSubmit();
      }
    },
    [value.length]
  );

  return (
    <div className="relative w-full" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        maxLength={OTP_LENGTH}
        disabled={disabled}
        autoFocus
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 w-full h-full cursor-text"
        aria-label={`Enter ${OTP_LENGTH}-digit OTP`}
        aria-describedby={`${containerId}-otp-hint`}
      />
      <div className="auth-otp-boxes flex justify-center gap-2 cursor-text">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const char = value[i] || "";
          const isActive = i === value.length && !disabled;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={char ? { scale: [1.15, 1], transition: { duration: 0.18 } } : {}}
              className={`auth-otp-box w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 transition-all ${char
                ? "border-amber-400 bg-amber-50 shadow-sm"
                : isActive
                  ? "border-amber-400 bg-white shadow-md ring-2 ring-amber-200"
                  : "border-gray-200 bg-white/80"
                } ${hasError ? "border-red-400 bg-red-50" : ""}`}
            >
              {char || (isActive ? <span className="text-amber-300 animate-pulse">|</span> : "")}
            </motion.div>
          );
        })}
      </div>
      <p id={`${containerId}-otp-hint`} className="sr-only">
        One time password input, {value.length} of {OTP_LENGTH} digits entered
      </p>
    </div>
  );
});
OtpBoxes.displayName = "OtpBoxes";

// ---------- Subcomponents ----------
interface PhoneStepProps {
  phone: string;
  setPhone: (v: string) => void;
  isValidPhone: boolean;
  loading: boolean;
  error: string | null;
  onSendOtp: () => void;
}

const PhoneStep = memo(
  ({ phone, setPhone, isValidPhone, loading, error, onSendOtp }: PhoneStepProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-4 space-y-3"
      >
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 transition-all ${error
            ? "border-red-300 bg-red-50/50"
            : isValidPhone
              ? "border-green-300 bg-green-50/30"
              : "border-gray-200 bg-white/80"
            } focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100`}
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <span className="text-amber-700 font-bold border-r border-amber-200 pr-3">+91</span>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidPhone && !loading) onSendOtp();
            }}
            className="border-none focus-visible:ring-0 shadow-none text-base w-full bg-transparent p-0 h-auto font-medium focus:outline-none"
            aria-label="Mobile number"
            aria-invalid={!!error}
            aria-describedby="phone-error"
          />
          {isValidPhone && !error && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              id="phone-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-red-500 flex items-center gap-1.5 px-1 font-medium"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/70 border border-amber-100">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
            We'll send a one‑time password via SMS. Standard rates may apply.
          </p>
        </div>

        <Button
          disabled={!isValidPhone || loading}
          onClick={onSendOtp}
          className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {loading ? "Sending OTP..." : "Send OTP →"}
        </Button>
      </motion.div>
    );
  }
);
PhoneStep.displayName = "PhoneStep";

interface OtpStepProps {
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  loading: boolean;
  error: string | null;
  resendTimer: number;
  onVerify: () => void;
  onBack: () => void;
  onResend: () => void;
}

const OtpStep = memo(
  ({
    phone,
    otp,
    setOtp,
    loading,
    error,
    resendTimer,
    onVerify,
    onBack,
    onResend,
  }: OtpStepProps) => {
    const autoSubmittedRef = useRef(false);
    const [isPending, startTransition] = useTransition();

    // Auto-submit when OTP is complete (with transition to avoid UI freeze)
    useEffect(() => {
      if (otp.length === OTP_LENGTH && !loading && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        startTransition(() => {
          onVerify();
        });
      }
      if (otp.length < OTP_LENGTH) {
        autoSubmittedRef.current = false;
      }
    }, [otp, loading, onVerify]);

    const maskedPhone = useMemo(() => {
      if (phone.length <= 6) return phone;
      return `******${phone.slice(-4)}`;
    }, [phone]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-3 space-y-4"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors group"
          aria-label="Go back to change phone number"
        >
          <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-100 group-hover:bg-amber-200">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span className="font-semibold">Change number</span>
        </button>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700 text-xs font-bold uppercase tracking-wide border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            OTP sent to +91 {maskedPhone}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-full rounded-2xl px-4 py-6 transition-all ${error ? "bg-red-50/60 border border-red-200" : "bg-white/80 border-2 border-gray-200"
              }`}
          >
            <OtpBoxes value={otp} onChange={setOtp} hasError={!!error} disabled={loading} />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-red-500 flex items-center gap-1.5 font-medium"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Button
          disabled={otp.length !== OTP_LENGTH || loading}
          onClick={onVerify}
          className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>

        <div className="text-center text-sm">
          {resendTimer === 0 ? (
            <button
              onClick={onResend}
              disabled={loading}
              className="text-amber-700 hover:text-amber-900 font-bold hover:underline underline-offset-4 disabled:opacity-50"
            >
              Resend OTP
            </button>
          ) : (
            <span className="text-gray-500">
              Resend available in{" "}
              <span className="font-mono font-bold text-amber-600">{resendTimer}s</span>
            </span>
          )}
        </div>
      </motion.div>
    );
  }
);
OtpStep.displayName = "OtpStep";

interface EmailStepProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  onLogin: () => void;
  onSwitchToPhone: () => void;
}

const EmailStep = memo(
  ({
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    onLogin,
    onSwitchToPhone,
  }: EmailStepProps) => {
    const emailId = useId();
    const passwordId = useId();

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-4 space-y-3"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 border-gray-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 bg-white/80">
            <Mail className="h-5 w-5 text-amber-500" />
            <input
              id={emailId}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-none focus-visible:ring-0 shadow-none text-base w-full bg-transparent p-0 h-auto focus:outline-none"
              aria-label="Email address"
              aria-invalid={!!error}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 border-gray-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 bg-white/80">
            <Lock className="h-5 w-5 text-amber-500" />
            <input
              id={passwordId}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) onLogin();
              }}
              className="border-none focus-visible:ring-0 shadow-none text-base w-full bg-transparent p-0 h-auto focus:outline-none"
              aria-label="Password"
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-red-500 flex items-center gap-1.5 px-1 font-medium"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          disabled={!email || !password || loading}
          onClick={onLogin}
          className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In →"}
        </Button>

        <div className="text-center">
          <button
            onClick={onSwitchToPhone}
            className="text-sm text-gray-500 font-medium hover:text-amber-600 transition-colors"
          >
            Login with Phone instead
          </button>
        </div>
      </motion.div>
    );
  }
);
EmailStep.displayName = "EmailStep";

interface SocialLoginProps {
  googleLoading: boolean;
  setGoogleLoading: (v: boolean) => void;
}

const SocialLogin = memo(({ googleLoading, setGoogleLoading }: SocialLoginProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (signInError) throw signInError;
      // The page will redirect; no further action needed
    } catch (err: any) {
      setError(err.message || "Google sign‑in failed. Please try again.");
      setGoogleLoading(false);
    }
  }, [setGoogleLoading]);

  return (
    <div className="w-full">
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative px-4 text-xs font-bold uppercase tracking-wider text-amber-600" style={{ background: 'linear-gradient(to bottom, rgb(255 251 235 / 0.9), white)' }}>
          or continue with
        </span>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-2.5 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        ) : (
          <>
            <GoogleIcon />
            <span className="text-sm font-semibold text-gray-700">Continue with Google</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
SocialLogin.displayName = "SocialLogin";

// ---------- Main AuthDialog Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const navigate = useNavigate();
  const { user, profile: contextProfile, isLoading, refreshProfile } = useAuthContext();
  const [step, setStep] = useState<Step>("phone");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const hasCheckedRef = useRef(false);

  const {
    phone,
    setPhone,
    otp,
    setOtp,
    loading: phoneLoading,
    error: phoneError,
    setError: setPhoneError,
    resendTimer,
    isValidPhone,
    sendOtp,
    verifyOtp,
    resetPhoneState,
  } = usePhoneAuth();

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading: emailLoading,
    error: emailError,
    setError: setEmailError,
    loginWithEmail,
    resetEmailState,
  } = useEmailAuth();

  // Reset all states when dialog closes
  const resetAll = useCallback(() => {
    resetPhoneState();
    resetEmailState();
    setStep("phone");
    setGoogleLoading(false);
    setShowProfileDialog(false);
    hasCheckedRef.current = false;
  }, [resetPhoneState, resetEmailState]);

  const handleCloseAuth = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  // Redirect or show profile after successful auth
  const handlePostAuth = useCallback(async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (!freshUser) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", freshUser.id)
      .single();

    if (profile?.full_name) {
      onClose();
      navigate("/available-rides");
    } else {
      setShowProfileDialog(true);
    }
  }, [onClose, navigate]);

  const handleVerifyOtp = useCallback(async () => {
    const success = await verifyOtp();
    if (success) await handlePostAuth();
  }, [verifyOtp, handlePostAuth]);

  const handleEmailLogin = useCallback(async () => {
    const success = await loginWithEmail();
    if (success) await handlePostAuth();
  }, [loginWithEmail, handlePostAuth]);

  const handleResendOtp = useCallback(async () => {
    await sendOtp();
  }, [sendOtp]);

  const handleSwitchToEmail = useCallback(() => {
    setStep("email");
    setPhoneError(null);
    setEmailError(null);
  }, [setPhoneError, setEmailError]);

  const handleSwitchToPhone = useCallback(() => {
    setStep("phone");
    setPhoneError(null);
    setEmailError(null);
  }, [setPhoneError, setEmailError]);

  // Check existing session when dialog opens
  useEffect(() => {
    if (!open) {
      hasCheckedRef.current = false;
      return;
    }
    if (isLoading || hasCheckedRef.current) return;

    const checkAuth = async () => {
      hasCheckedRef.current = true;
      if (!user) return;

      if (contextProfile?.full_name) {
        onClose();
        navigate("/available-rides");
      } else {
        setShowProfileDialog(true);
      }
    };
    checkAuth();
  }, [open, isLoading, user, contextProfile, onClose, navigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => resetAll();
  }, [resetAll]);

  const profilePhone = useMemo(
    () => phone || extractIndianPhone(user?.phone),
    [phone, user?.phone]
  );

  const currentError = step === "email" ? emailError : phoneError;
  const currentLoading = step === "email" ? emailLoading : phoneLoading;

  return (
    <>
      <style>{`
        @keyframes auth-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .auth-shimmer {
          background: linear-gradient(110deg, #f59e0b 0%, #fbbf24 30%, #fde68a 50%, #fbbf24 70%, #f59e0b 100%);
          background-size: 200% auto;
          animation: auth-shimmer 3s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-shimmer { animation: none; }
        }
      `}</style>

      <Dialog open={open && !showProfileDialog} onOpenChange={handleCloseAuth}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-3xl border-0 bg-gradient-to-b from-amber-50/90 to-white shadow-2xl backdrop-blur-sm">
          <TrustBar />

          <div className="p-5 md:p-6 space-y-4">
            <DialogHeader className="space-y-2 text-left">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="h-12 w-12 rounded-xl overflow-hidden shadow-md bg-white flex items-center justify-center"
              >
                <img src={xpoolLogo} alt="Xpool Logo" className="w-full h-full object-cover" />
              </motion.div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                {step === "phone" ? "Welcome to Xpool" : step === "email" ? "Sign in with Email" : "Verify your number"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {step === "phone"
                  ? "Sign in or create an account to continue booking rides."
                  : step === "email"
                    ? "Enter your email and password to sign in."
                    : `Enter the 6‑digit OTP sent to +91 ${phone}`}
              </DialogDescription>
            </DialogHeader>

            {step === "otp" && (
              <div className="flex justify-center">
                <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Step 2 of 3
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "phone" && (
                <PhoneStep
                  key="phone"
                  phone={phone}
                  setPhone={setPhone}
                  isValidPhone={isValidPhone}
                  loading={currentLoading}
                  error={currentError}
                  onSendOtp={async () => {
                    const success = await sendOtp();
                    if (success) setStep("otp");
                  }}
                />
              )}
              {step === "email" && (
                <EmailStep
                  key="email"
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  loading={currentLoading}
                  error={currentError}
                  onLogin={handleEmailLogin}
                  onSwitchToPhone={handleSwitchToPhone}
                />
              )}
              {step === "otp" && (
                <OtpStep
                  key="otp"
                  phone={phone}
                  otp={otp}
                  setOtp={setOtp}
                  loading={currentLoading}
                  error={currentError}
                  resendTimer={resendTimer}
                  onVerify={handleVerifyOtp}
                  onBack={handleSwitchToPhone}
                  onResend={handleResendOtp}
                />
              )}
            </AnimatePresence>

            {step === "phone" && (
              <div className="text-center mt-2">
                <button
                  onClick={handleSwitchToEmail}
                  className="text-sm text-gray-500 font-medium hover:text-amber-600 transition-colors"
                >
                  Login with Email instead
                </button>
              </div>
            )}

            <SocialLogin googleLoading={googleLoading} setGoogleLoading={setGoogleLoading} />

            <p className="text-[11px] text-center text-gray-400 px-2">
              By continuing, you agree to our{" "}
              <button className="auth-policy-link underline underline-offset-2 text-amber-700 hover:text-amber-900">
                Terms of Service
              </button>{" "}
              &{" "}
              <button className="auth-policy-link underline underline-offset-2 text-amber-700 hover:text-amber-900">
                Privacy Policy
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileSummaryDialog
        open={showProfileDialog}
        phone={profilePhone}
        onClose={() => {
          setShowProfileDialog(false);
          onClose();
          refreshProfile();
        }}
        onBack={() => {
          setShowProfileDialog(false);
          resetAll();
        }}
      />
    </>
  );
};

export default AuthDialog;