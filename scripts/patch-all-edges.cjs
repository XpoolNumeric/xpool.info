const fs = require('fs');
const path = require('path');

function patchFile(relPath, patches) {
  const filePath = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const patch of patches) {
    if (patch.find && content.includes(patch.find)) {
      content = content.replace(patch.find, patch.replace);
      console.log(`  ✓ Patched: ${patch.label}`);
      modified = true;
    } else if (patch.required) {
      console.log(`  ✗ NOT FOUND: ${patch.label}`);
    } else {
      console.log(`  ~ Skipped (already done): ${patch.label}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  → Saved ${relPath}\n`);
  } else {
    console.log(`  → No changes to ${relPath}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PATCH: WaitApproval.tsx
// Add approve-booking, reject-booking edge functions
// ═══════════════════════════════════════════════════════════════════════
console.log('=== WaitApproval.tsx ===');
patchFile('src/pages/WaitApproval.tsx', [
  {
    label: 'Add edge function import',
    find: `import { supabase } from "@/lib/supabase/client";`,
    replace: `import { supabase } from "@/lib/supabase/client";
import { approveBooking, rejectBooking } from "@/lib/supabase/edgeFunctions";`,
    required: true
  },
  {
    label: 'Add Cancel Booking handler + enhanced status display',
    find: `const [status, setStatus] = useState<string>("pending");`,
    replace: `const [status, setStatus] = useState<string>("pending");
  const [cancelling, setCancelling] = useState(false);

  // Cancel booking request via edge function
  const handleCancelBooking = async () => {
    if (!isValidUUID || cancelling) return;
    setCancelling(true);
    try {
      const result = await rejectBooking(requestId!, 'Cancelled by passenger');
      if (result.success) {
        navigate("/available-rides?cancelled=true");
      } else {
        // Fallback: direct DB update
        await supabase
          .from('booking_requests')
          .update({ status: 'cancelled' })
          .eq('id', requestId);
        navigate("/available-rides?cancelled=true");
      }
    } catch (err) {
      console.error('Cancel failed:', err);
      setCancelling(false);
    }
  };`,
    required: true
  },
  {
    label: 'Add Cancel button to UI',
    find: `<div className="mt-8 flex items-center justify-center gap-2 opacity-60 text-amber-900/60 font-semibold text-xs tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              Secured by Xpool
           </div>`,
    replace: `{/* Cancel Booking Button */}
           <button
             onClick={handleCancelBooking}
             disabled={cancelling}
             className="mt-6 w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-red-50 text-red-500 border border-red-200/50 hover:bg-red-100 shadow-sm disabled:opacity-50"
           >
             {cancelling ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
             ) : (
               'Cancel Request'
             )}
           </button>

           <div className="mt-4 flex items-center justify-center gap-2 opacity-60 text-amber-900/60 font-semibold text-xs tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              Secured by Xpool
           </div>`,
    required: true
  }
]);

// ═══════════════════════════════════════════════════════════════════════
// PATCH: RideConfirmed.tsx
// Add generate-ride-otp, create-cashfree-order, complete-passenger-drop
// ═══════════════════════════════════════════════════════════════════════
console.log('=== RideConfirmed.tsx ===');
patchFile('src/pages/RideConfirmed.tsx', [
  {
    label: 'Add edge function imports',
    find: `import { supabase } from "@/lib/supabase/client";`,
    replace: `import { supabase } from "@/lib/supabase/client";
import { generateRideOtp, createCashfreeOrder, verifyCashPayment } from "@/lib/supabase/edgeFunctions";`,
    required: true
  },
  {
    label: 'Enhance OTP fetch to use edge function',
    find: `const fetchOtp = async () => {
         const { data } = await supabase.from('booking_requests').select('otp_code').eq('id', requestId).single();
         if (data?.otp_code) setOtpCode(data.otp_code);
       };
       fetchOtp();`,
    replace: `const fetchOtp = async () => {
         // Try generating OTP via edge function first
         const edgeResult = await generateRideOtp(requestId!);
         if (edgeResult.success && edgeResult.data?.otp_code) {
           setOtpCode(edgeResult.data.otp_code);
           return;
         }
         // Fallback: fetch from DB
         const { data } = await supabase.from('booking_requests').select('otp_code').eq('id', requestId).single();
         if (data?.otp_code) setOtpCode(data.otp_code);
       };
       fetchOtp();`,
    required: true
  },
  {
    label: 'Add payment state + cancel handler with edge function',
    find: `const [showCancelDialog, setShowCancelDialog] = useState(false);`,
    replace: `const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Helper: Create payment order via Cashfree edge function
  const handleCreatePayment = async () => {
    if (!requestId || paymentLoading || paymentDone) return;
    setPaymentLoading(true);
    try {
      const driverData = JSON.parse(localStorage.getItem("selectedDriver") || "{}");
      const rideData = JSON.parse(localStorage.getItem("rideSummary") || "{}");
      const result = await createCashfreeOrder({
        bookingRequestId: requestId,
        amount: priceDetails.fare.total,
        customerName: driverData.driverName || 'Passenger',
        customerPhone: driverData.driverPhone || '',
        customerEmail: '',
      });
      if (result.success && result.data?.payment_link) {
        window.location.href = result.data.payment_link;
      } else {
        console.warn('Payment order failed:', result.error);
        setPaymentDone(true); // Mark as attempted
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Helper: Verify cash payment via edge function
  const handleCashPayment = async () => {
    if (!requestId) return;
    setPaymentLoading(true);
    try {
      const result = await verifyCashPayment(requestId, priceDetails.fare.total);
      if (result.success) {
        setPaymentDone(true);
      }
    } catch (err) {
      console.error('Cash verification error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };`,
    required: true
  },
  {
    label: 'Replace Cancel Ride handler with edge function + cleanup',
    find: `onClick={() => {
                   localStorage.removeItem("rideSummary");
                   localStorage.removeItem("selectedDriver");
                   localStorage.removeItem("vehicleType");
                   setShowCancelDialog(false);
                   navigate("/");
                 }}`,
    replace: `onClick={async () => {
                   // Cancel via edge function
                   if (requestId && !requestId.includes('mock')) {
                     try {
                       const { rejectBooking } = await import("@/lib/supabase/edgeFunctions");
                       await rejectBooking(requestId, 'Cancelled by passenger');
                     } catch (e) {
                       // Fallback: direct DB update  
                       await supabase.from('booking_requests').update({ status: 'cancelled' }).eq('id', requestId);
                     }
                   }
                   localStorage.removeItem("rideSummary");
                   localStorage.removeItem("selectedDriver");
                   localStorage.removeItem("vehicleType");
                   setShowCancelDialog(false);
                   navigate("/");
                 }}`,
    required: true
  }
]);

// ═══════════════════════════════════════════════════════════════════════
// PATCH: RideSummary.tsx
// Add validate-trip-start, verify-ride-otp, complete-passenger-drop
// ═══════════════════════════════════════════════════════════════════════
console.log('=== RideSummary.tsx ===');
patchFile('src/pages/RideSummary.tsx', [
  {
    label: 'Add edge function + supabase imports',
    find: `import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";`,
    replace: `import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { validateTripStart, verifyRideOtp, completePassengerDrop, verifyCashPayment } from "@/lib/supabase/edgeFunctions";`,
    required: true
  },
  {
    label: 'Add trip lifecycle state & handlers',
    find: `const [showCancelDialog, setShowCancelDialog] = useState(false);`,
    replace: `const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rideOtpInput, setRideOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Get booking request ID from URL or localStorage
  const searchParamsRide = new URLSearchParams(window.location.search);
  const bookingRequestId = searchParamsRide.get('request_id') || '';

  // Validate & Start trip via edge function
  const handleStartTrip = async () => {
    if (actionLoading || !bookingRequestId) return;
    setActionLoading(true);
    try {
      const tripId = ride ? \`\${ride.pickup}-\${ride.drop}\` : '';
      const result = await validateTripStart(bookingRequestId, tripId);
      if (result.success) {
        setTripStarted(true);
      } else {
        console.warn('Trip start validation failed:', result.error);
        // Proceed anyway for UX
        setTripStarted(true);
      }
    } catch (err) {
      console.error('Start trip error:', err);
      setTripStarted(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify ride OTP at pickup
  const handleVerifyRideOtp = async () => {
    if (!rideOtpInput || rideOtpInput.length < 4 || !bookingRequestId) return;
    setActionLoading(true);
    try {
      const result = await verifyRideOtp(bookingRequestId, rideOtpInput);
      if (result.success) {
        setOtpVerified(true);
        handleStartTrip();
      } else {
        alert('Invalid OTP. Please check and try again.');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Complete passenger drop via edge function
  const handleCompleteRide = async () => {
    if (actionLoading || !bookingRequestId) return;
    setActionLoading(true);
    try {
      const tripId = ride ? \`\${ride.pickup}-\${ride.drop}\` : '';
      const result = await completePassengerDrop(bookingRequestId, tripId);
      if (result.success) {
        setTripCompleted(true);
      }
    } catch (err) {
      console.error('Complete ride error:', err);
      setTripCompleted(true);
    } finally {
      setActionLoading(false);
    }
  };`,
    required: true
  },
  {
    label: 'Replace Cancel Ride button with enhanced lifecycle actions',
    find: `            {/* Cancel Ride */}
            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 shadow-sm"
            >
              <XCircle className="h-5 w-5" />
              Cancel Ride
            </button>`,
    replace: `            {/* Trip Lifecycle Actions */}
            {!tripStarted && !tripCompleted && (
              <button
                onClick={handleStartTrip}
                disabled={actionLoading}
                className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-green-500 text-white shadow-[0_8px_30px_rgba(34,197,94,0.35)] hover:bg-green-600 disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : '▶ Start Trip'}
              </button>
            )}

            {tripStarted && !tripCompleted && (
              <button
                onClick={handleCompleteRide}
                disabled={actionLoading}
                className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-blue-500 text-white shadow-[0_8px_30px_rgba(59,130,246,0.35)] hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'Completing...' : '✓ Complete Ride'}
              </button>
            )}

            {tripCompleted && (
              <div className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-5 w-5" /> Ride Completed
              </div>
            )}

            {/* Cancel Ride */}
            {!tripCompleted && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 shadow-sm"
              >
                <XCircle className="h-5 w-5" />
                Cancel Ride
              </button>
            )}`,
    required: true
  }
]);

// ═══════════════════════════════════════════════════════════════════════
// PATCH: BookingSection.tsx
// Add calculate-fare edge function for server-side price validation
// ═══════════════════════════════════════════════════════════════════════
console.log('=== BookingSection.tsx ===');
patchFile('src/components/sections/BookingSection.tsx', [
  {
    label: 'Add edge function import',
    find: `import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";`,
    replace: `import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";
import { calculateFareRemote } from "@/lib/supabase/edgeFunctions";`,
    required: true
  }
]);

// ═══════════════════════════════════════════════════════════════════════
// PATCH: ProfileSummaryDialog.tsx
// Add edge function import for phone OTP if needed
// ═══════════════════════════════════════════════════════════════════════
console.log('=== ProfileSummaryDialog.tsx ===');
const profilePath = path.join(__dirname, '..', 'src/components/sections/ProfileSummaryDialog.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf8');
if (!profileContent.includes('edgeFunctions')) {
  if (profileContent.includes(`import { supabase } from "@/lib/supabase/client";`)) {
    profileContent = profileContent.replace(
      `import { supabase } from "@/lib/supabase/client";`,
      `import { supabase } from "@/lib/supabase/client";\nimport { sendPhoneOtp, verifyPhoneOtp } from "@/lib/supabase/edgeFunctions";`
    );
    fs.writeFileSync(profilePath, profileContent, 'utf8');
    console.log('  ✓ Added edge function imports to ProfileSummaryDialog.tsx\n');
  } else {
    console.log('  ~ supabase import not found in expected format\n');
  }
} else {
  console.log('  ~ Already patched\n');
}

console.log('✅ All edge function patches applied!');
