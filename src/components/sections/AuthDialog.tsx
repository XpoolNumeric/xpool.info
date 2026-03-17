import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import ProfileSummaryDialog from "./ProfileSummaryDialog";

// ---------- Constants ----------
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

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

// ---------- Custom Hook (auth logic) ----------
function useAuth(initialStep: Step = "phone") {
  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Timer effect for resend cooldown
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
        'callback': () => {
          // reCAPTCHA solved
        },
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
      await new Promise((resolve) => setTimeout(resolve, 100)); // allow recaptcha render cycle
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
      return true; // success
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
    step,
    setStep,
    phone,
    setPhone,
    otp,
    setOtp,
    loading,
    error,
    resendTimer,
    isValidPhone,
    sendOtp,
    verifyOtp,
    reset,
  };
}

// ---------- Social Icons (actual logos) ----------
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
);

// ---------- Subcomponents ----------
const TrustBar = () => (
  <div className="flex items-center justify-center gap-2 bg-primary/10 py-3 text-sm text-primary">
    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
    <span>Secure & encrypted login</span>
  </div>
);

const StepBadge = ({ currentStep }: { currentStep: number }) => (
  <div className="flex justify-center mt-4">
    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
      Step {currentStep} of 3
    </span>
  </div>
);

interface PhoneStepProps {
  phone: string;
  setPhone: (val: string) => void;
  isValidPhone: boolean;
  loading: boolean;
  onSendOtp: () => void;
  error: string | null;
}

const PhoneStep = ({
  phone,
  setPhone,
  isValidPhone,
  loading,
  onSendOtp,
  error,
}: PhoneStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, ""));
  };

  return (
    <div className="mt-6 space-y-5">
      <div
        className={`flex items-center gap-3 border rounded-2xl px-4 py-4 transition ${error ? "border-destructive" : "focus-within:border-primary"
          }`}
      >
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Phone className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="text-muted-foreground text-sm shrink-0">+91</span>
        <Input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          value={phone}
          maxLength={10}
          onChange={handlePhoneChange}
          className="border-0 focus-visible:ring-0 text-lg w-full min-w-0"
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
        />
      </div>
      {error && (
        <p id="phone-error" className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      <Button
        disabled={!isValidPhone || loading}
        onClick={onSendOtp}
        className="w-full h-14 rounded-2xl text-lg font-semibold"
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Send OTP
      </Button>
    </div>
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
  phone,
  otp,
  setOtp,
  loading,
  onVerify,
  onBack,
  onResend,
  resendTimer,
  error,
}: OtpStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, ""));
  };

  const canResend = resendTimer === 0 && !loading;

  return (
    <div className="mt-6 space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        aria-label="Change phone number"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Change number
      </button>

      <div
        className={`flex items-center gap-3 border rounded-2xl px-4 py-4 transition ${error ? "border-destructive" : "focus-within:border-primary"
          }`}
      >
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="••••••"
          value={otp}
          maxLength={OTP_LENGTH}
          onChange={handleOtpChange}
          className="border-0 text-center text-2xl tracking-[0.3em] focus-visible:ring-0 w-full"
          aria-invalid={!!error}
          aria-describedby={error ? "otp-error" : undefined}
        />
      </div>
      {error && (
        <p id="otp-error" className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <Button
        disabled={otp.length !== OTP_LENGTH || loading}
        onClick={onVerify}
        className="w-full h-14 rounded-2xl text-lg font-semibold"
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Verify & Continue
      </Button>

      <div className="text-center text-sm">
        {canResend ? (
          <button
            onClick={onResend}
            className="text-primary hover:underline"
            disabled={loading}
          >
            Resend OTP
          </button>
        ) : (
          <span className="text-muted-foreground">
            Resend OTP in {resendTimer}s
          </span>
        )}
      </div>
    </div>
  );
};

const GoogleLoginButton = ({ onSuccess, icon, label }: { onSuccess: (tokenResponse: any) => void, icon: React.ReactNode, label: string }) => {
  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      console.log('Google login successful', tokenResponse);
      onSuccess(tokenResponse);
    },
    onError: error => console.error("Google Login Failed", error)
  });

  return (
    <Button
      variant="outline"
      onClick={() => login()}
      className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-sm font-medium"
    >
      <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted shrink-0">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Button>
  );
};

const SocialLogin = ({ onGoogleSuccess }: { onGoogleSuccess: (tokenResponse: any) => void }) => {
  return (
    <GoogleOAuthProvider clientId="933710679999-idbqpvaq2a9e0mbi0qc6vuu4nifjej96.apps.googleusercontent.com">
      <Separator className="my-6" />
      <div className="space-y-3">
        <GoogleLoginButton onSuccess={onGoogleSuccess} icon={<GoogleIcon />} label="Continue with Google" />
      </div>
    </GoogleOAuthProvider>
  );
};

// ---------- Main Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const navigate = useNavigate();

  const {
    step,
    setStep,
    phone,
    setPhone,
    otp,
    setOtp,
    loading,
    error,
    resendTimer,
    isValidPhone,
    sendOtp,
    verifyOtp,
    reset,
  } = useAuth();

  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const handleVerify = useCallback(async () => {
    const success = await verifyOtp();
    if (success) {
      onClose(); // close auth dialog
      setShowProfileDialog(true); // open profile dialog
    }
  }, [verifyOtp, onClose]);

  const handleGoogleSuccess = useCallback(async (tokenResponse: any) => {
    try {
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then(res => res.json());

      const storedProfile = localStorage.getItem("profile");
      let profile = storedProfile ? JSON.parse(storedProfile) : {
        fullName: "", email: "", city: "", dob: "", phone: ""
      };

      profile.fullName = userInfo.name || profile.fullName;
      profile.email = userInfo.email || profile.email;

      localStorage.setItem("profile", JSON.stringify(profile));
      onClose(); // close auth dialog
      setShowProfileDialog(true); // open profile dialog
    } catch (err) {
      console.error("Failed to fetch Google user info", err);
    }
  }, [onClose]);

  const handleResend = useCallback(() => {
    sendOtp(); // re-use sendOtp which resets timer and moves to OTP step
  }, [sendOtp]);

  const handleCloseAuth = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCloseProfile = useCallback(() => {
    setShowProfileDialog(false);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAuth}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-card/95 backdrop-blur-xl shadow-2xl w-[calc(100%-2rem)] mx-auto"
          aria-describedby={step === "phone" ? "phone-desc" : "otp-desc"}
        >
          <TrustBar />
          <StepBadge currentStep={step === "phone" ? 1 : 2} />

          <div className="p-4 sm:p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-2xl font-bold">
                {step === "phone" ? "Verify your number" : "Enter OTP"}
              </DialogTitle>
              <p id={step === "phone" ? "phone-desc" : "otp-desc"} className="text-center text-sm text-muted-foreground">
                {step === "phone"
                  ? "We’ll send a 6-digit code to your mobile"
                  : `OTP sent to +91 ${phone}`}
              </p>
            </DialogHeader>

            {step === "phone" ? (
              <PhoneStep
                phone={phone}
                setPhone={setPhone}
                isValidPhone={isValidPhone}
                loading={loading}
                onSendOtp={sendOtp}
                error={error}
              />
            ) : (
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
            )}

            <div id="recaptcha-container" className="my-2 flex justify-center"></div>

            <SocialLogin onGoogleSuccess={handleGoogleSuccess} />

            <p className="mt-4 text-[11px] text-center text-muted-foreground px-2">
              By continuing, you agree to our Terms & Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileSummaryDialog
        open={showProfileDialog}
        phone={phone}
        onClose={handleCloseProfile}
      />
    </>
  );
};

export default AuthDialog;