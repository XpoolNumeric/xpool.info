import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/sections/AuthDialog";
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Zap,
  IndianRupee,
  ShieldCheck,
  Calendar,
  Clock,
  Timer,
  Search,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ===================== Injected Styles (memoized) ===================== */
const bookingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .bs-card {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(245, 158, 11, 0.15);
    box-shadow:
      0 4px 6px -1px rgba(0,0,0,0.05),
      0 20px 60px -10px rgba(245,158,11,0.12),
      0 0 0 1px rgba(255,255,255,0.8) inset;
  }

  .bs-input-wrap {
    border: 1.5px solid rgba(209,213,219,0.8);
    border-radius: 14px;
    background: rgba(255,255,255,0.9);
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .bs-input-wrap:focus-within {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.10);
    background: #fff;
  }

  .bs-swap-btn {
    background: linear-gradient(135deg, #fff 60%, #fffbeb 100%);
    border: 1.5px solid rgba(245,158,11,0.25);
    box-shadow: 0 2px 10px rgba(245,158,11,0.12);
    transition: all 0.2s;
  }
  .bs-swap-btn:hover {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: rgba(245,158,11,0.5);
    box-shadow: 0 4px 18px rgba(245,158,11,0.22);
    transform: rotate(180deg) scale(1.08);
  }

  .bs-tab {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    border: 1.5px solid transparent;
  }
  .bs-tab-active {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: #1a0800 !important;
    border-color: #f59e0b;
    box-shadow: 0 4px 16px rgba(245,158,11,0.30);
  }
  .bs-tab-inactive {
    background: rgba(245,158,11,0.06);
    color: #78716c !important;
    border-color: rgba(245,158,11,0.15);
  }
  .bs-tab-inactive:hover {
    background: rgba(245,158,11,0.12);
    border-color: rgba(245,158,11,0.30);
    color: #44403c !important;
  }

  .bs-book-btn {
    background: linear-gradient(110deg, #f59e0b 0%, #fbbf24 40%, #fde68a 60%, #fbbf24 80%, #f59e0b 100%);
    background-size: 200% auto;
    animation: bs-shimmer 2.8s linear infinite;
    color: #1a0800 !important;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: 0.01em;
    border: none;
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(245,158,11,0.35), 0 1px 0 rgba(255,255,255,0.3) inset;
    transition: filter 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .bs-book-btn:hover:not(:disabled) {
    filter: brightness(1.06);
    box-shadow: 0 8px 36px rgba(245,158,11,0.50), 0 1px 0 rgba(255,255,255,0.3) inset;
    transform: translateY(-1px);
  }
  .bs-book-btn:active:not(:disabled) { transform: translateY(0); }
  .bs-book-btn:disabled {
    animation: none;
    background: #e5e7eb !important;
    color: #9ca3af !important;
    box-shadow: none;
    cursor: not-allowed;
  }

  @keyframes bs-shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  .bs-suggestion-item {
    transition: background 0.15s;
    cursor: pointer;
  }
  .bs-suggestion-item:hover { background: rgba(245,158,11,0.07); }

  .bs-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    color: #78716c;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.06);
    transition: background 0.2s;
  }
  .bs-stat:hover { background: rgba(245,158,11,0.08); }

  .bs-connector {
    width: 2px;
    height: 24px;
    background: linear-gradient(to bottom, #f59e0b55, transparent);
    border-radius: 2px;
    margin: -6px auto;
    position: relative;
    z-index: 1;
  }
`;

/* ===================== Utils ===================== */

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ===================== Animation Variants ===================== */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const sectionVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ===================== Main ===================== */

const BookingSection = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [activeBox, setActiveBox] = useState<"pickup" | "drop" | null>(null);
  const [rideType, setRideType] = useState<"now" | "later">("now");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* ── Locations ── */
  const locations = useMemo(() => [
    "Chennai, Tamil Nadu",
    "Coimbatore, Tamil Nadu",
    "Madurai, Tamil Nadu",
    "T. Nagar, Chennai",
    "Anna Nagar, Chennai",
    "Velachery, Chennai",
    "Tambaram, Chennai",
    "Adyar, Chennai",
    "Airport, Chennai",
  ], []);

  const debouncedPickup = useDebounce(pickupLocation);
  const debouncedDrop = useDebounce(dropLocation);

  const pickupSuggestions = useMemo(() => {
    if (activeBox !== "pickup" || !debouncedPickup) return locations.slice(0, 5);
    return locations.filter((l) => l.toLowerCase().includes(debouncedPickup.toLowerCase())).slice(0, 5);
  }, [debouncedPickup, activeBox, locations]);

  const dropSuggestions = useMemo(() => {
    if (activeBox !== "drop" || !debouncedDrop) return locations.slice(0, 5);
    return locations.filter((l) => l.toLowerCase().includes(debouncedDrop.toLowerCase())).slice(0, 5);
  }, [debouncedDrop, activeBox, locations]);

  /* ── Defaults ── */
  useEffect(() => {
    const now = new Date();
    setPickupDate(now.toISOString().split("T")[0]);
    setPickupTime(now.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    if (rideType === "now") {
      const now = new Date();
      setPickupDate(now.toISOString().split("T")[0]);
      setPickupTime(now.toTimeString().slice(0, 5));
    }
  }, [rideType]);

  /* ── Outside Click ── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!pickupRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setActiveBox(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ── Helpers ── */
  const isToday = pickupDate === new Date().toISOString().split("T")[0];

  const canBook =
    pickupLocation &&
    dropLocation &&
    pickupLocation !== dropLocation &&
    (rideType === "now" || (pickupDate && pickupTime));

  // ✅ Fixed: simple swap using both current values
  const swapLocations = useCallback(() => {
    setPickupLocation(dropLocation);
    setDropLocation(pickupLocation);
    setActiveBox(null);
  }, [pickupLocation, dropLocation]);

  const handleBook = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowAuthDialog(true);
    }, 700);
  }, []);

  /* ── UI ── */
  // ✅ Memoize style tag to avoid recreation
  const styleElement = useMemo(() => <style>{bookingStyles}</style>, []);

  return (
    <>
      {styleElement}

      <section
        id="booking-section"
        className="py-14 sm:py-20 scroll-mt-20 relative overflow-hidden"
        style={{ background: "#FEF9EE" }}
      >
        {/* Layer 1 — dot grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(26,26,46,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Layer 2 — warm orange-gold radial glow (top centre) */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 420,
            background: "radial-gradient(ellipse, rgba(255,179,0,0.20) 0%, transparent 70%)",
            filter: "blur(52px)",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-lg mx-auto"
            variants={sectionVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Header */}
            <motion.div variants={fadeUp} className="text-center mb-8">
              <p
                className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3"
                style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}
              >
                Instant booking
              </p>
              <h2
                className="text-3xl sm:text-4xl font-black text-gray-900 mb-2"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                India Moves On{" "}
                <span
                  className="text-amber-500"
                  style={{ textShadow: "0 2px 0 rgba(160,80,0,0.12)" }}
                >
                  Xpool
                </span>
              </h2>
              <p
                className="text-sm text-gray-400"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Book your ride in under 30 seconds
              </p>
            </motion.div>

            {/* Card */}
            <motion.div variants={fadeUp}>
              <div className="bs-card rounded-2xl p-6 sm:p-8">

                {/* Ride Type Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-gray-50 border border-gray-100">
                  {(["now", "later"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setRideType(type)}
                      className={`bs-tab h-11 flex items-center justify-center gap-2 text-sm ${rideType === type ? "bs-tab-active" : "bs-tab-inactive"
                        }`}
                    >
                      {type === "now" ? <Timer className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      {type === "now" ? "Ride Now" : "Schedule Later"}
                    </button>
                  ))}
                </div>

                {/* Location Inputs */}
                <div className="space-y-2">
                  {/* Pickup */}
                  <div ref={pickupRef} className="relative">
                    <LocationInput
                      icon={<MapPin className="h-5 w-5 text-amber-500" />}
                      label="Pickup location"
                      value={pickupLocation}
                      active={activeBox === "pickup"}
                      onFocus={() => setActiveBox("pickup")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
                      placeholder="Where are you?"
                    />
                    <SuggestionList
                      visible={activeBox === "pickup"}
                      suggestions={pickupSuggestions}
                      onSelect={(v: string) => {
                        setPickupLocation(v);
                        setActiveBox("drop");
                      }}
                      icon={<MapPin className="h-4 w-4 text-amber-400" />}
                    />
                  </div>

                  {/* Connector + Swap */}
                  <div className="flex items-center justify-between px-2">
                    <div
                      className="bs-connector"
                      style={{
                        width: 2,
                        height: 20,
                        background: "linear-gradient(to bottom, rgba(245,158,11,0.4), rgba(245,158,11,0.1))",
                        borderRadius: 2,
                        marginLeft: 19,
                      }}
                    />
                    <motion.button
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      onClick={swapLocations}
                      className="bs-swap-btn h-9 w-9 rounded-xl flex items-center justify-center"
                      aria-label="Swap pickup and drop locations"
                    >
                      <ArrowUpDown className="h-4 w-4 text-amber-600" />
                    </motion.button>
                  </div>

                  {/* Drop */}
                  <div ref={dropRef} className="relative">
                    <LocationInput
                      icon={<Navigation className="h-5 w-5 text-blue-500" />}
                      label="Drop location"
                      value={dropLocation}
                      active={activeBox === "drop"}
                      onFocus={() => setActiveBox("drop")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDropLocation(e.target.value)}
                      placeholder="Where to?"
                    />
                    <SuggestionList
                      visible={activeBox === "drop"}
                      suggestions={dropSuggestions}
                      onSelect={(v: string) => {
                        setDropLocation(v);
                        setActiveBox(null);
                      }}
                      icon={<Navigation className="h-4 w-4 text-blue-400" />}
                    />
                  </div>
                </div>

                {/* Validation message */}
                <AnimatePresence>
                  {pickupLocation && dropLocation && pickupLocation === dropLocation && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-xs text-red-500 text-center mt-3 font-medium"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Pickup and drop must be different locations
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Schedule DateTime — shown only for "later" */}
                <AnimatePresence>
                  {rideType === "later" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mt-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DateTimeInput
                          icon={<Calendar className="h-4 w-4 text-amber-500" />}
                          label="Date"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={pickupDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupDate(e.target.value)}
                        />
                        <DateTimeInput
                          icon={<Clock className="h-4 w-4 text-amber-500" />}
                          label="Time"
                          type="time"
                          min={isToday ? new Date().toTimeString().slice(0, 5) : undefined}
                          value={pickupTime}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupTime(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <motion.button
                  disabled={!canBook || loading}
                  onClick={handleBook}
                  whileHover={canBook && !loading ? { scale: 1.02 } : undefined}
                  whileTap={canBook && !loading ? { scale: 0.98 } : undefined}
                  className="bs-book-btn w-full h-14 mt-5 flex items-center justify-center gap-2"
                  aria-label="Book your ride"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Finding drivers…
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Book Ride
                      <ChevronRight className="h-5 w-5 ml-1 opacity-70" />
                    </>
                  )}
                </motion.button>

                {/* Trust stats */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                  <span className="bs-stat">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Avg. 4 min pickup
                  </span>
                  <span className="bs-stat">
                    <IndianRupee className="h-3.5 w-3.5 text-green-500" /> Best fare
                  </span>
                  <span className="bs-stat">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Verified drivers
                  </span>
                </div>

              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </>
  );
};

export default BookingSection;

/* ===================== Location Input ===================== */

const LocationInput = memo(({
  icon, label, value, active, onFocus, onChange, placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  onFocus: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) => (
  // ✅ Removed unnecessary 'ring-0' class
  <div className="bs-input-wrap flex items-center gap-3 px-4 py-3.5">
    <span className="flex-shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      {value && (
        <p
          className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}
        >
          {label}
        </p>
      )}
      <Input
        value={value}
        onFocus={onFocus}
        onChange={onChange}
        placeholder={placeholder}
        className="border-0 p-0 h-auto text-sm font-medium text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 bg-transparent"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        autoComplete="off"
      />
    </div>
  </div>
));
LocationInput.displayName = "LocationInput";

/* ===================== Date/Time Input ===================== */

const DateTimeInput = ({ icon, label, ...props }: any) => (
  <div className="bs-input-wrap flex items-center gap-3 px-4 py-3.5">
    {icon}
    <div className="flex-1 min-w-0">
      <p
        className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </p>
      <Input
        {...props}
        className="border-0 p-0 h-auto text-sm font-medium text-gray-800 focus-visible:ring-0 bg-transparent"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  </div>
);

/* ===================== Suggestion List ===================== */

// ✅ Removed unused 'query' prop
const SuggestionList = ({
  visible, suggestions, onSelect, icon,
}: {
  visible: boolean;
  suggestions: string[];
  onSelect: (v: string) => void;
  icon: React.ReactNode;
}) => (
  <AnimatePresence>
    {visible && suggestions.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)" }}
      >
        <div className="px-3 py-2 border-b border-gray-50">
          <p
            className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Suggested locations
          </p>
        </div>
        {suggestions.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            className="bs-suggestion-item flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0"
          >
            <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-amber-50">
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-gray-800 truncate"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.split(",")[0]}
              </p>
              <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {item.includes(",") ? item.split(",").slice(1).join(",").trim() : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
          </div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);