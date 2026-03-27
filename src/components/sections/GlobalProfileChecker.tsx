import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import ProfileSummaryDialog from "@/components/sections/ProfileSummaryDialog";

export default function GlobalProfileChecker() {
  const { user, profile, isLoading } = useAuthContext();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // If there is a logged in user, but their profile is effectively empty
    if (user && (!profile || !profile.full_name)) {
      setShowProfileDialog(true);
    } else {
      setShowProfileDialog(false);
    }
  }, [user, profile, isLoading]);

  if (!user || isLoading) return null;

  return (
    <ProfileSummaryDialog
      open={showProfileDialog}
      onClose={() => setShowProfileDialog(false)}
      // We don't provide onBack, so the user has to either close it or finish it
    />
  );
}
