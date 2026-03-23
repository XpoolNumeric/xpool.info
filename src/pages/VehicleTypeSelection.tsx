import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { GoogleMap, useLoadScript, DirectionsRenderer } from "@react-google-maps/api";
import {
  Bike,
  Car,
  CarTaxiFront,
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Minus,
  Plus,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import { calculateTieredFare } from "@/utils/fareCalculator";

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

type VehicleId = "bike" | "auto" | "car" | "xl";

interface Vehicle {
  id: VehicleId;
  name: string;
  desc: string;
  eta: string;
  icon: React.ElementType;
}

const vehicles: Vehicle[] = [
  { id: "bike", name: "Bike Pool", desc: "Fast & single seat", eta: "2–4 min", icon: Bike },
  { id: "auto", name: "Auto Share", desc: "Affordable shared rides", eta: "3–5 min", icon: CarTaxiFront },
  { id: "car", name: "Car Pool", desc: "Comfort & AC shared", eta: "4–6 min", icon: Car },
  { id: "xl", name: "XL Pool", desc: "Group shared travel", eta: "5–8 min", icon: Truck },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

export default function VehicleTypeSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<VehicleId | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const [pickup, setPickup] = useState<string>("");
  const [drop, setDrop] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(15);
  const [durationMin, setDurationMin] = useState<number>(30);
  const [passengers, setPassengers] = useState<number>(1);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    setIsRendered(true);
    const saved = localStorage.getItem("vehicleType");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VehicleId;
        if (["bike", "auto", "car", "xl"].includes(parsed)) setSelected(parsed);
      } catch (e) {
        if (["bike", "auto", "car", "xl"].includes(saved)) {
           setSelected(saved as VehicleId);
        }
      }
    }

    const summaryStr = localStorage.getItem("rideSummary");
    if (summaryStr) {
      try {
        const summary = JSON.parse(summaryStr);
        if (summary.distanceKm) setDistanceKm(summary.distanceKm);
        if (summary.durationMin) setDurationMin(summary.durationMin);
        if (summary.pickup) setPickup(summary.pickup);
        if (summary.drop) setDrop(summary.drop);
      } catch (e) {
        console.error("Error reading rideSummary", e);
      }
    }
  }, []);

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
            if (!localStorage.getItem("rideSummary")?.includes("distanceKm")) { // fallback update
                const route = result.routes[0];
                if (route && route.legs && route.legs.length > 0) {
                     setDistanceKm(route.legs[0].distance?.value ? route.legs[0].distance.value / 1000 : 15);
                     setDurationMin(route.legs[0].duration?.value ? route.legs[0].duration.value / 60 : 30);
                }
            }
          }
        }
      );
    }
  }, [isLoaded, pickup, drop]);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("vehicleType", JSON.stringify(selected));
    const summaryStr = localStorage.getItem("rideSummary");
    if (summaryStr) {
       try {
           const summary = JSON.parse(summaryStr);
           localStorage.setItem("rideSummary", JSON.stringify({...summary, distanceKm, durationMin, passengers}));
       } catch(e) {}
    }
    navigate("/searching");
  };

  if (!isRendered) return null;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-50 font-inter">
      
      {/* GLOBAL BACK BUTTON */}
      <button 
        onClick={() => window.history.back()}
        className="absolute top-6 left-4 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-gray-200/50 flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95 hover:shadow-lg"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 ml-[-2px]" />
      </button>

      {/* MAP BACKGROUND (Top Half) */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] z-0">
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
              ]
            }}
          >
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: "#f59e0b", strokeWeight: 4 },
                  suppressMarkers: false,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
             <span className="text-gray-400 font-medium flex items-center gap-2"><Sparkles className="w-4 h-4" /> Initiating Tracking Module</span>
          </div>
        )}
        
        {/* Map gradient fade to bottom sheet */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* BOTTOM SHEET (Glassmorphism & Interactive) */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="absolute bottom-0 left-0 right-0 h-[60vh] z-10 bg-white/95 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.15)] border-t border-white flex flex-col pt-2"
      >
         {/* Drag Handle */}
         <div className="w-full flex justify-center py-3 cursor-grab cursor-pointer">
            <div className="w-14 h-1.5 rounded-full bg-gray-300" />
         </div>

         <div className="px-5 flex-1 overflow-y-auto pb-6 custom-scrollbar">
            {/* Header & Seat Selector */}
            <div className="flex items-center justify-between mb-6 pt-2">
                <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Choose Pool</h2>
                   <div className="flex gap-3 text-xs font-bold text-amber-500 mt-1 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {distanceKm.toFixed(1)} km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(durationMin)} min</span>
                   </div>
                </div>

                <div className="flex flex-col items-end">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Seats required</p>
                   <div className="flex items-center bg-gray-100/80 rounded-full p-1 border border-gray-200/50 shadow-inner">
                      <button 
                         onClick={() => setPassengers(Math.max(1, passengers - 1))}
                         className="w-8 h-8 rounded-full bg-white text-gray-700 shadow-sm border border-gray-200 flex items-center justify-center active:scale-95 transition-transform"
                      >
                         <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{passengers}</span>
                      <button 
                         onClick={() => setPassengers(Math.min(4, passengers + 1))}
                         className="w-8 h-8 rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/30 border border-amber-600 flex items-center justify-center active:scale-95 transition-transform"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>
                </div>
            </div>

            {/* Vehicle List */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 pb-4">
              {vehicles.map((v) => {
                const Icon = v.icon;
                const active = selected === v.id;

                const fareInfo = calculateTieredFare(distanceKm, durationMin, v.id, passengers);
                const isBikeAndMultiple = v.id === "bike" && passengers > 1;
                
                return (
                  <motion.div
                    variants={fadeUp}
                    key={v.id}
                    onClick={() => !isBikeAndMultiple && setSelected(v.id)}
                    whileHover={!isBikeAndMultiple ? { scale: 1.01, y: -1 } : {}}
                    whileTap={!isBikeAndMultiple ? { scale: 0.98 } : {}}
                    className={`relative p-4 rounded-[1.25rem] transition-all duration-300 border
                      ${isBikeAndMultiple 
                         ? "opacity-50 grayscale bg-gray-50 border-gray-200 cursor-not-allowed"
                         : active
                           ? "bg-amber-50/70 border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-400"
                           : "bg-white border-gray-200 hover:border-amber-300 cursor-pointer shadow-sm hover:shadow-md"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* ICON */}
                      <div className={`mt-1 h-12 w-12 shrink-0 rounded-[1rem] flex items-center justify-center transition-all duration-300
                          ${active ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-gray-100 text-gray-600 border border-gray-200"}
                      `}>
                        <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 min-w-0 pr-2">
                         <div className="flex items-center gap-2">
                           <h3 className={`font-black tracking-tight ${active ? "text-orange-600" : "text-gray-900"}`}>{v.name}</h3>
                           {active && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" fill="currentColor" stroke="white" />}
                         </div>
                         <p className="text-[11px] font-semibold text-gray-500 line-clamp-1 mt-0.5">{v.desc}</p>
                         <p className="text-[10px] font-bold text-gray-400 mt-1.5 flex items-center gap-1.5"><Clock className="w-3 h-3 text-amber-500" /> {v.eta} ETA</p>
                      </div>

                      {/* PRICE */}
                      <div className="text-right shrink-0">
                         {isBikeAndMultiple ? (
                            <div className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 max-w-[70px] leading-tight text-center">Max 1 seat</div>
                         ) : (
                            <>
                               <div className="flex items-baseline justify-end gap-1">
                                  <span className="text-[11px] font-black text-gray-400">₹</span>
                                  <span className={`text-2xl font-black tracking-tight ${active ? "text-orange-600" : "text-gray-900"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {fareInfo.fare.perPerson}
                                  </span>
                               </div>
                               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                  Per seat
                               </div>
                            </>
                         )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
         </div>

         {/* STICKY CTA */}
         <div className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10">
            <button
               disabled={!selected}
               onClick={handleContinue}
               className={`w-full h-14 rounded-2xl text-[16px] font-extrabold flex items-center justify-center gap-2 transition-all duration-300
                 ${selected 
                   ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_8px_30px_rgba(245,158,11,0.35)] active:scale-[0.98]" 
                   : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
             >
               Confirm {passengers} {passengers === 1 ? 'Seat' : 'Seats'}
               <ArrowRight className="h-5 w-5" />
             </button>
         </div>
      </motion.div>
      <style>{`
         .font-inter { font-family: 'Inter', system-ui, sans-serif; }
         .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
