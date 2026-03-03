import { useState } from "react";
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
  Apple,
  Facebook,
  Loader2,
  ArrowLeft,
  Lock,
  ShieldCheck,
} from "lucide-react";

import ProfileSummaryDialog from "./ProfileSummaryDialog";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  /* ---------------- SEND OTP ---------------- */

  const handleSendOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1000);
  };

  /* ---------------- VERIFY OTP ---------------- */

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();                  // close auth dialog
      setShowProfileDialog(true); // open profile dialog
    }, 1200);
  };

  /* ---------------- RESET ---------------- */

  const resetDialog = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setLoading(false);
    onClose();
  };

  return (
    <>
      {/* ================= AUTH DIALOG (STEP 1) ================= */}
      <Dialog open={open} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-card/95 backdrop-blur-xl shadow-2xl">

          {/* 🔒 TRUST BAR */}
          <div className="flex items-center justify-center gap-2 bg-primary/10 py-3 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            Secure & encrypted login
          </div>

          {/* STEP BADGE */}
          <div className="flex justify-center mt-4">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              Step 1 of 3
            </span>
          </div>

          <div className="p-6">
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

            {/* 🔙 BACK */}
            {step === "otp" && (
              <button
                onClick={() => setStep("phone")}
                className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Change number
              </button>
            )}

            {/* 📱 PHONE STEP */}
            {step === "phone" && (
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3 border rounded-2xl px-4 py-4 focus-within:border-primary transition">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground text-sm">+91</span>
                  <Input
                    placeholder="Mobile number"
                    value={phone}
                    maxLength={10}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="border-0 focus-visible:ring-0 text-lg"
                  />
                </div>

                <Button
                  disabled={!isValidPhone || loading}
                  onClick={handleSendOtp}
                  className="w-full h-14 rounded-2xl text-lg font-semibold"
                >
                  {loading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Send OTP
                </Button>
              </div>
            )}

            {/* 🔐 OTP STEP */}
            {step === "otp" && (
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3 border rounded-2xl px-4 py-4 focus-within:border-primary">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    placeholder="••••••"
                    value={otp}
                    maxLength={6}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                    className="border-0 text-center text-2xl tracking-[0.3em] focus-visible:ring-0"
                  />
                </div>

                <Button
                  disabled={otp.length !== 6 || loading}
                  onClick={handleVerifyOtp}
                  className="w-full h-14 rounded-2xl text-lg font-semibold"
                >
                  {loading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Verify & Continue
                </Button>
              </div>
            )}

            {/* 🌐 SOCIAL LOGIN */}
            <Separator className="my-6" />

            <div className="space-y-3">
              <SocialButton icon={<Mail />} label="Continue with Google" onClick={handleVerifyOtp} />
              <SocialButton icon={<Apple />} label="Continue with Apple" onClick={handleVerifyOtp} />
              <SocialButton icon={<Facebook />} label="Continue with Facebook" onClick={handleVerifyOtp} />
            </div>

            <p className="mt-4 text-[11px] text-center text-muted-foreground">
              By continuing, you agree to our Terms & Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= PROFILE SUMMARY DIALOG (STEP 2) ================= */}
      <ProfileSummaryDialog
        open={showProfileDialog}
        phone={phone}               // ✅ PREFILL PHONE
        onClose={() => setShowProfileDialog(false)}
      />
    </>
  );
};

export default AuthDialog;

/* ---------------- SOCIAL BUTTON ---------------- */

const SocialButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-sm font-medium"
  >
    <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
      {icon}
    </span>
    {label}
  </Button>
);
