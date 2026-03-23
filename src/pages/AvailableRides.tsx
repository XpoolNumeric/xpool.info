import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { GoogleMap, useLoadScript, DirectionsRenderer } from "@react-google-maps/api";
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
  ArrowRight,
  SortAsc,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { PiMotorcycleBold, PiCarProfileBold, PiVanBold } from "react-icons/pi";
import AutoRickshawIcon from "@/components/icons/AutoRickshawIcon";
import { formatDuration } from "@/utils/fareCalculator";

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
  driverPhoto: string; // initials placeholder
  vehicleType: VehicleId;
  vehicleName: string;
  vehicleNumber: string;
  vehicleColor: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
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

/* ─────────── MOCK DATA ─────────── */
function generateMockRides(distanceKm: number, passengers: number): DriverRide[] {
  const now = new Date();
  const basePriceForCar = Math.round((distanceKm * 8 + 30) / 5) * 5;

  const drivers: DriverRide[] = [
    {
      id: "d1",
      driverName: "Rahul Sharma",
      driverRating: 4.9,
      driverRides: 1450,
      driverPhone: "+91 98765 43210",
      driverPhoto: "RS",
      vehicleType: "car",
      vehicleName: "Maruti Swift Dzire",
      vehicleNumber: "TN 09 AB 1234",
      vehicleColor: "White",
      departureTime: new Date(now.getTime() + 15 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 3,
      pricePerSeat: basePriceForCar,
      isVerified: true,
      features: ["AC", "Music", "Luggage space"],
    },
    {
      id: "d2",
      driverName: "Priya Patel",
      driverRating: 4.8,
      driverRides: 890,
      driverPhone: "+91 87654 32109",
      driverPhoto: "PP",
      vehicleType: "car",
      vehicleName: "Hyundai i20",
      vehicleNumber: "TN 22 CD 5678",
      vehicleColor: "Silver",
      departureTime: new Date(now.getTime() + 30 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 2,
      pricePerSeat: Math.round((basePriceForCar * 0.9) / 5) * 5,
      isVerified: true,
      features: ["AC", "Pet friendly"],
    },
    {
      id: "d3",
      driverName: "Amit Singh",
      driverRating: 4.7,
      driverRides: 2100,
      driverPhone: "+91 76543 21098",
      driverPhoto: "AS",
      vehicleType: "xl",
      vehicleName: "Toyota Innova",
      vehicleNumber: "TN 07 EF 9012",
      vehicleColor: "Black",
      departureTime: new Date(now.getTime() + 20 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 5,
      pricePerSeat: Math.round((basePriceForCar * 1.2) / 5) * 5,
      isVerified: true,
      features: ["AC", "Luggage space", "Charger", "Water bottle"],
    },
    {
      id: "d4",
      driverName: "Kavitha R",
      driverRating: 4.6,
      driverRides: 560,
      driverPhone: "+91 65432 10987",
      driverPhoto: "KR",
      vehicleType: "auto",
      vehicleName: "Bajaj RE",
      vehicleNumber: "TN 09 GH 3456",
      vehicleColor: "Yellow/Green",
      departureTime: new Date(now.getTime() + 10 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 2,
      pricePerSeat: Math.round((basePriceForCar * 0.6) / 5) * 5,
      isVerified: false,
      features: ["Budget friendly"],
    },
    {
      id: "d5",
      driverName: "Vijay Kumar",
      driverRating: 4.9,
      driverRides: 3200,
      driverPhone: "+91 54321 09876",
      driverPhoto: "VK",
      vehicleType: "car",
      vehicleName: "Honda City",
      vehicleNumber: "TN 01 IJ 7890",
      vehicleColor: "Red",
      departureTime: new Date(now.getTime() + 45 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 3,
      pricePerSeat: Math.round((basePriceForCar * 1.1) / 5) * 5,
      isVerified: true,
      features: ["AC", "Premium audio", "Leather seats", "Charger"],
    },
    {
      id: "d6",
      driverName: "Deepa M",
      driverRating: 4.5,
      driverRides: 340,
      driverPhone: "+91 43210 98765",
      driverPhoto: "DM",
      vehicleType: "bike",
      vehicleName: "Royal Enfield Classic",
      vehicleNumber: "TN 09 KL 1122",
      vehicleColor: "Black",
      departureTime: new Date(now.getTime() + 5 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      availableSeats: 1,
      pricePerSeat: Math.round((basePriceForCar * 0.45) / 5) * 5,
      isVerified: false,
      features: ["Helmet provided", "Fast"],
    },
  ];

  // Filter out rides with fewer seats than requested
  return drivers.filter((d) => d.availableSeats >= passengers);
}

/* ─────────── ANIMATIONS ─────────── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

/* ─────────── MAIN COMPONENT ─────────── */
export default function AvailableRides() {
  const navigate = useNavigate();
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleId | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distanceKm, setDistanceKm] = useState(15);
  const [durationMin, setDurationMin] = useState(30);
  const [passengers, setPassengers] = useState(1);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  // Load ride data from localStorage
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

  // Fetch directions
  useEffect(() => {
    if (isLoaded && pickup && drop && window.google) {
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
          }
        }
      );
    }
  }, [isLoaded, pickup, drop]);

  // Generate rides
  const allRides = useMemo(() => generateMockRides(distanceKm, passengers), [distanceKm, passengers]);

  // Filter & sort
  const filteredRides = useMemo(() => {
    let rides = [...allRides];
    if (vehicleFilter !== "all") {
      rides = rides.filter((r) => r.vehicleType === vehicleFilter);
    }
    switch (sortBy) {
      case "price":
        rides.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
        break;
      case "rating":
        rides.sort((a, b) => b.driverRating - a.driverRating);
        break;
      case "seats":
        rides.sort((a, b) => b.availableSeats - a.availableSeats);
        break;
      case "departure":
        // already in time order from mock
        break;
    }
    return rides;
  }, [allRides, vehicleFilter, sortBy]);

  const handleSelectRide = useCallback(
    (ride: DriverRide) => {
      setSelectedRide(ride.id);

      // Store selected driver info for downstream pages
      const selectedDriverData = {
        driverName: ride.driverName,
        driverRating: ride.driverRating,
        driverRides: ride.driverRides,
        driverPhone: ride.driverPhone,
        vehicleType: ride.vehicleType,
        vehicleName: ride.vehicleName,
        vehicleNumber: ride.vehicleNumber,
        pricePerSeat: ride.pricePerSeat,
        departureTime: ride.departureTime,
      };
      localStorage.setItem("selectedDriver", JSON.stringify(selectedDriverData));
      localStorage.setItem("vehicleType", JSON.stringify(ride.vehicleType));

      // Update rideSummary with passenger count
      const summaryStr = localStorage.getItem("rideSummary");
      if (summaryStr) {
        try {
          const summary = JSON.parse(summaryStr);
          localStorage.setItem(
            "rideSummary",
            JSON.stringify({ ...summary, distanceKm, durationMin, passengers })
          );
        } catch (e) { /* ignore */ }
      }

      // Navigate after brief visual feedback
      setTimeout(() => {
        navigate("/ride-confirmed");
      }, 600);
    },
    [navigate, distanceKm, durationMin, passengers]
  );

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* BACK BUTTON */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-4 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-gray-200/50 flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95 hover:shadow-lg"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 ml-[-2px]" />
      </button>

      {/* MAP TOP SECTION */}
      <div className="absolute top-0 left-0 right-0 h-[35vh] z-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: [
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
              ],
            }}
          >
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: "#f59e0b", strokeWeight: 5 },
                  suppressMarkers: false,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Loading map...
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
      </div>

      {/* BOTTOM SHEET */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="absolute bottom-0 left-0 right-0 h-[72vh] z-10 bg-white/95 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.15)] border-t border-white flex flex-col pt-2"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center py-3">
          <div className="w-14 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 flex-1 overflow-y-auto pb-8 custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Available Rides
              </h2>
              <div className="flex gap-3 text-xs font-bold text-amber-500 mt-1 uppercase tracking-wider">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {distanceKm.toFixed(1)} km</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(durationMin)}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {passengers} {passengers === 1 ? "seat" : "seats"}</span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all ${showFilters ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300"}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="py-3 space-y-3">
                  {/* Sort */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <SortAsc className="w-3 h-3" /> Sort by
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { key: "price" as SortBy, label: "Price" },
                        { key: "rating" as SortBy, label: "Rating" },
                        { key: "departure" as SortBy, label: "Departure" },
                        { key: "seats" as SortBy, label: "Seats" },
                      ]).map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setSortBy(s.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${sortBy === s.key
                            ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Vehicle filter */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Car className="w-3 h-3" /> Vehicle type
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setVehicleFilter("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${vehicleFilter === "all"
                          ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"}`}
                      >
                        All
                      </button>
                      {(["bike", "auto", "car", "xl"] as VehicleId[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => setVehicleFilter(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${vehicleFilter === v
                            ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"}`}
                        >
                          {VEHICLE_LABELS[v]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <p className="text-[11px] font-bold text-gray-400 mb-3">
            {filteredRides.length} ride{filteredRides.length !== 1 ? "s" : ""} found
          </p>

          {/* Ride Cards */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 pb-4">
            {filteredRides.length === 0 ? (
              <motion.div variants={fadeUp} className="text-center py-12 space-y-3">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Car className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-500">No rides match your filters</p>
                <button onClick={() => setVehicleFilter("all")} className="text-xs font-bold text-amber-600 underline">
                  Clear filters
                </button>
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
                    whileHover={{ scale: 1.005, y: -1 }}
                    whileTap={{ scale: 0.995 }}
                    className={`relative p-4 rounded-[1.25rem] transition-all duration-300 border cursor-pointer
                      ${isSelected
                        ? "bg-amber-50/80 border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.18)] ring-1 ring-amber-400"
                        : "bg-white border-gray-200/80 hover:border-amber-300 shadow-sm hover:shadow-md"
                      }`}
                  >
                    {/* DRIVER ROW */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className={`mt-0.5 h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-black transition-all ${isSelected
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                        {ride.driverPhoto}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-black tracking-tight text-[15px] ${isSelected ? "text-orange-600" : "text-gray-900"}`}>
                            {ride.driverName}
                          </h3>
                          {ride.isVerified && (
                            <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" fill="currentColor" />
                          )}
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" fill="currentColor" stroke="white" />
                          )}
                        </div>

                        {/* Rating + rides */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-700">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {ride.driverRating}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">• {ride.driverRides.toLocaleString()} rides</span>
                        </div>

                        {/* Vehicle info */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isSelected ? "bg-amber-100 text-amber-600" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-700 truncate">{ride.vehicleName} • {ride.vehicleColor}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ride.vehicleNumber}</p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {ride.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                              {f}
                            </span>
                          ))}
                          {ride.features.length > 3 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400">
                              +{ride.features.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price + time + seats */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[10px] font-black text-gray-400">₹</span>
                          <span className={`text-2xl font-black tracking-tight ${isSelected ? "text-orange-600" : "text-gray-900"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                            {ride.pricePerSeat}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">per seat</span>

                        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-md px-1.5 py-0.5 border border-gray-100">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {ride.departureTime}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-md px-1.5 py-0.5 border border-emerald-100">
                          <Users className="w-3 h-3" />
                          {ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""} left
                        </div>
                      </div>
                    </div>

                    {/* Booking feedback overlay */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 rounded-[1.25rem] bg-amber-500/5 flex items-center justify-center z-20 pointer-events-none"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-amber-200 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="font-bold text-gray-900 text-sm">Booking ride...</span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Bottom hint */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-2 text-[11px] font-medium text-gray-400 pb-4 pt-2"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            You can message drivers after booking
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
