import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { createCashfreeOrder, verifyCashPayment, generateRideOtp } from "@/lib/supabase/edgeFunctions";
import { load } from "@cashfreepayments/cashfree-js";
import { motion, Variants } from "framer-motion";
import { GoogleMap, useLoadScript, Polyline, MarkerF } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Phone,
  Star,
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  Share2,
  CheckCircle2,
  Users,
  ChevronLeft,
  Zap,
  CreditCard,
  Banknote,
} from "lucide-react";
import { XCircle } from "lucide-react";
import { calculateTieredFare, formatDuration } from "@/utils/fareCalculator";
import { PiMotorcycleBold, PiCarProfileBold, PiVanBold } from "react-icons/pi";
import AutoRickshawIcon from "@/components/icons/AutoRickshawIcon";

/* -------------------- TYPES -------------------- */
const VEHICLE_TYPES = ["bike", "auto", "car", "xl"] as const;
type VehicleKey = (typeof VEHICLE_TYPES)[number];

interface RideSummary {
  pickup: string;
  drop: string;
  distanceKm?: number;
  durationMin?: number;
  passengers?: number;
}

interface DriverInfo {
  name: string;
  rating: number;
  totalRides: number;
  phone: string;
  vehicleNumber: string;
  etaMinutes: number;
}

/* -------------------- CONSTANTS -------------------- */
const VEHICLE_ICONS: Record<VehicleKey, React.ElementType> = {
  bike: PiMotorcycleBold,
  auto: AutoRickshawIcon,
  car: PiCarProfileBold,
  xl: PiVanBold,
};

const FALLBACK_DRIVER: DriverInfo = {
  name: "Ramesh Kumar",
  rating: 4.8,
  totalRides: 1200,
  phone: "+91 98765 43210",
  vehicleNumber: "TN 09 AB 1234",
  etaMinutes: 5,
};

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

function loadSelectedDriver(): DriverInfo {
  try {
    const saved = localStorage.getItem("selectedDriver");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.driverName || FALLBACK_DRIVER.name,
        rating: parsed.driverRating || FALLBACK_DRIVER.rating,
        totalRides: parsed.driverRides || FALLBACK_DRIVER.totalRides,
        phone: parsed.driverPhone || FALLBACK_DRIVER.phone,
        vehicleNumber: parsed.vehicleNumber || FALLBACK_DRIVER.vehicleNumber,
        etaMinutes: 5,
      };
    }
  } catch (e) {
    console.error("Error loading selectedDriver", e);
  }
  return FALLBACK_DRIVER;
}

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

/* -------------------- CUSTOM HOOKS -------------------- */
function useLocalStorage<T>(key: string, initialValue: T): [T, boolean, Error | null] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to parse ${key}`));
    } finally {
      setLoading(false);
    }
  }, [key]);

  return [storedValue, loading, error];
}

function useVehicleType(defaultType: VehicleKey = "car"): [VehicleKey, boolean] {
  const [savedType, loading] = useLocalStorage<string | null>("vehicleType", null);
  const validType = useMemo(() => {
    if (savedType && VEHICLE_TYPES.includes(savedType as VehicleKey)) {
      return savedType as VehicleKey;
    }
    return defaultType;
  }, [savedType, defaultType]);
  return [validType, loading];
}

function useRideSummary(): [RideSummary | null, boolean, Error | null] {
  return useLocalStorage<RideSummary | null>("rideSummary", null);
}

function useEtaCountdown(initialEta: number): number {
  const [eta, setEta] = useState(initialEta);
  useEffect(() => {
    if (eta <= 0) return;
    const timer = setInterval(() => {
      setEta((prev) => Math.max(prev - 1, 0));
    }, 60000);
    return () => clearInterval(timer);
  }, [eta]);
  return eta;
}

/* -------------------- ANIMATION VARIANTS -------------------- */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* -------------------- SUBCOMPONENTS -------------------- */
const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <motion.header variants={fadeUp} className="text-center space-y-2">
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/50 border border-green-200/50 text-[10px] font-bold tracking-wider text-green-700 uppercase mb-2">
      <CheckCircle2 className="w-3 h-3 text-green-600" />
      Ride Booked
    </div>
    <h1 className="text-3xl font-black text-gray-900 tracking-tight font-syne">{title}</h1>
    <p className="text-sm font-semibold text-gray-400">{subtitle}</p>
  </motion.header>
);

/* ────────────────────────────────────────────────────────────
   OTP DISPLAY CARD — Rapido / Ola Aesthetic
──────────────────────────────────────────────────────────── */
const OTPDisplayCard = ({ otpCode }: { otpCode: string | null }) => {
  return (
    <motion.div variants={fadeUp} className="w-full bg-[#0a0a0a] rounded-[1.5rem] p-6 border border-gray-800 shadow-[0_20px_40px_-15px_rgba(245,158,11,0.25)] relative overflow-hidden flex items-center justify-between" style={{ backgroundImage: "linear-gradient(145deg, #1f1f1f 0%, #0a0a0a 100%)" }}>
       <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/15 rounded-full blur-[40px] pointer-events-none" />
       
       <div className="flex flex-col z-10">
          <div className="flex items-center gap-2 mb-1.5">
             <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
               <Zap className="w-3.5 h-3.5 text-amber-500" />
             </div>
             <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] drop-shadow-sm">Ride OTP</span>
          </div>
          <p className="text-gray-400 text-[11px] font-bold">Share with driver</p>
       </div>
       
       <div className="flex gap-2 z-10">
         {otpCode ? (
            otpCode.split('').map((char, idx) => (
              <div key={idx} className="w-[3.25rem] h-[3.75rem] rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner drop-shadow-md">
                 <span className="text-3xl font-black text-white font-syne">{char}</span>
              </div>
            ))
         ) : (
            [1,2,3,4].map((i) => (
              <div key={i} className="w-[3.25rem] h-[3.75rem] rounded-xl bg-white/5 flex items-center justify-center border border-white/10 animate-pulse">
                 <span className="text-3xl font-black text-gray-700 font-syne">-</span>
              </div>
            ))
         )}
       </div>
    </motion.div>
  );
};

/* ────────────────────────────────────────────────────────────
   REAL MAP — auto-fits to the full route with fitBounds
──────────────────────────────────────────────────────────── */
const RealMap = ({
  pickup,
  drop,
  onDistanceCalculated,
}: {
  pickup: string;
  drop: string;
  onDistanceCalculated: (km: number) => void;
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  /* Fetch route */
  useEffect(() => {
    if (!pickup || !drop) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (!apiKey) return;

    fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { address: pickup },
        destination: { address: drop },
        travelMode: "DRIVE",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const route = data?.routes?.[0];
        if (route) {
          const distKm = (route.distanceMeters || 0) / 1000;
          if (distKm) onDistanceCalculated(distKm);

          const encoded = route.polyline?.encodedPolyline;
          if (encoded && window.google?.maps?.geometry?.encoding) {
            const decoded = window.google.maps.geometry.encoding.decodePath(encoded);
            const path = decoded.map((p: google.maps.LatLng) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));
            setRoutePath(path);
          }
        }
      })
      .catch((err) => console.error("Routes API error:", err));
  }, [pickup, drop, onDistanceCalculated]);

  /* Auto-fit bounds whenever routePath or map becomes available */
  useEffect(() => {
    if (!mapRef.current || routePath.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    routePath.forEach((pt) => bounds.extend(pt));
    mapRef.current.fitBounds(bounds, { top: 52, right: 48, bottom: 52, left: 48 });
  }, [routePath]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: "none",
      styles: XPOOL_MAP_STYLES,
    }),
    []
  );

  if (!isLoaded) {
    return (
      <div className="relative h-52 w-full rounded-3xl overflow-hidden border border-amber-200/60 shadow-[0_8px_32px_rgba(180,83,9,0.08)]" style={{ background: "#fef9ee" }}>
        <Skeleton className="h-full w-full rounded-3xl bg-amber-100/60" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-amber-500">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      className="relative w-full rounded-3xl overflow-hidden border border-amber-200/60 shadow-[0_8px_32px_rgba(180,83,9,0.10)]"
      style={{ height: "220px" }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={mapOptions}
        /* Start centered on Chennai — fitBounds will correct this once route loads */
        center={{ lat: 13.0827, lng: 80.2707 }}
        zoom={12}
        onLoad={(map) => {
          mapRef.current = map;
          /* If route already loaded before map mounted, fit immediately */
          if (routePath.length >= 2) {
            const bounds = new window.google.maps.LatLngBounds();
            routePath.forEach((pt) => bounds.extend(pt));
            map.fitBounds(bounds, { top: 52, right: 48, bottom: 52, left: 48 });
          }
        }}
      >
        {routePath.length > 0 && (
          <>
            {/* Glow halo polyline */}
            <Polyline
              path={routePath}
              options={{
                strokeColor: "#f59e0b",
                strokeWeight: 14,
                strokeOpacity: 0.12,
                zIndex: 1,
              }}
            />
            {/* Main amber route */}
            <Polyline
              path={routePath}
              options={{
                strokeColor: "#f59e0b",
                strokeWeight: 4,
                strokeOpacity: 1,
                zIndex: 2,
              }}
            />
            {/* Origin dot */}
            <MarkerF
              position={routePath[0]}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#f59e0b",
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: "#ffffff",
              }}
              zIndex={10}
            />
            {/* Destination dot */}
            <MarkerF
              position={routePath[routePath.length - 1]}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#ea580c",
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: "#ffffff",
              }}
              zIndex={10}
            />
          </>
        )}
      </GoogleMap>

      {/* LIVE badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-amber-200/60 rounded-xl px-3 py-1.5 z-10 shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-black text-amber-700 tracking-widest uppercase">Live Pool Map</span>
      </div>

      {/* Bottom gradient bleed */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-amber-50/40 to-transparent pointer-events-none" />
    </motion.div>
  );
};

const RideSummaryCard = ({ ride }: { ride: RideSummary }) => (
  <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/60 border border-amber-900/10 shadow-sm text-left relative overflow-hidden" style={{ backdropFilter: "blur(12px)" }}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-[40px] pointer-events-none" />
    <div className="flex items-start gap-4 relative z-10">
      <div className="flex flex-col items-center mt-1">
        <MapPin className="h-5 w-5 text-amber-500 mb-1" strokeWidth={2.5} />
        <div className="w-1 h-6 bg-amber-500/20 rounded-full" />
        <MapPin className="h-5 w-5 text-orange-600 mt-1" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase mb-0.5">Pickup</p>
          <p className="font-bold text-gray-900 truncate">{ride.pickup}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase mb-0.5">Dropoff</p>
          <p className="font-bold text-gray-900 truncate">{ride.drop}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const VehicleCard = ({ type, vehicleNumber, eta }: { type: VehicleKey; vehicleNumber: string; eta: number }) => {
  const Icon = VEHICLE_ICONS[type];
  return (
    <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/70 border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(245,158,11,0.1)] relative overflow-hidden" style={{ backdropFilter: "blur(12px)" }}>
      <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-amber-400/20 rounded-full blur-[30px] pointer-events-none" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg capitalize truncate">{type} Pool</h3>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest truncate bg-gray-100 rounded px-1.5 py-0.5 w-max mt-1 border border-gray-200">{vehicleNumber}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600/80 bg-amber-50 rounded-md px-2 py-1 border border-amber-100 shadow-sm whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" />
          <span>{eta} min <span className="hidden sm:inline">away</span></span>
        </div>
      </div>
    </motion.div>
  );
};

const FareDetailsCard = ({
  fareInfo,
  passengers,
}: {
  fareInfo: ReturnType<typeof calculateTieredFare>;
  passengers: number;
}) => (
  <motion.div variants={fadeUp} className="p-5 rounded-[1.5rem] bg-[#0a0a0a] border border-gray-800 shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)] overflow-hidden relative" style={{ backgroundImage: "linear-gradient(145deg, #1f1f1f 0%, #0a0a0a 100%)" }}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-[40px] pointer-events-none" />
    <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-orange-500/10 rounded-full blur-[30px] pointer-events-none" />
    <div className="absolute top-[-2px] left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 blur-[2px]" />

    <div className="flex flex-col gap-4 relative z-10">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase border border-amber-500/20 w-max shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Users className="w-3.5 h-3.5" />
            {passengers} {passengers > 1 ? "Seats" : "Seat"} Reserved
          </div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">{fareInfo.tripDetails.tier} Pool</p>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] text-gray-400 font-bold tracking-widest uppercase mb-1 drop-shadow-sm">Your Total Fare</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] text-gray-400 font-bold -mt-2">₹</span>
            <span className="text-[48px] leading-none font-black text-white font-syne tracking-tight">{(fareInfo.fare.perPerson * passengers).toFixed(0)}</span>
          </div>
          <div className="mt-2 text-right">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-extrabold text-gray-300">
               ₹{fareInfo.fare.perPerson} <span className="text-gray-500 font-bold text-[9px]">/ seat</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent my-1" />

      {/* SAVINGS BADGES - Market Comparison */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center text-center">
          <span className="text-[8px] font-black text-green-500/60 uppercase tracking-widest mb-1">Save vs Taxi</span>
          <span className="text-sm font-black text-green-400">₹{fareInfo.savings.vsTaxiAmount}</span>
          <div className="flex items-center gap-1 mt-0.5">
             <Zap className="w-2.5 h-2.5 text-green-500" />
             <span className="text-[9px] font-bold text-green-500/70">{fareInfo.savings.vsTaxi}% Cheaper</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center text-center">
          <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest mb-1">Save vs Bus</span>
          <span className="text-sm font-black text-blue-400">₹{fareInfo.savings.vsBusAmount}</span>
          <div className="flex items-center gap-1 mt-0.5">
             <Sparkles className="w-2.5 h-2.5 text-blue-500" />
             <span className="text-[9px] font-bold text-blue-500/70">{fareInfo.savings.vsBus}% Cheaper</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent my-1" />

      {/* METRICS SECTION */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 backdrop-blur-md">
          <MapPin className="w-4 h-4 text-orange-500" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-gray-500">Distance</span>
            <span className="text-white text-xs">{fareInfo.distanceKm} km</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 backdrop-blur-md">
          <Clock className="w-4 h-4 text-amber-500" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-gray-500">Est. Time</span>
            <span className="text-white text-xs">{formatDuration(fareInfo.durationMin)}</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const DriverCard = ({ driver, onCall }: { driver: DriverInfo; onCall: () => void }) => (
  <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm space-y-4" style={{ backdropFilter: "blur(12px)" }}>
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden relative">
        <User className="h-6 w-6 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-lg truncate">{driver.name}</h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex items-center gap-1 bg-yellow-100/50 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-yellow-200/50">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {driver.rating}
          </div>
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">• {driver.totalRides.toLocaleString()} rides</span>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCall}
        className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors shadow-sm"
        aria-label={`Call ${driver.name}`}
      >
        <Phone className="h-5 w-5" strokeWidth={2.5} />
      </motion.button>
    </div>

    <div className="h-1 w-full bg-gray-100 rounded-full" />

    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
        Driver is en route to pickup
      </div>
      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Live</span>
    </div>
  </motion.div>
);

const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 rounded-2xl bg-white/50 space-y-3">
        <Skeleton className="h-14 w-full rounded-xl bg-gray-200/50" />
      </div>
    ))}
  </div>
);

/* -------------------- MAIN COMPONENT -------------------- */
const RideConfirmed = () => {
  const navigate = useNavigate();
  const [vehicleType, vehicleLoading] = useVehicleType();
  const [ride, rideLoading, rideError] = useRideSummary();
  const [driver] = useState<DriverInfo>(() => loadSelectedDriver());
  const eta = useEtaCountdown(driver.etaMinutes);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{trip_id: string; passenger_id: string; driver_id: string} | null>(null);

  // Helper: Create payment order via Cashfree edge function
  const handleCreatePayment = async () => {
    if (!requestId || paymentLoading || paymentDone) return;
    setPaymentLoading(true);
    try {
      const result = await createCashfreeOrder({
        bookingId: requestId,
      });

      if (result.success && result.data?.payment_session_id) {
        const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE === "production" ? "production" : "sandbox";
        const cashfree = await load({
          mode: cashfreeMode,
        });

        const checkoutOptions = {
          paymentSessionId: result.data.payment_session_id,
          redirectTarget: "_self" as const,
        };
        await cashfree.checkout(checkoutOptions);
      } else if (result.data?.stub_mode) {
        // Stub mode
        alert('Payment (Stub Mode): Success!');
        setPaymentDone(true);
      } else {
        console.warn('Payment order failed:', result.error || result.message);
        alert('Failed to initialize payment gateway: ' + (result.error || result.message || 'Unknown error'));
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
      const result = await verifyCashPayment({ bookingId: requestId });
      if (result.success) {
        setPaymentDone(true);
      } else {
        alert('Failed: ' + (result.error || result.message));
      }
    } catch (err) {
      console.error('Cash verification error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };


  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");
  const [otpCode, setOtpCode] = useState<string | null>(null);

  // ─── Fetch & listen for Ride OTP ───
  // The DRIVER calls generate-ride-otp from their side →
  // it sets otp_code on each booking_requests row +
  // sends a broadcast event to this passenger's channel.
  // Passenger side just READS the OTP from DB and real-time channels.
  useEffect(() => {
    const channels: any[] = [];

    if (requestId && !requestId.includes("mock")) {
      // 1. Generate & Fetch OTP from edge function and DB
      const fetchOtp = async () => {
        let passengerId: string | null = null;
        try {
          // Tell backend the driver accepted: generate OTP for this booking!
          const edgeResult = await generateRideOtp(requestId);
          if (edgeResult.success && edgeResult.data?.otp_code) {
            setOtpCode(edgeResult.data.otp_code);
          }

          // Fetch the booking row to get passenger_id and fallback otp_code
          const { data, error } = await supabase
            .from("booking_requests")
            .select("otp_code, passenger_id, trip_id, payment_status, driver_id")
            .eq("id", requestId)
            .single();

          if (error) {
            console.error("Error fetching booking row:", error);
            return;
          }

          if (data) {
            passengerId = data.passenger_id;
            setBookingDetails({
              trip_id: data.trip_id,
              passenger_id: data.passenger_id,
              driver_id: data.driver_id
            });
            if (!edgeResult.success && data.otp_code) {
              setOtpCode(data.otp_code);
            }
          }

          // Fetch payment status from ride_payments table
          const { data: paymentData } = await supabase
            .from("ride_payments")
            .select("payment_status")
            .eq("booking_id", requestId)
            .maybeSingle();
            
          if (paymentData && (paymentData.payment_status === 'paid' || paymentData.payment_status === 'completed')) {
            setPaymentDone(true);
          }
        } catch (err) {
          console.error("Error generating/fetching OTP:", err);
        }

        // 2. Subscribe to postgres changes on booking row (for OTP)
        const pgChannel = supabase
          .channel(`booking_otp_${requestId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "booking_requests",
              filter: `id=eq.${requestId}`,
            },
            (payload: any) => {
              if (payload.new?.otp_code) {
                setOtpCode(payload.new.otp_code);
              }
            }
          )
          .subscribe();
        channels.push(pgChannel);

        // 3. Subscribe to ride_payments table for payment success updates
        const paymentChannel = supabase
          .channel(`ride_payment_${requestId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "ride_payments",
              filter: `booking_id=eq.${requestId}`,
            },
            (payload: any) => {
              const newStatus = payload.new?.payment_status;
              if (newStatus === 'paid' || newStatus === 'completed') {
                setPaymentDone(true);
              }
            }
          )
          .subscribe();
        channels.push(paymentChannel);

        // 3. Subscribe to real-time broadcast for instant OTP
        // The edge fn broadcasts to channel `passenger_${passenger_id}`
        if (passengerId) {
          const broadcastChannel = supabase
            .channel(`passenger_${passengerId}`)
            .on("broadcast", { event: "ride_otp" }, (payload: any) => {
              if (payload.payload?.otp && payload.payload?.booking_id === requestId) {
                setOtpCode(payload.payload.otp);
              }
            })
            .subscribe();
          channels.push(broadcastChannel);
        }
      };

      fetchOtp();
    } else {
      // Mock OTP for testing so UI doesn't look broken
      setTimeout(() => setOtpCode(Math.floor(1000 + Math.random() * 9000).toString()), 1000);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [requestId]);

  useEffect(() => {
    if (ride?.distanceKm) {
      setDistanceKm(ride.distanceKm);
    }
  }, [ride]);

  const priceDetails = useMemo(() => {
    const activeDistance = distanceKm || ride?.distanceKm || 15;
    const activeDuration = ride?.durationMin || 30;
    const activePassengers = ride?.passengers || 1;
    return calculateTieredFare(activeDistance, activeDuration, vehicleType, activePassengers);
  }, [distanceKm, ride, vehicleType]);

  const handleCallDriver = useCallback(() => {
    window.location.href = `tel:${driver.phone}`;
  }, [driver.phone]);

  const isLoading = vehicleLoading || rideLoading;

  if (!isLoading && (rideError || !ride)) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-3xl bg-white/80 border border-gray-200 shadow-xl max-w-md text-center space-y-6" style={{ backdropFilter: "blur(12px)" }}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight font-syne mb-2">Something went wrong</h2>
            <p className="text-sm font-medium text-gray-500">We couldn't load your ride details. Please go back and try again.</p>
          </div>
          <button onClick={() => navigate("/")} className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg">Go to Home</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>


      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(245,158,11,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <main className="relative z-10 px-4 py-8 sm:py-12 flex justify-center min-h-screen h-full pb-24">
        <motion.div
          className="w-full max-w-md flex flex-col space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Header title={`${driver.name} is on the way!`} subtitle="Your chosen driver is heading to the pickup" />

          <OTPDisplayCard otpCode={otpCode} />

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {ride && (
                <RealMap
                  pickup={ride.pickup}
                  drop={ride.drop}
                  onDistanceCalculated={(d) => setDistanceKm(d)}
                />
              )}

              {ride && <RideSummaryCard ride={ride} />}

              {priceDetails && <FareDetailsCard fareInfo={priceDetails} passengers={ride?.passengers || 1} />}

              <VehicleCard
                type={vehicleType}
                vehicleNumber={driver.vehicleNumber}
                eta={eta}
              />

              <DriverCard driver={driver} onCall={handleCallDriver} />

              <motion.div variants={fadeUp} className="pt-4 space-y-3">
                {/* ─── PAYMENT SECTION ─── */}
                {!paymentDone ? (
                  <>
                    <button
                      onClick={handleCreatePayment}
                      disabled={paymentLoading}
                      className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_8px_30px_rgba(79,70,229,0.35)] disabled:opacity-50"
                    >
                      <CreditCard className="h-5 w-5" />
                      {paymentLoading ? "Processing..." : "Pay Now Online"}
                    </button>
                    <button
                      onClick={handleCashPayment}
                      disabled={paymentLoading}
                      className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/90 shadow-sm disabled:opacity-50"
                    >
                      <Banknote className="h-5 w-5" />
                      Pay with Cash to Driver
                    </button>
                    <div className="h-px w-full bg-gray-200 my-4" />
                  </>
                ) : (
                  <div className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 font-bold mb-4 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    Payment Method Confirmed
                  </div>
                )}

                <button
                  onClick={() => navigate("/ride-summary")}
                  className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_8px_30px_rgba(245,158,11,0.35)]"
                >
                  <MapPin className="h-5 w-5" />
                  Live Track Ride
                </button>

                <button
                  className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/90 shadow-sm"
                  onClick={() => {
                    navigator.share?.({
                      title: "My Xpool Ride",
                      text: `I'm tracking my pooled ride via Xpool! Arriving in ${eta} mins.`,
                    });
                  }}
                >
                  <Share2 className="h-5 w-5" />
                  Share Status
                </button>

                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-red-50 text-red-500 border border-red-200/50 hover:bg-red-100 shadow-sm"
                >
                  <XCircle className="h-5 w-5" />
                  Cancel Ride
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>

      {/* Cancel Ride Dialog */}
      {showCancelDialog && (
        <>
          <div
            onClick={() => setShowCancelDialog(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 2000,
              background: "rgba(10,15,28,0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", zIndex: 2001,
              width: "min(380px, 90vw)", background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
              padding: "28px 24px 20px",
              textAlign: "center", fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <XCircle style={{ width: 28, height: 28, color: "#EF4444" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8 }}>Cancel this ride?</h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: 500, lineHeight: 1.5, marginBottom: 24 }}>
              {driver.name} is already on the way. Cancelling now may affect your reliability score.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                style={{ flex: 1, padding: "12px 20px", borderRadius: 14, border: "1.5px solid rgba(229,231,235,0.8)", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", color: "#374151", fontFamily: "'Inter', sans-serif" }}
              >
                Keep Ride
              </button>
              <button
                onClick={async () => {
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
                 }}
                style={{ flex: 1, padding: "12px 20px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #EF4444, #DC2626)", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", color: "#fff", boxShadow: "0 4px 16px rgba(239,68,68,0.3)", fontFamily: "'Inter', sans-serif" }}
              >
                Cancel Ride
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RideConfirmed;