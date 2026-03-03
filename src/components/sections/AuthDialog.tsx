import { useState, useCallback, useRef, useEffect } from "react";
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

  // Timer effect for resend cooldown
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("otp");
      setResendTimer(RESEND_COOLDOWN);
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValidPhone]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`OTP must be ${OTP_LENGTH} digits.`);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return true; // success
    } catch {
      setError("Invalid OTP. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [otp]);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setLoading(false);
    setError(null);
    setResendTimer(0);
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

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 8.3 8.05 7.97c1.27.09 2.17.86 2.92.86.75 0 2.16-1.06 3.64-.91 1.52.15 2.67.81 3.3 2.02-2.94 1.74-2.42 5.68.52 6.74-.6 1.58-1.44 3.15-2.34 4.6h-.04zM14.06 4.24c.54-1.14 1.51-2.02 2.68-2.24.3 1.34-.31 2.56-1.15 3.44-.8.86-1.96 1.43-3.12 1.35-.24-1.24.59-2.45 1.59-2.55z"
      fill="currentColor"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      fill="#1877F2"
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

const SocialLogin = ({ onSuccess }: { onSuccess: () => void }) => {
  const socialButtons = [
    { icon: <GoogleIcon />, label: "Continue with Google" },
    { icon: <AppleIcon />, label: "Continue with Apple" },
    { icon: <FacebookIcon />, label: "Continue with Facebook" },
  ];

  return (
    <>
      <Separator className="my-6" />
      <div className="space-y-3">
        {socialButtons.map(({ icon, label }) => (
          <Button
            key={label}
            variant="outline"
            onClick={onSuccess}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-sm font-medium"
          >
            <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted shrink-0">
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </Button>
        ))}
      </div>
    </>
  );
};

// ---------- Main Component ----------
const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
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
              <p className="text-center text-sm text-muted-foreground">
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

            <SocialLogin onSuccess={handleVerify} />

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