import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";

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

type Step = 1 | 2 | 3;

const EMPTY_PROFILE: ProfileData = {
  fullName: "",
  email: "",
  city: "",
  dob: "",
  phone: "",
};

const validators: Record<keyof Omit<ProfileData, "phone">, (v: string) => string | null> = {
  fullName: (v) => (v.trim().length < 3 ? "Must be at least 3 characters" : null),
  email: (v) =>
    v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Enter a valid email address"
      : null,
  city: (v) => (v.trim().length < 2 ? "Enter your city" : null),
  dob: (v) => (!v ? "Date of birth is required" : null),
};

const STEP_LABELS: Record<Step, string> = {
  1: "Confirm Phone",
  2: "Your Details",
  3: "Review",
};

const TOTAL_STEPS = 3;

const ProfileSummaryDialog = ({
  open,
  phone,
  onClose,
  onBack,
}: ProfileSummaryDialogProps) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState<Set<keyof ProfileData>>(new Set());
  const [focusedField, setFocusedField] = useState<keyof ProfileData | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSaved(false);
    setTouched(new Set());

    try {
      const storedProfile = localStorage.getItem("profile");
      const base = storedProfile
        ? { ...EMPTY_PROFILE, ...JSON.parse(storedProfile) }
        : EMPTY_PROFILE;
      setProfile({ ...base, phone: phone || base.phone });
    } catch {
      setProfile({ ...EMPTY_PROFILE, phone: phone || "" });
    }
  }, [open, phone]);

  const errors = useMemo<Partial<Record<keyof ProfileData, string>>>(() => ({
    fullName: validators.fullName(profile.fullName) ?? undefined,
    email: validators.email(profile.email) ?? undefined,
    city: validators.city(profile.city) ?? undefined,
    dob: validators.dob(profile.dob) ?? undefined,
  }), [profile]);

  const isStep2Valid =
    !errors.fullName && !errors.email && !errors.city && !errors.dob;

  const completion = useMemo(() => {
    const fields = Object.values(profile);
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const goBack = useCallback(() => {
    if (step === 1) {
      onBack?.();
      onClose();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }, [step, onBack, onClose]);

  const goNext = useCallback(() => {
    if (step === 2) {
      setTouched(new Set(["fullName", "email", "city", "dob"] as (keyof ProfileData)[]));
      if (!isStep2Valid) return;
    }
    setStep((s) => (s + 1) as Step);
  }, [step, isStep2Valid]);

  const handleSave = useCallback(() => {
    setLoading(true);
    localStorage.setItem("profile", JSON.stringify(profile));

    setTimeout(() => {
      setSaved(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
        navigate("/vehicles");
      }, 700);
    }, 900);
  }, [profile, navigate, onClose]);

  const update = (key: keyof ProfileData, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const touchField = (key: keyof ProfileData) =>
    setTouched((prev) => new Set([...prev, key]));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-card/95 backdrop-blur-xl shadow-2xl border-0">

        {/* TRUST BAR */}
        <div className="flex items-center justify-center gap-2 bg-primary/10 py-3 text-sm text-primary font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Profile stored securely on this device
        </div>

        {/* TOP NAV: back + step badge */}
        <div className="flex items-center justify-between px-6 mt-4">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="font-medium">
              {step === 1 ? "Go back" : STEP_LABELS[(step - 1) as Step]}
            </span>
          </button>

          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary tracking-wide">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        <div className="p-6 space-y-5">

          {/* HEADER */}
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-2xl font-bold">
              {STEP_LABELS[step]}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              {step === 1 && "Confirm your registered phone number"}
              {step === 2 && "Fill in your personal details to continue"}
              {step === 3 && "Review your information before saving"}
            </p>
          </DialogHeader>

          {/* STEP DOTS */}
          <div className="flex items-center justify-center gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-300 ${s === step
                    ? "w-6 h-2 bg-primary"
                    : s < step
                      ? "w-2 h-2 bg-primary/60"
                      : "w-2 h-2 bg-muted"
                  }`}
              />
            ))}
          </div>

          {/* ---- STEP 1: Phone Confirm ---- */}
          {step === 1 && (
            <div className="space-y-5">
              <InputBlock
                icon={<Phone className="h-4 w-4" />}
                label="Phone number"
                value={profile.phone ? `+91 ${profile.phone}` : ""}
                readOnly
              />

              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-sm text-center text-muted-foreground leading-relaxed">
                This number was used for OTP verification.{" "}
                <br />
                <span className="text-foreground font-medium">Is this correct?</span>
              </div>

              <Button
                onClick={goNext}
                className="w-full h-14 rounded-2xl text-lg font-semibold"
              >
                Yes, Continue
              </Button>
            </div>
          )}

          {/* ---- STEP 2: Personal Details ---- */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {completion === 100 ? "All fields complete" : "Fill all required fields"}
                  </p>
                  <p className="text-xs font-medium text-primary">{completion}%</p>
                </div>
              </div>

              <div className="space-y-3">
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

              <Button
                onClick={goNext}
                disabled={!isStep2Valid}
                className="w-full h-14 rounded-2xl text-lg font-semibold"
              >
                Review Details
              </Button>
            </div>
          )}

          {/* ---- STEP 3: Review ---- */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">
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

              <Button
                onClick={handleSave}
                disabled={loading}
                className={`w-full h-14 rounded-2xl text-lg font-semibold transition-all duration-300 ${saved ? "bg-green-500 hover:bg-green-500" : ""
                  }`}
              >
                {loading && !saved && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {saved && <CheckCircle2 className="mr-2 h-5 w-5" />}
                {saved ? "Saved!" : loading ? "Saving..." : "Confirm & Save"}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                You can edit this information anytime from your profile settings
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSummaryDialog;

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
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  </div>
);

/* ================================================================
   INPUT BLOCK
================================================================ */

const InputBlock = ({
  icon,
  label,
  value,
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
  <div className="space-y-1">
    <div
      className={[
        "flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-all duration-200",
        errorMsg ? "border-destructive bg-destructive/5" : "",
        isValid && !errorMsg ? "border-green-500/50 bg-green-500/5" : "",
        isFocused && !errorMsg && !isValid ? "border-primary shadow-sm shadow-primary/10" : "",
        !errorMsg && !isValid && !isFocused ? "border-border hover:border-primary/40" : "",
        readOnly ? "bg-muted/40 border-border cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div
        className={[
          "h-9 w-9 shrink-0 flex items-center justify-center rounded-xl transition-colors duration-200",
          errorMsg ? "bg-destructive/10 text-destructive" : "",
          isValid && !errorMsg ? "bg-green-500/10 text-green-600" : "",
          !errorMsg && !isValid ? "bg-primary/10 text-primary" : "",
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        {value && !readOnly && (
          <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5 uppercase tracking-wide">
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
          className="border-0 focus-visible:ring-0 text-base p-0 h-auto bg-transparent placeholder:text-muted-foreground/60"
        />
      </div>

      {!readOnly && (
        <div className="shrink-0">
          {isValid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {errorMsg && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
      )}
    </div>

    {errorMsg && (
      <p className="text-xs text-destructive px-2 animate-in slide-in-from-top-1 duration-200">
        {errorMsg}
      </p>
    )}
  </div>
);