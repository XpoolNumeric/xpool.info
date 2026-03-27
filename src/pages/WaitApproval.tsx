import { FC, useEffect, useState, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// Pulse Background (Match Hero UI)
// ─────────────────────────────────────────────────────────────────────────────
const PULSE_CONFIG = [
  { x: 50, y: 50, size: 280, delay: 0, dur: 3.4, opacity: 0.35 },
  { x: 30, y: 30, size: 200, delay: 0.8, dur: 4.1, opacity: 0.22 },
  { x: 70, y: 70, size: 240, delay: 1.5, dur: 3.8, opacity: 0.28 },
];

const PulseBackground = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {PULSE_CONFIG.map((p, i) => (
        <div
          key={i}
          className="pulse-blob"
          style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, rgba(245,158,11,${p.opacity}) 0%, rgba(245,158,11,${p.opacity * 0.5}) 42%, transparent 70%)`,
            filter: "blur(44px)",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            willChange: "opacity",
          }}
        />
      ))}
    </div>
  );
});
PulseBackground.displayName = "PulseBackground";

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const WaitApprovalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    @keyframes pulse-fade {
      0%, 100% { opacity: 0; } 50% { opacity: 1; }
    }
    .pulse-blob {
      animation: pulse-fade ease-in-out infinite;
      will-change: opacity;
    }

    @keyframes radar-ping {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    .radar-circle {
      animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WaitApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");
  const { user } = useAuthContext();
  
  const [status, setStatus] = useState<string>("pending");

  // Only interact with Supabase if we have a real UUID request ID
  const isValidUUID = requestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);

  useEffect(() => {
    if (!isValidUUID || !user) return;

    let isMounted = true;

    // Reusable status checker
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('status')
        .eq('id', requestId)
        .single();
        
      if (!error && data && isMounted) {
         setStatus(data.status);
         if (data.status === 'approved') {
            navigate(`/ride-confirmed?request_id=${requestId}`);
            return true; // signal to stop polling
         } else if (data.status === 'rejected') {
            navigate("/available-rides?rejected=true");
            return true;
         }
      }
      return false;
    };
    
    // Initial check
    checkStatus();

    // POLLING FALLBACK: Check every 5 seconds
    // This ensures we detect approval even if Realtime isn't enabled on the table
    const pollInterval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) clearInterval(pollInterval);
    }, 5000);

    // ALSO setup Realtime subscription (works instantly if enabled in Supabase Dashboard)
    const channel = supabase
      .channel(`request_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_requests',
          filter: `id=eq.${requestId}`
        },
        (payload: any) => {
          const newStatus = payload.new.status;
          if (!isMounted) return;
          setStatus(newStatus);
          clearInterval(pollInterval); // Stop polling, Realtime is working
          
          if (newStatus === 'approved') {
             setTimeout(() => navigate(`/ride-confirmed?request_id=${requestId}`), 500);
          } else if (newStatus === 'rejected') {
             setTimeout(() => navigate("/available-rides?rejected=true"), 500);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isValidUUID, user, navigate, requestId]);

  return (
    <>
      <WaitApprovalStyles />
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <PulseBackground />

        {/* Top Navbar actions */}
        <div className="absolute top-6 left-6 z-20">
           <button 
             onClick={() => navigate("/available-rides")}
             className="flex items-center justify-center w-10 h-10 rounded-full bg-white/60 border border-amber-200 shadow-sm backdrop-blur-md text-amber-900 transition-all hover:bg-white hover:scale-105"
           >
             <ArrowLeft className="w-5 h-5" />
           </button>
        </div>

        {/* Main Interface Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center max-w-sm w-full"
        >
          {/* Radar Animation Graphic */}
          <div className="relative flex items-center justify-center w-32 h-32 mb-10">
            <div className="absolute inset-0 rounded-full bg-amber-400 radar-circle" style={{ animationDelay: '0s' }} />
            <div className="absolute inset-0 rounded-full bg-amber-300 radar-circle" style={{ animationDelay: '1s' }} />
            <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(245,158,11,0.4)] border-4 border-white">
              <Clock className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center mb-4 leading-tight">
            Waiting for <br/> <span className="text-amber-500">Driver Approval</span>
          </h2>
          
          <p className="text-center text-gray-500 text-[15px] leading-relaxed mb-8 px-4 font-medium">
            Your booking request has been securely sent. The driver is reviewing your request right now.
          </p>

          <div className="w-full rounded-2xl border border-amber-500/10 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden p-5 flex flex-col gap-3">
             <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                <span className="text-sm font-bold text-gray-800">Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
             </div>
             <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                   className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                   initial={{ width: "30%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
                />
             </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 opacity-60 text-amber-900/60 font-semibold text-xs tracking-wide uppercase">
             <ShieldCheck className="w-4 h-4" />
             Secured by Xpool
          </div>

        </motion.div>
      </div>
    </>
  );
}
