import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileSummaryDialog from "./ProfileSummaryDialog";
import { GoogleMap, DirectionsRenderer } from "@react-google-maps/api";

/* -------------------- MAP COMPONENTS -------------------- */

/**
 * Renders the route on the map using Google Directions Service
 */
const Directions = ({ origin, destination }: { origin: string; destination: string }) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!origin || !destination || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [origin, destination]);

  if (!directions) return null;

  return (
    <DirectionsRenderer
      directions={directions}
      options={{
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#f59e0b',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      }}
    />
  );
};

const mapCustomStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

// ---------- Constants ----------
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

// ---------- Firebase Setup ----------
const firebaseConfig = {
  apiKey: "AIzaSyDk4g-4ooXJ4UO2n1zBl1Rskf2S0uaioV8",
  authDomain: "xpool-89403.firebaseapp.com",
  projectId: "xpool-89403",
  storageBucket: "xpool-89403.firebasestorage.app",
  messagingSenderId: "1086162216296",
  appId: "1:1086162216296:web:8eda7e98cf853c85de22dd",
  measurementId: "G-GQZS3LDQVX"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------- Types ----------
interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp";

interface GoogleUserInfo {
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

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
    }
    .auth-divider::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.2), transparent);
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
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// ---------- Custom Hook (auth logic) ----------
function useAuth(initialStep: Step = "phone") {
  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const isValidPhone = PHONE_REGEX.test(phone);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { /* reCAPTCHA solved */ },
        'expired-callback': () => {
          setError("reCAPTCHA expired. Please try again.");
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear();
            (window as any).recaptchaVerifier = null;
          }
        }
      });
    }
  };

  const sendOtp = useCallback(async () => {
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const appVerifier = (window as any).recaptchaVerifier;
      const phoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep("otp");
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  }, [isValidPhone, phone]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`OTP must be ${OTP_LENGTH} digits.`);
      return false;
    }
    if (!confirmationResult) {
      setError("Session expired. Please request OTP again.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(otp);
      return true;
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError("Invalid OTP. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [otp, confirmationResult]);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setLoading(false);
    setError(null);
    setResendTimer(0);
    setConfirmationResult(null);
  }, []);

  return {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone,
    sendOtp, verifyOtp, reset,
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

// ---------- Google Login Button (inside provider) ----------
const GoogleLoginButton = ({
  onSuccess,
  loading: externalLoading,
}: {
  onSuccess: (tokenResponse: any) => void;
  loading: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login successful — token received', tokenResponse);
      setIsLoading(true);
      onSuccess(tokenResponse);
    },
    onError: (error) => {
      console.error("Google Login Failed", error);
      setIsLoading(false);
    },
  });

  const showLoading = isLoading || externalLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.35 } }}
    >
      <Button
        variant="outline"
        onClick={() => login()}
        disabled={showLoading}
        className="auth-google-btn w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {showLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        ) : (
          <span className="auth-google-icon-box h-9 w-9 flex items-center justify-center rounded-xl shrink-0">
            <GoogleIcon />
          </span>
        )}
        <span className="font-semibold">
          {showLoading ? "Signing in..." : "Continue with Google"}
        </span>
      </Button>
    </motion.div>
  );
};

// ---------- Social Login Wrapper ----------
const SocialLogin = ({
  onGoogleSuccess,
  googleLoading,
}: {
  onGoogleSuccess: (tokenResponse: any) => void;
  googleLoading: boolean;
}) => {
  return (
    <GoogleOAuthProvider clientId="933710679999-idbqpvaq2a9e0mbi0qc6vuu4nifjej96.apps.googleusercontent.com">
      {/* Decorative divider */}
      <div className="auth-divider my-6 flex items-center justify-center">
        <span
          className="relative z-10 px-4 text-xs font-semibold uppercase tracking-widest text-amber-600/60 bg-amber-50/80"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          or
        </span>
      </div>

      <GoogleLoginButton onSuccess={onGoogleSuccess} loading={googleLoading} />
    </GoogleOAuthProvider>
  );
};

// ---------- Main Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const navigate = useNavigate();

  const {
    step, setStep,
    phone, setPhone,
    otp, setOtp,
    loading, error, setError,
    resendTimer, isValidPhone,
    sendOtp, verifyOtp, reset,
  } = useAuth();

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuthPhone, setGoogleAuthPhone] = useState("");
  const [rideData, setRideData] = useState<any>(null);

  // ---------- Auto-Login Check ----------
  useEffect(() => {
    if (open) {
      const storedProfile = localStorage.getItem("profile");
      const savedRide = localStorage.getItem("rideSummary");

      if (savedRide) {
        setRideData(JSON.parse(savedRide));
      }

      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        if (profile.fullName && profile.email && profile.isLoggedIn) {
          // Skip sign-in if already logged in and has profile data
          onClose();
          navigate("/vehicles");
        }
      }
    }
  }, [open, onClose, navigate]);

  // ---------- Phone OTP Verify → Profile ----------
  const handleVerify = useCallback(async () => {
    const success = await verifyOtp();
    if (success) {
      // Mark as logged in
      const storedProfile = localStorage.getItem("profile");
      const profile = storedProfile ? JSON.parse(storedProfile) : { fullName: "", email: "", city: "", dob: "", phone: "" };
      profile.phone = profile.phone || phone;
      profile.isLoggedIn = true;
      localStorage.setItem("profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("storage"));

      onClose();
      // If we have ride data, we can go straight to vehicle selection
      navigate("/vehicles");
    }
  }, [verifyOtp, phone, onClose, navigate]);

  // ---------- Google Auth → Fetch user info → Profile ----------
  const handleGoogleSuccess = useCallback(async (tokenResponse: any) => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Fetch user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });

      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      const userInfo: GoogleUserInfo = await response.json();
      console.log("Google user info fetched:", userInfo);

      // Build profile from Google data
      const storedProfile = localStorage.getItem("profile");
      let profile = storedProfile
        ? JSON.parse(storedProfile)
        : { fullName: "", email: "", city: "", dob: "", phone: "" };

      // Merge Google data into profile
      profile.fullName = userInfo.name || userInfo.given_name || profile.fullName;
      profile.email = userInfo.email || profile.email;
      profile.picture = userInfo.picture || profile.picture || "";
      profile.isLoggedIn = true;

      // Save updated profile to localStorage
      localStorage.setItem("profile", JSON.stringify(profile));
      // Dispatch storage event so navbar updates instantly
      window.dispatchEvent(new Event("storage"));

      // Store the phone from existing profile (or empty) for ProfileSummaryDialog
      setGoogleAuthPhone(profile.phone || "");

      // Close auth dialog → open profile dialog
      // Close auth dialog → go to vehicle selection
      setGoogleLoading(false);
      onClose();
      navigate("/vehicles");
    } catch (err: any) {
      console.error("Failed to fetch Google user info:", err);
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }, [onClose, setError]);

  const handleResend = useCallback(() => {
    sendOtp();
  }, [sendOtp]);

  const handleCloseAuth = useCallback(() => {
    reset();
    setGoogleLoading(false);
    onClose();
  }, [reset, onClose]);

  const handleCloseProfile = useCallback(() => {
    setShowProfileDialog(false);
  }, []);

  // Determine the phone to pass to ProfileSummaryDialog
  const profilePhone = phone || googleAuthPhone;

  return (
    <>
      <AuthStyles />

      <Dialog open={open} onOpenChange={handleCloseAuth}>
        <DialogContent className="auth-dialog-content sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border-0">
          <div className="auth-dot-grid absolute inset-0 opacity-10 pointer-events-none rounded-3xl" />

          <TrustBar />

          <div className="p-6 md:p-8 space-y-6 relative z-10">
            {/* Visual Header / Map */}
            <div className="relative h-48 rounded-2xl overflow-hidden bg-amber-50/50 border border-amber-500/10 shadow-inner group">
              <AnimatePresence mode="wait">
                {rideData?.pickup && rideData?.drop ? (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0"
                  >
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      options={{
                        disableDefaultUI: true,
                        gestureHandling: 'none',
                        styles: mapCustomStyle,
                      }}
                    >
                      <Directions origin={rideData.pickup} destination={rideData.drop} />
                    </GoogleMap>
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white/90 to-transparent">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          <span className="truncate">{rideData.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-900">
                          <Navigation className="h-3 w-3 text-orange-600" />
                          <span className="truncate">{rideData.drop}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="h-16 w-16 bg-amber-100/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Your Journey Awaits</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-widest">Connect to continue</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogHeader className="space-y-3">
              <DialogDescription className="sr-only">
                Authentication process to continue booking
              </DialogDescription>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {step === "phone" ? "Welcome to Xpool" : "Verify Number"}
                </DialogTitle>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  {step === "phone"
                    ? "Verify your account to enjoy seamless rides across India."
                    : `Enter the OTP sent to +91 ${phone} to proceed.`}
                </p>
              </div>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div key="phone" {...fadeSlide}>
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
                <motion.div key="otp" {...fadeSlide}>
                  <OtpStep
                    phone={phone}
                    otp={otp}
                    setOtp={setOtp}
                    loading={loading}
                    onVerify={handleVerify}
                    onBack={() => setStep("phone")}
                    onResend={handleResend}
                    resendTimer={resendTimer}
                    error={error}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div id="recaptcha-container" className="my-2 flex justify-center"></div>

            <SocialLogin
              onGoogleSuccess={handleGoogleSuccess}
              googleLoading={googleLoading}
            />

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

      <ProfileSummaryDialog
        open={showProfileDialog}
        phone={profilePhone}
        onClose={handleCloseProfile}
      />
    </>
  );
};

export default AuthDialog;