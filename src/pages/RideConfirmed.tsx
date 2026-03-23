import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { GoogleMap, useLoadScript, DirectionsRenderer, MarkerF } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  Bike,
  User,
  Phone,
  Star,
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  Share2,
  CheckCircle2,
  CarTaxiFront,
  Truck,
  Users,
  ChevronLeft,
} from "lucide-react";
import { calculateTieredFare } from "@/utils/fareCalculator";

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
  bike: Bike,
  auto: CarTaxiFront,
  car: Car,
  xl: Truck,
};

const FALLBACK_DRIVER: DriverInfo = {
  name: "Ramesh Kumar",
  rating: 4.8,
  totalRides: 1200,
  phone: "+91 98765 43210",
  vehicleNumber: "TN 09 AB 1234",
  etaMinutes: 5,
};

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
      <Sparkles className="w-3 h-3 text-green-600" />
      Ride Booked
    </div>
    <h1 className="text-3xl font-black text-gray-900 tracking-tight font-syne">{title}</h1>
    <p className="text-sm font-semibold text-gray-400">{subtitle}</p>
  </motion.header>
);

const RealMap = ({ pickup, drop, onDistanceCalculated }: { pickup: string; drop: string; onDistanceCalculated: (km: number) => void }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (isLoaded && pickup && drop) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup,
          destination: drop,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            const distanceMeters = result.routes[0]?.legs[0]?.distance?.value;
            if (distanceMeters) {
               onDistanceCalculated(distanceMeters / 1000);
            }
          }
        }
      );
    }
  }, [isLoaded, pickup, drop, onDistanceCalculated]);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#7c93a3" }, { lightness: "-10" }]
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#57534e" }]
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e9e9e9" }]
      }
    ]
  }), []);

  if (!isLoaded) return <Skeleton className="h-64 w-full rounded-3xl" />;

  return (
    <motion.div variants={fadeUp} className="relative h-64 w-full rounded-3xl overflow-hidden border border-amber-900/10 shadow-lg bg-slate-100">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={mapOptions}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#f59e0b",
                strokeWeight: 6,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
        
        {/* Custom Markers */}
        {directions && directions.routes[0].legs[0].start_location && (
          <MarkerF
            position={directions.routes[0].legs[0].start_location}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#f59e0b",
              fillOpacity: 1,
              strokeWeight: 4,
              strokeColor: "#ffffff",
            }}
          />
        )}
        {directions && directions.routes[0].legs[0].end_location && (
          <MarkerF
            position={directions.routes[0].legs[0].end_location}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#ea580c",
              fillOpacity: 1,
              strokeWeight: 4,
              strokeColor: "#ffffff",
            }}
          />
        )}
      </GoogleMap>

      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-200/50 shadow-sm z-10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-black text-gray-700 tracking-wider">LIVE POOL MAP</span>
      </div>
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
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border border-amber-500/20 w-max">
               <Users className="w-3 h-3" />
               {passengers} {passengers > 1 ? 'Seats' : 'Seat'} Reserved
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{fareInfo.tripDetails.tier} Pool</p>
         </div>
         
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1 drop-shadow-sm">Pooled Fare</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] text-gray-400 font-bold -mt-2">₹</span>
              <span className="text-[40px] leading-none font-black text-white font-syne tracking-tight">{fareInfo.fare.perPerson}</span>
            </div>
            <div className="flex flex-col items-end mt-1.5 gap-0.5">
               <span className="text-[11px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                 Per seat
               </span>
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
               <span className="text-white text-xs">{fareInfo.durationMin} min</span>
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
  const [driver] = useState<DriverInfo>(FALLBACK_DRIVER);
  const eta = useEtaCountdown(driver.etaMinutes);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // Parse distance reliably
  useEffect(() => {
    if (ride?.distanceKm) {
        setDistanceKm(ride.distanceKm);
    }
  }, [ride]);

  const priceDetails = useMemo(() => {
    // We expect distanceKm and durationMin to be provided via the UI/Map updates
    const activeDistance = distanceKm || ride?.distanceKm || 15;
    const activeDuration = ride?.durationMin || 30;
    const activePassengers = ride?.passengers || 1;
    
    const fareInfo = calculateTieredFare(activeDistance, activeDuration, vehicleType, activePassengers);
    
    return fareInfo;
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
      
      {/* GLOBAL BACK BUTTON */}
      <button 
        onClick={() => window.history.back()}
        className="absolute top-6 left-4 z-50 w-10 h-10 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-gray-200/50 flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95 hover:shadow-md"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 ml-[-2px]" />
      </button>

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
          <Header title="Your captain is on the way!" subtitle="Get ready, your pooled ride is arriving shortly" />

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {ride && <RealMap pickup={ride.pickup} drop={ride.drop} onDistanceCalculated={(d) => setDistanceKm(d)} />}

              {ride && <RideSummaryCard ride={ride} />}

              {priceDetails && <FareDetailsCard fareInfo={priceDetails} passengers={ride?.passengers || 1} />}

              <VehicleCard
                type={vehicleType}
                vehicleNumber={driver.vehicleNumber}
                eta={eta}
              />

              <DriverCard driver={driver} onCall={handleCallDriver} />

              <motion.div variants={fadeUp} className="pt-4 space-y-3">
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
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default RideConfirmed;