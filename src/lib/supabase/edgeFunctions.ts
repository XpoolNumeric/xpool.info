/**
 * Xpool Edge Functions API
 * 
 * Centralized service for all Supabase Edge Function calls.
 * Each function maps to a deployed edge function in the Supabase project.
 */
import { supabase } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EdgeFunctionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Generic invoker with error handling ──────────────────────────────────────

async function invokeEdge<T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<EdgeFunctionResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      console.error(`[EdgeFn:${functionName}] Error:`, error.message);
      return { success: false, error: error.message };
    }

    // Edge functions return { success, data, error, message }
    if (data && typeof data === 'object') {
      if (data.success === false) {
        return { success: false, error: data.error || data.message || 'Unknown error' };
      }
      return { success: true, data: data.data ?? data, message: data.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error(`[EdgeFn:${functionName}] Exception:`, err);
    return { success: false, error: err?.message || `Failed to call ${functionName}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send OTP to an Indian phone number via edge function
 */
export async function sendPhoneOtp(phone: string): Promise<EdgeFunctionResult> {
  return invokeEdge('send-phone-otp', {
    phone: phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`,
  });
}

/**
 * Verify a phone OTP 
 */
export async function verifyPhoneOtp(phone: string, otp: string): Promise<EdgeFunctionResult> {
  return invokeEdge('verify-phone-otp', {
    phone: phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`,
    token: otp,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TRIP SEARCH & FARE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchTripsParams {
  fromLocation: string;
  toLocation: string;
  vehiclePreference?: string;
  includePartialMatches?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Search available trips with smart partial matching
 */
export async function searchTrips(params: SearchTripsParams): Promise<EdgeFunctionResult> {
  return invokeEdge('search-trips', {
    fromLocation: params.fromLocation,
    toLocation: params.toLocation,
    vehiclePreference: params.vehiclePreference || 'any',
    includePartialMatches: params.includePartialMatches ?? true,
    page: params.page || 1,
    pageSize: params.pageSize || 50,
  });
}

export interface CalculateFareParams {
  distanceKm: number;
  durationMin: number;
  vehicleType: string;
  passengers: number;
}

/**
 * Server-side fare calculation (authoritative pricing)
 */
export async function calculateFareRemote(params: CalculateFareParams): Promise<EdgeFunctionResult> {
  return invokeEdge('calculate-fare', {
    distance_km: params.distanceKm,
    duration_min: params.durationMin,
    vehicle_type: params.vehicleType,
    passengers: params.passengers,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BOOKING LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

export interface BookTripParams {
  tripId: string;
  passengerId: string;
  seatsRequested: number;
  paymentMode: 'online' | 'cash';
  message?: string;
  passengerLocation?: string;
  passengerDestination?: string;
}

/**
 * Book a trip — creates booking_request and notifies driver
 */
export async function bookTrip(params: BookTripParams): Promise<EdgeFunctionResult> {
  return invokeEdge('book-trip', {
    trip_id: params.tripId,
    passenger_id: params.passengerId,
    seats_requested: params.seatsRequested,
    payment_mode: params.paymentMode,
    message: params.message || 'Looking forward to the ride!',
    passenger_location: params.passengerLocation,
    passenger_destination: params.passengerDestination,
  });
}

/**
 * Notify driver about a new booking request (called after book-trip if needed)
 */
export async function notifyDriverBooking(
  bookingRequestId: string,
  tripId: string,
  driverUserId: string
): Promise<EdgeFunctionResult> {
  return invokeEdge('notify-driver-booking', {
    booking_request_id: bookingRequestId,
    trip_id: tripId,
    driver_user_id: driverUserId,
  });
}

/**
 * Driver approves a booking request
 */
export async function approveBooking(bookingRequestId: string): Promise<EdgeFunctionResult> {
  return invokeEdge('approve-booking', {
    booking_request_id: bookingRequestId,
  });
}

/**
 * Driver rejects a booking request
 */
export async function rejectBooking(
  bookingRequestId: string,
  reason?: string
): Promise<EdgeFunctionResult> {
  return invokeEdge('reject-booking', {
    booking_request_id: bookingRequestId,
    reason: reason || 'Driver unavailable',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RIDE OTP & TRIP LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a 4-digit ride OTP for passenger-driver verification
 */
export async function generateRideOtp(bookingRequestId: string): Promise<EdgeFunctionResult> {
  return invokeEdge('generate-ride-otp', {
    booking_request_id: bookingRequestId,
  });
}

/**
 * Verify the ride OTP at pickup point
 */
export async function verifyRideOtp(
  bookingRequestId: string,
  otpCode: string
): Promise<EdgeFunctionResult> {
  return invokeEdge('verify-ride-otp', {
    booking_request_id: bookingRequestId,
    otp_code: otpCode,
  });
}

/**
 * Validate that a trip can start (checks all prerequisites)
 */
export async function validateTripStart(
  bookingRequestId: string,
  tripId: string
): Promise<EdgeFunctionResult> {
  return invokeEdge('validate-trip-start', {
    booking_request_id: bookingRequestId,
    trip_id: tripId,
  });
}

/**
 * Mark passenger as dropped off / ride complete
 */
export async function completePassengerDrop(
  bookingRequestId: string,
  tripId: string
): Promise<EdgeFunctionResult> {
  return invokeEdge('complete-passenger-drop', {
    booking_request_id: bookingRequestId,
    trip_id: tripId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PAYMENTS (Cashfree Integration)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreatePaymentOrderParams {
  bookingId?: string;
  paymentId?: string;
}

/**
 * Create a Cashfree payment order for the booking
 */
export async function createCashfreeOrder(params: CreatePaymentOrderParams): Promise<EdgeFunctionResult> {
  return invokeEdge('create-cashfree-order', {
    booking_id: params.bookingId,
    payment_id: params.paymentId,
  });
}

export interface VerifyPaymentParams {
  bookingId?: string;
  paymentId?: string;
}

/**
 * Verify that a cash payment has been collected
 */
export async function verifyCashPayment(
  params: VerifyPaymentParams
): Promise<EdgeFunctionResult> {
  return invokeEdge('verify-cash-payment', {
    booking_id: params.bookingId,
    payment_id: params.paymentId,
  });
}
