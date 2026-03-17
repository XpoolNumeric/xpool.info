import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  MapPin,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Sparkles,
  User,
  Star,
} from "lucide-react";

/* -------------------- CONSTANTS -------------------- */
const MAX_WAIT = 7000;
const FOUND_AT = 4500;
const FOUND_DELAY = 1200;

const VEHICLE_TYPES = ["bike", "auto", "car", "xl"] as const;
type VehicleKey = (typeof VEHICLE_TYPES)[number];

const ETA_BY_VEHICLE: Record<VehicleKey, number> = {
  bike: 3,
  auto: 4,
  car: 5,
  xl: 7,
};

const LIBRARIES: ("places")[] = ["places"];

/* -------------------- TYPES -------------------- */
interface RideSummaryLite {
  pickup: string;
  drop: string;
}

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

function useRideSummary(): [RideSummaryLite | null, boolean, Error | null] {
  const [savedRide, loading, error] = useLocalStorage<RideSummaryLite | null>("rideSummary", null);
  return [savedRide, loading, error];
}

function useSearchSimulation(
  vehicleType: VehicleKey,
  onFound?: () => void
): {
  status: "searching" | "found" | "timeout";
  progress: number;
  retry: () => void;
} {
  const [status, setStatus] = useState<"searching" | "found" | "timeout">("searching");
  const [progress, setProgress] = useState(0);

  const startSearch = useCallback(() => {
    setStatus("searching");
    setProgress(0);

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / FOUND_AT) * 100, 100);
      setProgress(percent);
    }, 100);

    const foundTimer = setTimeout(() => {
      setStatus("found");
      clearInterval(interval);
      setTimeout(() => onFound?.(), FOUND_DELAY);
    }, FOUND_AT);

    const timeoutTimer = setTimeout(() => {
      setStatus("timeout");
      clearInterval(interval);
    }, MAX_WAIT);

    return () => {
      clearInterval(interval);
      clearTimeout(foundTimer);
      clearTimeout(timeoutTimer);
    };
  }, [onFound]);

  useEffect(() => {
    const cleanup = startSearch();
    return cleanup;
  }, [startSearch, vehicleType]);

  const retry = useCallback(() => {
    startSearch();
  }, [startSearch]);

  return { status, progress, retry };
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
const RideSummaryCard = ({ ride }: { ride: RideSummaryLite }) => (
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

const MiniRealMap = ({ pickup }: { pickup: string }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const [center, setCenter] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (isLoaded && pickup) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: pickup }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          setCenter({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        }
      });
    }
  }, [isLoaded, pickup]);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    styles: [
      { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#7c93a3" }] },
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }] }
    ]
  }), []);

  if (!isLoaded || !center) return <Skeleton className="h-40 w-full rounded-2xl" />;

  return (
    <motion.div variants={fadeUp} className="relative h-40 w-full rounded-2xl overflow-hidden border border-amber-900/10 shadow-sm mt-4">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={14}
        options={mapOptions}
      >
        <MarkerF 
          position={center} 
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          }}
        />
        {/* Mock Nearby Cars */}
        <MarkerF position={{ lat: center.lat + 0.002, lng: center.lng + 0.002 }} icon="https://maps.google.com/mapfiles/ms/icons/cabs.png" />
        <MarkerF position={{ lat: center.lat - 0.003, lng: center.lng + 0.001 }} icon="https://maps.google.com/mapfiles/ms/icons/cabs.png" />
      </GoogleMap>
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-gray-100 shadow-sm flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[8px] font-black tracking-widest text-gray-700">SCANNING AREA</span>
      </div>
    </motion.div>
  );
};

const StatusIcon = ({ status }: { status: "searching" | "found" | "timeout" }) => (
  <motion.div variants={fadeUp} className="relative flex justify-center items-center h-40 my-2">
    <AnimatePresence mode="wait">
      {status === "searching" && (
        <motion.div
          key="searching"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute w-40 h-40 bg-amber-400/20 rounded-full blur-[20px] animate-pulse" />
          <div className="absolute w-32 h-32 border border-amber-400 rounded-full animate-ping opacity-30" />
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(245,158,11,0.4)] relative z-10">
            <Search className="h-8 w-8 text-white relative z-20" strokeWidth={2.5} />
          </div>
        </motion.div>
      )}
      {status === "found" && (
        <motion.div
          key="found"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute w-40 h-40 bg-green-500/20 rounded-full blur-[20px]" />
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)]">
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>
      )}
      {status === "timeout" && (
        <motion.div
          key="timeout"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute w-40 h-40 bg-red-500/20 rounded-full blur-[20px]" />
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-500">
            <XCircle className="h-12 w-12 text-red-500" strokeWidth={2.5} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const StatusText = ({ status, eta }: { status: "searching" | "found" | "timeout"; eta: number }) => (
  <motion.div variants={fadeUp} className="space-y-1 h-16">
    <AnimatePresence mode="wait">
      {status === "searching" && (
        <motion.div key="text-search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-syne">Connecting to captains...</h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Estimated wait: <span className="text-amber-600 font-bold">{eta} min</span>
          </p>
        </motion.div>
      )}
      {status === "found" && (
        <motion.div key="text-found" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <h1 className="text-2xl font-black text-green-600 tracking-tight font-syne">Driver Found!</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">Syncing ride details...</p>
        </motion.div>
      )}
      {status === "timeout" && (
        <motion.div key="text-timeout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <h1 className="text-2xl font-black text-red-600 tracking-tight font-syne">No drivers available</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">All our captains are currently busy.</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <motion.div variants={fadeUp} className="w-full h-2.5 bg-amber-100/50 rounded-full overflow-hidden border border-amber-200/50 relative">
    <motion.div
      className="absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
      initial={{ width: "0%" }}
      animate={{ width: `${progress}%` }}
      transition={{ ease: "linear" }}
    />
  </motion.div>
);

const ActionButtons = ({ status, onRetry, onCancel }: { status: "searching" | "found" | "timeout"; onRetry: () => void; onCancel: () => void }) => (
  <motion.div variants={fadeUp} className="pt-2 h-16">
    <AnimatePresence mode="wait">
      {status === "timeout" && (
        <motion.button
          key="btn-retry"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={onRetry}
          className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20"
        >
          <RotateCcw className="h-5 w-5" />
          Retry Search
        </motion.button>
      )}
      {status === "searching" && (
        <motion.button
          key="btn-cancel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={onCancel}
          className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/60 text-red-600 border border-red-200 hover:bg-red-50"
        >
          <XCircle className="h-5 w-5" />
          Cancel Request
        </motion.button>
      )}
    </AnimatePresence>
  </motion.div>
);

const NearbyDriver = ({ name, distance, rating, delay }: { name: string; distance: string; rating: number; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 border border-white/50 backdrop-blur-sm mb-2"
  >
    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
      <User className="h-5 w-5 text-amber-600" />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-800">{name}</h4>
        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Near You</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500">
             <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {rating}
        </div>
        <span className="text-[10px] font-medium text-gray-400">• {distance} away</span>
      </div>
    </div>
  </motion.div>
);

/* -------------------- MAIN COMPONENT -------------------- */
const SearchingVehicle = () => {
  const navigate = useNavigate();
  const [vehicleType, vehicleLoading] = useVehicleType();
  const [ride, rideLoading, rideError] = useRideSummary();
  const eta = useMemo(() => ETA_BY_VEHICLE[vehicleType], [vehicleType]);

  const handleFound = useCallback(() => {
    navigate("/ride-confirmed");
  }, [navigate]);

  const { status, progress, retry } = useSearchSimulation(vehicleType, handleFound);

  useEffect(() => {
    if (!rideLoading && (rideError || !ride)) {
      navigate("/vehicles", { replace: true });
    }
  }, [rideLoading, rideError, ride, navigate]);

  const handleCancel = useCallback(() => {
    navigate("/vehicles");
  }, [navigate]);

  if (vehicleLoading || rideLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)" }}>
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!ride) return null;

  return (
    <div className="min-h-screen relative overflow-hidden pb-12" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(245,158,11,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <main className="relative z-10 px-4 py-8 sm:py-12 flex justify-center min-h-screen h-full">
        <motion.div 
          className="w-full max-w-md flex flex-col justify-center space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center">
            <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/50 border border-amber-200/50 text-[10px] font-bold tracking-wider text-amber-700 uppercase mb-4">
                <Sparkles className="w-3 h-3" />
                Finding Best Match
                </div>
            </motion.div>
            <RideSummaryCard ride={ride} />
          </div>

          <StatusIcon status={status} />
          
          <div className="text-center">
            <StatusText status={status} eta={eta} />
          </div>

          <AnimatePresence>
            {status === "searching" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Captains</h3>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                </div>
                
                <NearbyDriver name="Rahul Sharma" distance="0.8 km" rating={4.9} delay={0.5} />
                <NearbyDriver name="Priya Patel" distance="1.2 km" rating={4.8} delay={1.2} />
                <NearbyDriver name="Amit Singh" distance="2.4 km" rating={4.7} delay={2} />

                <MiniRealMap pickup={ride.pickup} />

                <div className="pt-2">
                    <ProgressBar progress={progress} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ActionButtons status={status} onRetry={retry} onCancel={handleCancel} />

          <motion.p variants={fadeUp} className="text-[11px] font-medium text-gray-400 text-center pt-4">
            Security Tip: Always verify the vehicle number before boarding.
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
};

export default SearchingVehicle;