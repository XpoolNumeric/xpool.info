import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants, useReducedMotion } from "framer-motion";
import { GoogleMap, useLoadScript, Polyline, MarkerF } from "@react-google-maps/api";
import {
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  Filter,
  Sparkles,
  Users,
  Car,
  Shield,
  SortAsc,
  CheckCircle2,
  MessageCircle,
  Zap,
  ArrowLeft,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { PiMotorcycleBold, PiCarProfileBold, PiVanBold } from "react-icons/pi";
import AutoRickshawIcon from "@/components/icons/AutoRickshawIcon";
import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { searchTrips, bookTrip, calculateFareRemote, notifyDriverBooking } from "@/lib/supabase/edgeFunctions";

/* ─────────────────────────────────────────────────────────
   Default Male Avatar SVG (inline data URI)
───────────────────────────────────────────────────────── */
const DEFAULT_MALE_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="64" fill="#FEF3C7"/>
  <circle cx="64" cy="48" r="22" fill="#F59E0B"/>
  <path d="M64 76c-24 0-40 14-40 32v4h80v-4c0-18-16-32-40-32z" fill="#F59E0B"/>
  <circle cx="64" cy="48" r="18" fill="#FDE68A"/>
  <ellipse cx="64" cy="46" rx="12" ry="14" fill="#FBBF24"/>
  <circle cx="57" cy="44" r="2" fill="#92400E"/>
  <circle cx="71" cy="44" r="2" fill="#92400E"/>
  <path d="M60 52c2 2 6 2 8 0" stroke="#92400E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M64 76c-20 0-36 12-36 28v4h72v-4c0-16-16-28-36-28z" fill="#FDE68A"/>
  <rect x="52" y="66" width="24" height="12" rx="6" fill="#FDE68A"/>
</svg>
`)}`;


/* ─────────── CONSTANTS ─────────── */
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

type VehicleId = "bike" | "auto" | "car" | "xl";
type SortBy = "price" | "rating" | "departure" | "seats";

interface DriverRide {
  id: string;
  driverName: string;
  driverRating: number;
  driverRides: number;
  driverPhone: string;
  driverPhoto: string;
  vehicleType: VehicleId;
  vehicleName: string;
  vehicleNumber: string;
  vehicleColor: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  savingsVsTaxiAmount: number;
  isVerified: boolean;
  features: string[];
}

const VEHICLE_ICONS: Record<VehicleId, React.ElementType> = {
  bike: PiMotorcycleBold,
  auto: AutoRickshawIcon,
  car: PiCarProfileBold,
  xl: PiVanBold,
};

const VEHICLE_LABELS: Record<VehicleId, string> = {
  bike: "Bike",
  auto: "Auto",
  car: "Car",
  xl: "SUV / XL",
};

/* ─────────── PULSE BG (matches Hero) ─────────── */
interface PulsePoint { x: number; y: number; size: number; delay: number; dur: number; opacity: number; }

const PULSE_CONFIG: PulsePoint[] = [
  { x: 8, y: 12, size: 200, delay: 0, dur: 3.4, opacity: 0.28 },
  { x: 80, y: 20, size: 160, delay: 1.2, dur: 4.0, opacity: 0.22 },
  { x: 50, y: 60, size: 240, delay: 2.0, dur: 3.8, opacity: 0.20 },
  { x: 15, y: 80, size: 140, delay: 0.6, dur: 4.6, opacity: 0.16 },
  { x: 90, y: 70, size: 180, delay: 1.8, dur: 3.5, opacity: 0.18 },
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
            background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}) 0%, rgba(245,158,11,${p.opacity * 0.5}) 42%, transparent 70%)`,
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

/* ─────────── NO MOCK DATA ─────────── */


/* ─────────── ANIMATIONS (matches Hero easing) ─────────── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

/* ──────────── XPOOL MAP STYLES (warm light — matches Hero) ──────────── */
const XPOOL_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // Base geometry — warm cream
  { elementType: "geometry", stylers: [{ color: "#fdf8f0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fdf8f0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  // Hide clutter
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  // Landscape — soft warm sand
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#fef9ee" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f5efe0" }] },
  // Roads — warm white/cream
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#f0e8d8" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#b45309" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffe9b0" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#fcd34d" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#92400e" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fff3cd" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#b45309" }] },
  // Water — soft dusty blue
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
];

/* ─────────── GLOBAL STYLES (matches Hero) ─────────── */
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    @keyframes pulse-fade {
      0%, 100% { opacity: 0; } 50% { opacity: 1; }
    }
    .pulse-blob {
      animation: pulse-fade ease-in-out infinite;
      will-change: opacity;
    }

    @keyframes shimmer-cta {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    .cta-shimmer-btn {
      background: linear-gradient(
        110deg,
        #f59e0b 0%, #fbbf24 30%,
        #fde68a 50%, #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: shimmer-cta 3s linear infinite;
      color: #1a0800 !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 24px rgba(245,158,11,0.4), 0 1px 0 rgba(255,255,255,0.35) inset;
    }
    .cta-shimmer-btn:hover {
      filter: brightness(1.07);
      box-shadow: 0 8px 36px rgba(245,158,11,0.55), 0 1px 0 rgba(255,255,255,0.35) inset;
    }

    @keyframes border-breathe {
      0%, 100% { border-color: rgba(245,158,11,0.18); }
      50%       { border-color: rgba(245,158,11,0.50); }
    }
    .badge-breathe { animation: border-breathe 3s ease-in-out infinite; }

    @keyframes blink {
      0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    .blink-dot { animation: blink 1.6s ease-in-out infinite; }

    @keyframes card-breathe {
      0%, 100% { box-shadow: 0 8px 30px rgba(245,158,11,0.12); }
      50%       { box-shadow: 0 8px 40px rgba(245,158,11,0.28); }
    }
    .selected-card { animation: card-breathe 2s ease-in-out infinite; }

    .rides-scrollbar::-webkit-scrollbar { width: 0px; }
  `}</style>
);

/* ─────────── MAIN COMPONENT ─────────── */
export default function AvailableRides() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleId | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distanceKm, setDistanceKm] = useState(15);
  const [durationMin, setDurationMin] = useState(30);
  const [passengers, setPassengers] = useState(1);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  /* Load ride data */
  useEffect(() => {
    const summaryStr = localStorage.getItem("rideSummary");
    if (summaryStr) {
      try {
        const summary = JSON.parse(summaryStr);
        if (summary.pickup) setPickup(summary.pickup);
        if (summary.drop) setDrop(summary.drop);
        if (summary.distanceKm) setDistanceKm(summary.distanceKm);
        if (summary.durationMin) setDurationMin(summary.durationMin);
        if (summary.passengers) setPassengers(summary.passengers);
      } catch (e) {
        console.error("Error reading rideSummary", e);
      }
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /* Fetch route polyline */
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (!apiKey || !pickup || !drop || !isLoaded) return;

    fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { address: pickup },
        destination: { address: drop },
        travelMode: "DRIVE",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const encoded = data?.routes?.[0]?.polyline?.encodedPolyline;
        if (encoded && window.google?.maps?.geometry?.encoding) {
          const decoded = window.google.maps.geometry.encoding.decodePath(encoded);
          const path = decoded.map((p: google.maps.LatLng) => ({ lat: p.lat(), lng: p.lng() }));
          setRoutePath(path);
        }
      })
      .catch((err) => console.error("Routes API error in AvailableRides:", err));
  }, [isLoaded, pickup, drop]);

  /* Auto-fit map to full route */
  useEffect(() => {
    if (!mapRef.current || routePath.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    routePath.forEach((pt) => bounds.extend(pt));
    mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [routePath]);

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: "none",
    styles: XPOOL_MAP_STYLES,
  }), []);

  /* Rides list & Backend Fetch */
  const { user } = useAuthContext();
  const [allRides, setAllRides] = useState<DriverRide[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      setIsLoadingRides(true);
      try {
        // Attempt Advanced Edge Function Search (Partial Matching & Routing Containment)
        let edgeTrips: any[] | null = null;
        if (pickup && drop) {
           const edgeResult = await searchTrips({
              fromLocation: pickup,
              toLocation: drop,
              vehiclePreference: vehicleFilter !== "all" ? vehicleFilter : "any",
              includePartialMatches: true,
              page: 1,
              pageSize: 50
           });
           if (edgeResult.success && edgeResult.data) {
              edgeTrips = edgeResult.data;
           }
        }

        // If edge function succeeds, map that data natively
        if (edgeTrips && edgeTrips.length > 0) {
           const formattedRides: DriverRide[] = edgeTrips.map((trip: any) => {
              const vType = (trip.vehicle_type || 'car') as VehicleId;
              const fareResult = calculateTieredFare(distanceKm || 15, Math.max(10, durationMin) || 30, vType, passengers || 1);
              
              const parsedFeatures: string[] = [];
              if (trip.ladies_only) parsedFeatures.push("Ladies Only");
              if (trip.no_smoking) parsedFeatures.push("No Smoking");
              if (trip.pet_friendly) parsedFeatures.push("Pet Friendly");
              if (vType === 'car' || vType === 'xl') parsedFeatures.push("AC");

              return {
                 id: trip.id,
                 driverName: trip.driver?.name || "Driver",
                 driverRating: trip.driver?.rating || 4.8,
                 driverRides: trip.driver?.trips_completed || 10,
                 driverPhone: "+91 00000 00000", // Usually private until booked
                 driverPhoto: trip.driver?.avatar || "",
                 vehicleType: vType,
                 vehicleName: trip.vehicle_name || "Verified Vehicle",
                 vehicleNumber: trip.vehicle_number || "TN XX 0000",
                 vehicleColor: trip.vehicle_color || "Black",
                 departureTime: trip.formatted_time || trip.travel_time?.slice(0,5) || "Next available",
                 availableSeats: trip.available_seats || 4,
                 pricePerSeat: trip.price_per_seat || fareResult.fare.perPerson,
                 savingsVsTaxiAmount: fareResult.savings.vsTaxiAmount,
                 isVerified: true,
                 features: parsedFeatures
              };
           }).filter((r: DriverRide) => r.availableSeats >= passengers);

           setAllRides(formattedRides);
           setIsLoadingRides(false);
           return;
        }

        // --- FALLBACK TO LOCAL FETCHING IF EDGE FUNCTION FAILS/EMPTY ---
        const { data: flatTrips, error } = await supabase.from('trips').select('*').eq('status', 'active');
        if (error) throw error;
        
        if (!flatTrips || flatTrips.length === 0) {
           setAllRides([]);
           setIsLoadingRides(false);
           return;
        }
        
        const userIds = [...new Set(flatTrips.map((t: any) => t.user_id))].filter(Boolean);
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        const profileMap = Object.fromEntries(profiles?.map((p: any) => [p.id, p]) || []);

        const formattedRides: DriverRide[] = flatTrips.map((trip: any) => {
          const p = profileMap[trip.user_id] || {};
          const vType = (trip.vehicle_type as VehicleId) || 'car';
          
          const fareResult = calculateTieredFare(distanceKm || 15, Math.max(10, durationMin) || 30, vType, passengers || 1);
          
          let depTime = "Next available";
          if (trip.travel_time) {
            depTime = trip.travel_time.slice(0,5);
          }
          
          const parsedFeatures: string[] = [];
          if (trip.ladies_only) parsedFeatures.push("Ladies Only");
          if (trip.no_smoking) parsedFeatures.push("No Smoking");
          if (trip.pet_friendly) parsedFeatures.push("Pet Friendly");
          if (vType === 'car' || vType === 'xl') parsedFeatures.push("AC");

          return {
            id: trip.id,
            driverName: p.full_name || "Driver",
            driverRating: p.rating || 4.8,
            driverRides: p.total_rides || 10,
            driverPhone: p.phone || "",
            driverPhoto: p.avatar_url || "",
            vehicleType: vType,
            vehicleName: trip.vehicle_name || "Verified Vehicle",
            vehicleNumber: trip.vehicle_number || "TN XX 0000",
            vehicleColor: trip.vehicle_color || "Black",
            departureTime: depTime,
            availableSeats: trip.available_seats || 4,
            pricePerSeat: trip.price_per_seat || fareResult.fare.perPerson,
            savingsVsTaxiAmount: fareResult.savings.vsTaxiAmount,
            isVerified: true,
            features: parsedFeatures
          };
        }).filter((r: DriverRide) => r.availableSeats >= passengers);

        let matchedRides = formattedRides;
        if (pickup && drop) {
          const pickupCity = pickup.split(',')[0].trim().toLowerCase();
          const dropCity = drop.split(',')[0].trim().toLowerCase();
          
          const poolMatchedRides = formattedRides.filter((r) => {
             const tripSource = flatTrips.find((t: any) => t.id === r.id)?.from_location?.toLowerCase() || '';
             const tripDest = flatTrips.find((t: any) => t.id === r.id)?.to_location?.toLowerCase() || '';
             
             const matchesOrigin = tripSource.includes(pickupCity);
             const matchesDest = tripDest.includes(dropCity);
             
             return matchesOrigin || matchesDest;
          });

          matchedRides = poolMatchedRides;
        }
        
        setAllRides(matchedRides);
      } catch (err) {
        console.error("Error fetching rides:", err);
        setAllRides([]); // Fallback to empty if backend fails
      } finally {
        setIsLoadingRides(false);
      }
    };

    fetchRides();
  }, [distanceKm, durationMin, passengers]);

  const filteredRides = useMemo(() => {
    let rides = [...allRides];
    if (vehicleFilter !== "all") rides = rides.filter((r) => r.vehicleType === vehicleFilter);
    switch (sortBy) {
      case "price": rides.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break;
      case "rating": rides.sort((a, b) => b.driverRating - a.driverRating); break;
      case "seats": rides.sort((a, b) => b.availableSeats - a.availableSeats); break;
      default: break;
    }
    return rides;
  }, [allRides, vehicleFilter, sortBy]);

  const handleSelectRide = useCallback(
    async (ride: DriverRide) => {
      setSelectedRide(ride.id);
      
      const selectedDriverData = {
        driverName: ride.driverName, driverRating: ride.driverRating,
        driverRides: ride.driverRides, driverPhone: ride.driverPhone,
        vehicleType: ride.vehicleType, vehicleName: ride.vehicleName,
        vehicleNumber: ride.vehicleNumber, pricePerSeat: ride.pricePerSeat,
        departureTime: ride.departureTime,
      };
      localStorage.setItem("selectedDriver", JSON.stringify(selectedDriverData));
      localStorage.setItem("vehicleType", JSON.stringify(ride.vehicleType));
      
      const summaryStr = localStorage.getItem("rideSummary");
      let summaryData = { pickup: pickup, drop: drop };
      if (summaryStr) {
        try {
          const summary = JSON.parse(summaryStr);
          summaryData = { ...summaryData, ...summary };
          localStorage.setItem("rideSummary", JSON.stringify({ ...summary, distanceKm, durationMin, passengers }));
        } catch (e) { /* ignore */ }
      }

      // Backend Edge Function Insertion: Securely create booking & trigger emails
      try {
         if (user) {
             const passengerLoc = summaryData.pickup || pickup || "Current Location";
             const passengerDest = summaryData.drop || drop || "Destination";
             
             const { data: response, error: invokeError } = await supabase.functions.invoke('book-trip', {
                 body: {
                     trip_id: ride.id,
                     passenger_id: user.id,
                     seats_requested: passengers,
                     payment_mode: 'online',
                     message: "Looking forward to the ride!",
                     passenger_location: passengerLoc,
                     passenger_destination: passengerDest
                 }
             });

             if (invokeError || (response && !response.success)) {
                 throw new Error(invokeError?.message || response?.error || "Failed to book trip");
             }
             
             const request = response.data;
             
             // Wait briefly for UI animation, then forward to wait-approval with ID
             setTimeout(() => {
               navigate(`/wait-approval?request_id=${request.id}`);
             }, 800);
         } else {
             // Handle unregistered booking (mock / fallback)
             setTimeout(() => navigate("/wait-approval?request_id=mock-guest"), 600);
         }
      } catch (err) {
         console.error("Edge function failed, attempting direct insert:", err);
         // Fallback: Direct database insert if edge function is unavailable
         try {
            if (user) {
               // First check if booking already exists for this trip
               const { data: existing } = await supabase
                  .from('booking_requests')
                  .select('id, status')
                  .eq('trip_id', ride.id)
                  .eq('passenger_id', user.id)
                  .in('status', ['pending', 'approved'])
                  .maybeSingle();

               if (existing) {
                  // Already booked — navigate to existing request
                  if (existing.status === 'approved') {
                     setTimeout(() => navigate(`/ride-confirmed?request_id=${existing.id}`), 400);
                  } else {
                     setTimeout(() => navigate(`/wait-approval?request_id=${existing.id}`), 400);
                  }
                  return;
               }

               const passengerLoc = summaryData.pickup || pickup || "Current Location";
               const passengerDest = summaryData.drop || drop || "Destination";
               const { data: request, error: insertError } = await supabase.from('booking_requests').insert({
                  trip_id: ride.id,
                  passenger_id: user.id,
                  seats_requested: passengers,
                  status: 'pending',
                  payment_mode: 'online',
                  payment_status: 'pending',
                  passenger_location: passengerLoc,
                  passenger_destination: passengerDest
               }).select().single();

               if (insertError) throw insertError;
               setTimeout(() => navigate(`/wait-approval?request_id=${request.id}`), 800);
            } else {
               setTimeout(() => navigate("/wait-approval?request_id=guest"), 600);
            }
         } catch (fallbackErr: any) {
            console.error("Fallback insert also failed:", fallbackErr);
            // If it's a duplicate constraint error, find the existing booking
            if (fallbackErr?.code === '23505' && user) {
               const { data: dup } = await supabase
                  .from('booking_requests')
                  .select('id, status')
                  .eq('trip_id', ride.id)
                  .eq('passenger_id', user.id)
                  .in('status', ['pending', 'approved'])
                  .maybeSingle();
               if (dup) {
                  if (dup.status === 'approved') {
                     navigate(`/ride-confirmed?request_id=${dup.id}`);
                  } else {
                     navigate(`/wait-approval?request_id=${dup.id}`);
                  }
                  return;
               }
            }
            alert("Booking failed. Please check your connection and try again.");
            setSelectedRide(null);
         }
      }
    },
    [navigate, distanceKm, durationMin, passengers, user, pickup, drop]
  );

  return (
    <>
      <PageStyles />

      {/* ── ROOT — Hero warm amber-cream background ── */}
      <div
        className="h-screen w-full relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
          fontFamily: "'Inter', sans-serif",
          isolation: "isolate",
        }}
      >
        {/* Pulse blobs — clipped to below the map so they don't wash it out */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 pointer-events-none overflow-hidden"
          style={{ top: "38vh", zIndex: 0 }}
        >
          <PulseBackground />
        </div>

        {/* Dot grid overlay — only below the map (Hero-style) */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            top: "38vh",
            zIndex: 1,
            backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Radial vignette — only below the map */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            top: "38vh",
            zIndex: 2,
            background: "radial-gradient(ellipse 90% 80% at 50% 80%, rgba(255,251,235,0) 0%, rgba(255,251,235,0.5) 100%)",
          }}
        />


        {/* ── LIVE ROUTE PILL (top-right, Hero eyebrow style) ── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="absolute top-6 right-4 z-50 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm"
          style={{ zIndex: 50 }}
        >
          <span className="blink-dot h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-widest uppercase">Live Route</span>
        </motion.div>

        {/* ── MAP ── */}
        <div className="absolute top-0 left-0 right-0 h-[38vh] z-10 overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={12}
              options={mapOptions}
              onLoad={(map) => {
                mapRef.current = map;
                if (routePath.length >= 2) {
                  const bounds = new window.google.maps.LatLngBounds();
                  routePath.forEach((pt) => bounds.extend(pt));
                  map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
                }
              }}
            >
              {routePath.length > 0 && (
                <>
                  {/* Glow halo */}
                  <Polyline path={routePath} options={{ strokeColor: "#f59e0b", strokeWeight: 14, strokeOpacity: 0.12, zIndex: 1 }} />
                  {/* Main route */}
                  <Polyline path={routePath} options={{ strokeColor: "#f59e0b", strokeWeight: 4, strokeOpacity: 1, zIndex: 2 }} />
                  {/* Origin */}
                  <MarkerF
                    position={routePath[0]}
                    icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#f59e0b", fillOpacity: 1, strokeWeight: 3, strokeColor: "#ffffff" }}
                    zIndex={10}
                  />
                  {/* Destination */}
                  <MarkerF
                    position={routePath[routePath.length - 1]}
                    icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#ea580c", fillOpacity: 1, strokeWeight: 3, strokeColor: "#ffffff" }}
                    zIndex={10}
                  />
                </>
              )}
            </GoogleMap>
          ) : (
            /* Loading shimmer matches Hero amber palette */
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#fef9ee" }}>
              <span className="flex items-center gap-2 text-amber-500 text-xs font-semibold tracking-widest uppercase">
                <Sparkles className="w-4 h-4 animate-pulse" /> Loading map…
              </span>
            </div>
          )}


        </div>

        {/* ── BOTTOM SHEET — glassmorphism over warm amber-cream ── */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 26 }}
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-t-[2.5rem]"
          style={{
            height: "68vh",
            background: "rgba(255,253,245,0.92)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderTop: "1.5px solid rgba(245,158,11,0.18)",
            boxShadow: "0 -16px 60px rgba(180,83,9,0.10), 0 -1px 0 rgba(251,191,36,0.12)",
          }}
        >
          {/* Drag handle */}
          <div className="w-full flex justify-center py-3">
            <div className="w-14 h-1.5 rounded-full bg-amber-200/80" />
          </div>

          <div className="px-5 flex-1 overflow-y-auto pb-8 rides-scrollbar">

            {/* ── Header row ── */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mb-3"
            >
              {/* Back / Edit Search button */}
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors group"
                >
                  <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                    <ArrowLeft className="h-4 w-4 text-amber-700" />
                  </span>
                  <span>Edit Search</span>
                </button>

                {/* Route summary pill */}
                {pickup && drop && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/50 max-w-[200px] truncate">
                    <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{pickup.split(",")[0]}</span>
                    <span className="text-amber-400">→</span>
                    <span className="truncate">{drop.split(",")[0]}</span>
                  </div>
                )}
              </motion.div>

              <motion.div variants={fadeUp} className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Available Rides
                  </h2>

                  {/* Route meta — Hero eyebrow style */}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {[
                      { icon: <MapPin className="w-3 h-3" />, label: `${distanceKm.toFixed(1)} km` },
                      { icon: <Clock className="w-3 h-3" />, label: formatDuration(durationMin) },
                      { icon: <Users className="w-3 h-3" />, label: `${passengers} ${passengers === 1 ? "seat" : "seats"}` },
                    ].map(({ icon, label }, i) => (
                      <span
                        key={i}
                        className="badge-breathe inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200/60 bg-white/80 backdrop-blur-sm text-amber-700 text-[10.5px] font-semibold shadow-sm"
                      >
                        {icon} {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Filter toggle — Hero ghost-light style */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`mt-0.5 p-2.5 rounded-xl border transition-all duration-200 ${showFilters
                      ? "bg-amber-100 border-amber-300 text-amber-700 shadow-sm"
                      : "bg-white/80 border-amber-200/60 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                    }`}
                >
                  <Filter className="w-4.5 h-4.5 w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>

            {/* ── Filters panel ── */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div
                    className="py-4 px-4 rounded-2xl border border-amber-200/60 bg-white/80 backdrop-blur-sm shadow-sm space-y-3"
                    style={{ backdropFilter: "blur(12px)" }}
                  >
                    {/* Sort */}
                    <div>
                      <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <SortAsc className="w-3 h-3" /> Sort by
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(["price", "rating", "departure", "seats"] as SortBy[]).map((key) => (
                          <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border capitalize ${sortBy === key
                                ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                                : "bg-white border-amber-200/60 text-amber-700/70 hover:border-amber-300"
                              }`}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Car className="w-3 h-3" /> Vehicle type
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(["all", "bike", "auto", "car", "xl"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setVehicleFilter(v)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all border ${vehicleFilter === v
                                ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                                : "bg-white border-amber-200/60 text-amber-700/70 hover:border-amber-300"
                              }`}
                          >
                            {v === "all" ? "All" : VEHICLE_LABELS[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count — Hero eyebrow micro-text style */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-amber-200/40" />
              <p className="text-[10.5px] font-semibold text-amber-700/60 uppercase tracking-widest whitespace-nowrap">
                {isLoadingRides ? "Searching for rides..." : `${filteredRides.length} ride${filteredRides.length !== 1 ? "s" : ""} found`}
              </p>
              <div className="flex-1 h-px bg-amber-200/40" />
            </div>

            {/* ── Ride Cards ── */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 pb-4">
              {isLoadingRides ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : filteredRides.length === 0 ? (
                <motion.div variants={fadeUp} className="text-center py-10 space-y-4 px-4">
                  <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full border-2 border-amber-200/60 flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-9 h-9 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-gray-800">No rides match your filters</p>
                    <p className="text-xs font-medium text-gray-400">Try adjusting your vehicle type or search a different route</p>
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      onClick={() => setVehicleFilter("all")}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all shadow-sm"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-all"
                    >
                      Modify Search
                    </button>
                  </div>
                </motion.div>
              ) : (
                filteredRides.map((ride) => {
                  const Icon = VEHICLE_ICONS[ride.vehicleType];
                  const isSelected = selectedRide === ride.id;

                  return (
                    <motion.div
                      variants={fadeUp}
                      key={ride.id}
                      onClick={() => !isSelected && handleSelectRide(ride)}
                      whileHover={!prefersReducedMotion ? { scale: 1.008, y: -2, transition: { duration: 0.18 } } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.995 } : {}}
                      className={`relative p-4 rounded-[1.4rem] transition-all duration-300 cursor-pointer border ${isSelected
                          ? "selected-card bg-amber-50/90 border-amber-400 ring-1 ring-amber-400/60"
                          : "badge-breathe bg-white/80 border-amber-200/60 hover:border-amber-300 shadow-sm hover:shadow-md"
                        }`}
                      style={{ backdropFilter: "blur(8px)" }}
                    >
                      {/* Driver row */}
                      <div className="flex items-start gap-3.5">

                        {/* Avatar — Hero logo-ring style */}
                        <div
                          className={`mt-0.5 h-12 w-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center transition-all ${isSelected
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20"
                              : "bg-amber-50 border border-amber-200/80"
                            }`}
                        >
                          <img 
                            src={ride.driverPhoto || DEFAULT_MALE_AVATAR} 
                            alt={ride.driverName}
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-full h-full object-cover"
                            style={{ pointerEvents: "none" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_MALE_AVATAR;
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className={`font-extrabold tracking-tight text-[15px] ${isSelected ? "text-amber-800" : "text-gray-900"}`}>
                              {ride.driverName}
                            </h3>
                            {ride.isVerified && (
                              <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" fill="currentColor" />
                            )}
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" fill="currentColor" stroke="white" />
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200/60 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {ride.driverRating}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {ride.driverRides.toLocaleString()} rides
                            </span>
                          </div>

                          {/* Vehicle */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${isSelected ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-amber-50/80 border-amber-200/60 text-amber-600"
                              }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-700 truncate">{ride.vehicleName} · {ride.vehicleColor}</p>
                              <p className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-widest">{ride.vehicleNumber}</p>
                            </div>
                          </div>

                          {/* Feature chips — Hero badge style */}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {ride.features.slice(0, 3).map((f) => (
                              <span
                                key={f}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-amber-200/60 text-amber-700/80"
                              >
                                {f}
                              </span>
                            ))}
                            {ride.features.length > 3 && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-amber-200/40 text-gray-400">
                                +{ride.features.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price block */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[10px] font-bold text-amber-600/60">₹</span>
                            <span
                              className={`text-2xl font-extrabold tracking-tight ${isSelected ? "text-amber-700" : "text-gray-900"}`}
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {ride.pricePerSeat * passengers}
                            </span>
                          </div>

                          {/* SAVINGS BADGE */}
                          <div className="flex flex-col items-end gap-1 mb-1.5">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 border border-green-100 text-green-700 text-[9px] font-bold shadow-sm">
                              <Zap className="w-2 h-2 fill-green-500 text-green-500" />
                              Save ₹{ride.savingsVsTaxiAmount}
                            </div>
                            <span className="text-[9px] font-semibold text-amber-700/50 uppercase tracking-widest">
                              for {passengers} {passengers === 1 ? "seat" : "seats"}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700/80 bg-amber-50 border border-amber-200/60 rounded-full px-2 py-0.5">
                            <Clock className="w-2.5 h-2.5" /> {ride.departureTime}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 mt-1">
                            <Users className="w-2.5 h-2.5" /> {ride.availableSeats} left
                          </span>
                        </div>
                      </div>

                      {/* Booking feedback overlay */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 rounded-[1.4rem] bg-amber-500/5 flex items-center justify-center z-20 pointer-events-none"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-amber-200 flex items-center gap-2"
                            >
                              <Zap className="w-4 h-4 text-amber-500" />
                              <span className="font-bold text-gray-900 text-sm">Booking ride…</span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </motion.div>

            {/* Bottom hint — Hero sub-copy style */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-2 text-[11px] font-medium text-amber-600/50 pb-4 pt-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Message drivers after booking
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
