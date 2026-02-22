import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

interface ProfileSummaryDialogProps {
  open: boolean;
  phone?: string;
  onClose: () => void;
}

interface ProfileData {
  fullName: string;
  email: string;
  city: string;
  dob: string;
  phone: string;
}

const EMPTY_PROFILE: ProfileData = {
  fullName: "",
  email: "",
  city: "",
  dob: "",
  phone: "",
};

const ProfileSummaryDialog = ({
  open,
  phone,
  onClose,
}: ProfileSummaryDialogProps) => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  /* ---------------- LOAD / PREFILL ---------------- */

  useEffect(() => {
    if (!open) return;

    try {
      const saved = localStorage.getItem("profile");
      if (saved) {
        setProfile({ ...EMPTY_PROFILE, ...JSON.parse(saved) });
      } else {
        setProfile(EMPTY_PROFILE);
      }

      if (phone) {
        setProfile((p) => ({ ...p, phone }));
      }
    } catch {
      setProfile({ ...EMPTY_PROFILE, phone: phone || "" });
    }
  }, [open, phone]);

  /* ---------------- VALIDATION ---------------- */

  const errors = useMemo(() => {
    return {
      fullName: profile.fullName.trim().length < 3,
      email:
        profile.email.length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email),
      city: profile.city.trim().length < 2,
      dob: !profile.dob,
    };
  }, [profile]);

  const isValid =
    !errors.fullName &&
    !errors.email &&
    !errors.city &&
    !errors.dob;

  /* ---------------- PROGRESS ---------------- */

  const completion = useMemo(() => {
    const fields = Object.values(profile);
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  /* ---------------- SAVE ---------------- */

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    localStorage.setItem("profile", JSON.stringify(profile));

    setTimeout(() => {
      setLoading(false);
      onClose();            // close dialog
      navigate("/vehicles"); // 🚗 go to vehicle selection
    }, 800);
  };

  /* ---------------- UPDATE FIELD ---------------- */

  const update = (key: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-card/95 backdrop-blur-xl shadow-2xl">
        
        {/* 🔒 TRUST BAR */}
        <div className="flex items-center justify-center gap-2 bg-primary/10 py-3 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" />
          Profile stored securely on this device
        </div>

        {/* STEP BADGE */}
        <div className="flex justify-center mt-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            Step 2 of 3
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* HEADER */}
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-2xl font-bold">
              Profile Summary
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              Complete your details to continue
            </p>
          </DialogHeader>

          {/* PROGRESS BAR */}
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {completion}% complete
            </p>
          </div>

          {/* INPUTS */}
          <div className="space-y-4">
            <InputBlock
              icon={<Phone />}
              label="Phone number"
              value={profile.phone ? `+91 ${profile.phone}` : ""}
              readOnly
            />

            <InputBlock
              icon={<User />}
              label="Full name"
              value={profile.fullName}
              error={touched && errors.fullName}
              autoFocus
              onChange={(v) => update("fullName", v)}
            />

            <InputBlock
              icon={<Mail />}
              label="Email address"
              value={profile.email}
              error={touched && errors.email}
              onChange={(v) => update("email", v)}
            />

            <InputBlock
              icon={<MapPin />}
              label="City"
              value={profile.city}
              error={touched && errors.city}
              onChange={(v) => update("city", v)}
            />

            <InputBlock
              icon={<Calendar />}
              label="Date of birth"
              type="date"
              value={profile.dob}
              error={touched && errors.dob}
              onChange={(v) => update("dob", v)}
            />
          </div>

          {/* ACTION */}
          <Button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="w-full h-14 rounded-2xl text-lg font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Save & Continue
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            You can edit this information anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSummaryDialog;

/* ---------------- INPUT BLOCK ---------------- */

const InputBlock = ({
  icon,
  label,
  value,
  onChange,
  type = "text",
  error,
  autoFocus,
  readOnly,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  error?: boolean;
  autoFocus?: boolean;
  readOnly?: boolean;
}) => (
  <div className="space-y-1">
    <div
      className={`flex items-center gap-3 border rounded-2xl px-4 py-4 transition
      ${error ? "border-destructive" : "focus-within:border-primary"}
      ${readOnly ? "bg-muted/40" : ""}`}
    >
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <Input
        type={type}
        value={value}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder={label}
        onChange={(e) => onChange?.(e.target.value)}
        className="border-0 focus-visible:ring-0 text-lg"
      />
    </div>

    {error && (
      <p className="text-xs text-destructive px-2">
        Please enter a valid {label.toLowerCase()}
      </p>
    )}
  </div>
);
