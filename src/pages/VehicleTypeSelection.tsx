import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Bike,
  Car,
  CarTaxiFront,
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

type VehicleId = "bike" | "auto" | "car" | "xl";

interface Vehicle {
  id: VehicleId;
  name: string;
  desc: string;
  price: string;
  eta: string;
  icon: React.ElementType;
}

const vehicles: Vehicle[] = [
  {
    id: "bike",
    name: "Bike",
    desc: "Fastest & cheapest",
    price: "₹10–15 / km",
    eta: "2–4 min",
    icon: Bike,
  },
  {
    id: "auto",
    name: "Auto",
    desc: "Affordable everyday rides",
    price: "₹15–20 / km",
    eta: "3–5 min",
    icon: CarTaxiFront,
  },
  {
    id: "car",
    name: "Car",
    desc: "Comfort & AC rides",
    price: "₹20–30 / km",
    eta: "4–6 min",
    icon: Car,
  },
  {
    id: "xl",
    name: "XL",
    desc: "Group travel",
    price: "₹30–40 / km",
    eta: "5–8 min",
    icon: Truck,
  },
];



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

const VehicleTypeSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<VehicleId | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
    const saved = localStorage.getItem("vehicleType");
    if (saved) setSelected(saved as VehicleId);
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("vehicleType", selected);
    navigate("/searching");
  };

  if (!isRendered) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(245,158,11,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <main className="relative z-10 px-4 py-8 sm:py-12 flex justify-center min-h-screen">
        <motion.div 
          className="w-full max-w-md space-y-8 h-full flex flex-col"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* HEADER */}
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/50 border border-amber-200/50 text-[10px] font-bold tracking-wider text-amber-700 uppercase mb-2">
              <Sparkles className="w-3 h-3" />
              Step 3 of 3
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Choose your ride
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Select the perfect vehicle for your journey
            </p>
          </motion.div>

          {/* VEHICLE LIST */}
          <motion.div variants={staggerContainer} className="space-y-3 flex-1 overflow-y-auto pb-4 px-1" style={{ scrollbarWidth: "none" }}>
            {vehicles.map((v) => {
              const Icon = v.icon;
              const active = selected === v.id;

              return (
                <motion.div
                  variants={fadeUp}
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300
                    ${active
                      ? "bg-white border-2 border-amber-500 shadow-[0_8px_30px_rgba(245,158,11,0.15)]"
                      : "bg-white/60 border border-amber-900/10 hover:border-amber-500/40 hover:bg-white/80 shadow-sm"
                    }`}
                  style={{ backdropFilter: "blur(12px)" }}
                >
                  <div className="flex items-center gap-4">
                    {/* ICON */}
                    <div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300
                      ${active 
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "bg-amber-100/50 text-amber-700"}`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={active ? 2.5 : 2} />
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{v.name}</h3>
                        <AnimatePresence>
                          {active && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-amber-500" fill="currentColor" stroke="white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <p className="text-xs font-semibold text-gray-500">
                        {v.desc}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600/80 bg-amber-50 rounded-md w-max px-1.5 py-0.5 mt-1 border border-amber-100">
                        <Clock className="h-3 w-3" />
                        {v.eta} away
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900 whitespace-nowrap bg-amber-100/30 px-2 py-1 rounded-lg border border-amber-200/30">
                        {v.price}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CONTINUE */}
          <motion.div variants={fadeUp} className="pt-2 sticky bottom-4">
            <button
              disabled={!selected}
              onClick={handleContinue}
              className={`w-full h-14 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300
                ${selected 
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_8px_30px_rgba(245,158,11,0.35)]" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/50"}`}
            >
              Continue to Search
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-3 text-[11px] font-medium text-center text-gray-400">
              Fare may vary based on actual distance & real-time demand
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default VehicleTypeSelection;
