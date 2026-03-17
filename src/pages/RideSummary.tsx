import { useEffect, useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Car,
  Bike,
  User,
  Phone,
  Star,
  MapPin,
  ArrowDown,
  Clock,
  CheckCircle2,
  Navigation,
  CreditCard,
  Receipt,
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type VehicleKey = "bike" | "auto" | "car" | "xl";

interface RideSummaryData {
  pickup: string;
  drop: string;
}

/* ---------------- CONFIG ---------------- */
const VEHICLE_ICONS: Record<VehicleKey, React.ElementType> = {
  bike: Bike,
  auto: Car,
  car: Car,
  xl: Car,
};

const FARE_BY_VEHICLE: Record<VehicleKey, number> = {
  bike: 10,
  auto: 15,
  car: 20,
  xl: 30,
};

/* ---------------- ANIMATION VARIANTS ---------------- */
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

/* ---------------- COMPONENT ---------------- */

const RideSummary = () => {
  const [vehicleType, setVehicleType] = useState<VehicleKey>("car");
  const [ride, setRide] = useState<RideSummaryData | null>(null);
  const [driverStage, setDriverStage] = useState<"assigned" | "arriving">("assigned");
  const [driverProgress, setDriverProgress] = useState(0);

  /* ---------------- LOAD DATA SAFELY ---------------- */
  useEffect(() => {
    try {
      const savedVehicle = localStorage.getItem("vehicleType") as VehicleKey | null;
      if (savedVehicle && savedVehicle in VEHICLE_ICONS) {
        setVehicleType(savedVehicle);
      }

      const savedRide = localStorage.getItem("rideSummary");
      if (savedRide) {
        const parsed = JSON.parse(savedRide);
        setRide({
          pickup: parsed.pickup,
          drop: parsed.drop,
        });
      }
    } catch {}
  }, []);

  /* ---------------- DRIVER MOVEMENT SIM ---------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setDriverProgress((p) => {
        if (p >= 100) {
          setDriverStage("arriving");
          clearInterval(timer);
          return 100;
        }
        return p + 10;
      });
    }, 600);

    return () => clearInterval(timer);
  }, []);

  const VehicleIcon = VEHICLE_ICONS[vehicleType];

  /* ---------------- FARE CALC ---------------- */
  const fare = useMemo(() => {
    const base = 40;
    const distanceKm = 6;
    const distanceFare = distanceKm * FARE_BY_VEHICLE[vehicleType];
    const platformFee = 10;
    return {
      base,
      distanceFare,
      platformFee,
      total: base + distanceFare + platformFee,
    };
  }, [vehicleType]);

  /* ---------------- UI HELPER COMPONENTS ---------------- */
  const TimelineItem = ({ label, done, active }: { label: string; done?: boolean; active?: boolean }) => (
    <div className="flex items-center gap-3 py-1.5">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${done ? 'bg-green-500 border-green-500' : active ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        ) : (
          <Navigation className={`h-3 w-3 ${active ? "text-amber-500 animate-pulse" : "text-gray-300"}`} strokeWidth={3} />
        )}
      </div>
      <span className={`text-sm font-bold ${active ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  const FareRow = ({ label, value, isTotal }: { label: string; value: number; isTotal?: boolean }) => (
    <div className={`flex justify-between items-center ${isTotal ? 'pt-3 mt-3 border-t border-gray-200/50' : 'py-1'}`}>
      <span className={isTotal ? 'font-black text-gray-900 text-base' : 'font-semibold text-gray-500 text-sm'}>{label}</span>
      <span className={`${isTotal ? 'font-black text-gray-900 text-lg' : 'font-bold text-gray-700 text-sm'} font-syne`}>₹{value}</span>
    </div>
  );

  /* ---------------- MAIN UI ---------------- */
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
          {/* HEADER */}
          <motion.header variants={fadeUp} className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight font-syne">Live Trip</h1>
            <p className="text-sm font-semibold text-gray-500">Your ride is in progress</p>
          </motion.header>

          {/* DRIVER MOVEMENT */}
          <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/70 border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(245,158,11,0.1)] space-y-4 relative overflow-hidden" style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-900">
                Driver {driverStage === "assigned" ? "assigned" : "arriving"}
              </span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shadow-sm">{Math.max(1, 5 - Math.floor(driverProgress / 25))} min</span>
            </div>

            <div className="w-full h-3 bg-amber-100/50 rounded-full overflow-hidden border border-amber-200/50 relative">
              <motion.div
                className="absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${driverProgress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          {/* RIDE SUMMARY */}
          {ride && (
            <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm text-left relative overflow-hidden" style={{ backdropFilter: "blur(12px)" }}>
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
          )}

          {/* DRIVER INFO COMPACT */}
          <motion.div variants={fadeUp} className="flex gap-4">
            <div className="flex-1 p-3 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm flex items-center gap-3" style={{ backdropFilter: "blur(12px)" }}>
              <div className="h-10 w-10 bh-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">Ramesh K.</h4>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-yellow-700 bg-yellow-100/50 w-max px-1.5 py-0.5 rounded">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.8
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm flex items-center gap-3 relative overflow-hidden" style={{ backdropFilter: "blur(12px)" }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-[20px]" />
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <VehicleIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate capitalize">{vehicleType}</h4>
                <p className="text-[10px] font-black text-gray-500 tracking-widest mt-0.5">TN 09 AB 1234</p>
              </div>
            </div>
          </motion.div>

          {/* TRIP TIMELINE */}
          <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm space-y-1" style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200/50">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-900">Trip Status</h3>
            </div>
            <TimelineItem label="Ride booked successfully" done />
            <TimelineItem label={`Captain ${driverStage === "assigned" ? "is heading to you" : "has almost arrived"}`} active />
            <TimelineItem label="Ride in progress" />
            <TimelineItem label="Dropoff point reached" />
          </motion.div>

          {/* FARE BREAKDOWN */}
          <motion.div variants={fadeUp} className="p-4 rounded-2xl bg-white/60 border border-gray-200/50 shadow-sm space-y-1" style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200/50">
              <Receipt className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-900">Fare Estimate</h3>
            </div>
            <FareRow label="Base fare" value={fare.base} />
            <FareRow label="Distance fare" value={fare.distanceFare} />
            <FareRow label="Platform fee" value={fare.platformFee} />
            <FareRow label="Estimated Total" value={fare.total} isTotal />
          </motion.div>

          {/* HELP ACTION */}
          <motion.div variants={fadeUp} className="pt-2">
            <button className="w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/60 text-gray-700 border border-gray-200/50 hover:bg-white/90 shadow-sm">
              <Phone className="h-5 w-5" />
              Need Help?
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default RideSummary;
