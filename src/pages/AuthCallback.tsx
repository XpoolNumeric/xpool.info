import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * AuthCallback
 *
 * This page is the OAuth redirect target (e.g. /auth/callback).
 * Supabase automatically reads the #access_token fragment from the URL,
 * establishes a session, and fires onAuthStateChange.
 * We just wait for that event and then redirect the user appropriately.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase JS v2 automatically exchanges the token from the URL hash.
    // We subscribe to the auth state change to know when it's done.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          
          // Extract Google profile data
          const googleAvatar = meta.avatar_url || meta.picture || null;
          const googleName = meta.full_name || meta.name || null;
          const googleEmail = u.email || meta.email || null;

          // Check if the user already has a complete profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", u.id)
            .single();

          // Save Google profile data to profiles table
          if (!profile || !profile.avatar_url) {
            const upsertData: Record<string, any> = {
              id: u.id,
              updated_at: new Date().toISOString(),
            };
            if (googleAvatar) upsertData.avatar_url = googleAvatar;
            if (googleName && !profile?.full_name) upsertData.full_name = googleName;
            if (googleEmail && !profile?.email) upsertData.email = googleEmail;

            await supabase.from("profiles").upsert(upsertData, { onConflict: "id" });
          }

          if (profile?.full_name) {
            // Profile complete — go straight to rides
            navigate("/available-rides", { replace: true });
          } else {
            // No profile yet — go to home where GlobalProfileChecker will prompt them
            navigate("/", { replace: true });
          }
        }
      }
    );

    // Safety timeout: if no auth event fires within 8s, redirect home
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigate("/available-rides", { replace: true });
        } else {
          setError("Authentication failed or timed out. Please try again.");
        }
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{
        background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {error ? (
        <div className="text-center space-y-3">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="text-amber-700 underline text-sm font-medium"
          >
            Go back home
          </button>
        </div>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p
            className="text-amber-700 font-semibold text-base tracking-tight"
          >
            Signing you in…
          </p>
        </>
      )}
    </div>
  );
}
