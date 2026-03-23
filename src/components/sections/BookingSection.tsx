import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import { useLoadScript } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/sections/AuthDialog";
import { useNavigate } from "react-router-dom";
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
  LocateFixed,
  Loader2,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



/* ===================== Injected Styles (full fallback stacks) ===================== */
const bookingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .booking-section {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .bs-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(245, 158, 11, 0.2);
    box-shadow:
      0 8px 30px rgba(0,0,0,0.04),
      0 20px 60px -10px rgba(245,158,11,0.15),
      0 0 0 1px rgba(255,255,255,0.8) inset;
  }

  .bs-input-wrap {
    border: 1.5px solid rgba(209,213,219,0.8);
    border-radius: 16px;
    background: white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bs-input-wrap:focus-within {
    border-color: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245,158,11,0.12);
  }
  
  @keyframes pulse-gentle {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
  .animate-pulse-gentle {
    animation: pulse-gentle 2s infinite ease-in-out;
  }

  .bs-swap-btn {
    background: white;
    border: 1.5px solid rgba(245,158,11,0.3);
    box-shadow: 0 2px 8px rgba(245,158,11,0.1);
    transition: all 0.2s;
    width: 40px;
    height: 40px;
    border-radius: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f59e0b;
  }
  .bs-swap-btn:hover {
    background: #fffbeb;
    border-color: #f59e0b;
    box-shadow: 0 4px 12px rgba(245,158,11,0.2);
    transform: scale(1.05);
  }
  .bs-swap-btn:active {
    transform: scale(0.98);
  }

  .bs-tab {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.2s ease;
    border: 1.5px solid transparent;
    padding: 0.5rem 1rem;
    letter-spacing: 0.3px;
  }
  .bs-tab-active {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: #1a0800;
    border-color: #f59e0b;
    box-shadow: 0 4px 12px rgba(245,158,11,0.3);
  }
  .bs-tab-inactive {
    background: rgba(245,158,11,0.06);
    color: #78716c;
    border-color: rgba(245,158,11,0.15);
  }
  .bs-tab-inactive:hover {
    background: rgba(245,158,11,0.12);
    border-color: rgba(245,158,11,0.3);
    color: #44403c;
  }

  .bs-book-btn {
    background: linear-gradient(110deg, #f59e0b 0%, #fbbf24 40%, #fde68a 60%, #fbbf24 80%, #f59e0b 100%);
    background-size: 200% auto;
    animation: bs-shimmer 3s linear infinite;
    color: #1a0800;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    border: none;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(245,158,11,0.4), 0 1px 0 rgba(255,255,255,0.3) inset;
    transition: filter 0.2s, box-shadow 0.2s, transform 0.15s;
    height: 56px;
    letter-spacing: 0.5px;
  }
  .bs-book-btn:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: 0 8px 30px rgba(245,158,11,0.5), 0 1px 0 rgba(255,255,255,0.3) inset;
    transform: translateY(-2px);
  }
  .bs-book-btn:active:not(:disabled) { transform: translateY(0); }
  .bs-book-btn:disabled {
    animation: none;
    background: #e5e7eb;
    color: #9ca3af;
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
    padding: 0.75rem 1rem;
  }
  .bs-suggestion-item:hover { background: rgba(245,158,11,0.07); }

  .bs-stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: #57534e;
    padding: 6px 14px;
    border-radius: 40px;
    background: rgba(0,0,0,0.02);
    border: 1px solid rgba(0,0,0,0.04);
    transition: background 0.2s;
    letter-spacing: 0.2px;
  }
  .bs-stat:hover { background: rgba(245,158,11,0.05); }

  .bs-connector {
    width: 2px;
    height: 24px;
    background: linear-gradient(to bottom, #f59e0b 20%, rgba(245,158,11,0.2));
    border-radius: 2px;
    margin-left: 24px;
  }

  .tricolor-text {
    background: linear-gradient(to right, #FF9933, #FFFFFF, #138808);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    display: inline-block;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-weight: 900;
  }

  /* suggestion list scroll */
  .suggestion-list {
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #f59e0b #f1f5f9;
  }
  .suggestion-list::-webkit-scrollbar {
    width: 5px;
  }
  .suggestion-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .suggestion-list::-webkit-scrollbar-thumb {
    background: #f59e0b;
    border-radius: 10px;
  }

  /* Professional typography refinements */
  h2, .heading-professional {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .caption-professional {
    font-family: inherit;  /* inherit DM Sans stack from parent */
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #a8a29e;
  }

  .input-label-professional {
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: #f59e0b;
    text-transform: uppercase;
  }
`;

/* ===================== Utils ===================== */

function useDebounce<T>(value: T, delay = 300): T {
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ===================== Types ===================== */

interface DateTimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  label: string;
}

/* ===================== Main Component ===================== */

const BookingSection = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [activeBox, setActiveBox] = useState<"pickup" | "drop" | null>(null);
  const [rideType, setRideType] = useState<"now" | "later">("now");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const locationFetchedRef = useRef(false);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !window.google) {
      console.warn("Geolocation or Google Maps not available");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        geocoder.geocode({ location: latlng }, (results, status) => {
          setIsLocating(false);
          if (status === "OK" && results && results[0]) {
            setPickupLocation(results[0].formatted_address);
          }
        });
      },
      (error) => {
        setIsLocating(false);
        console.error("Error getting geolocation:", error);
        // Alert user if permission is denied
        if (error.code === 1) {
          alert("Location permission denied. Please enable location access in your browser settings.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (isLoaded && !locationFetchedRef.current && window.google) {
      locationFetchedRef.current = true;
      // Small delay to ensure maps engine is fully ready
      const timer = setTimeout(() => {
        if (!pickupLocation) {
          handleGetCurrentLocation();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, handleGetCurrentLocation, pickupLocation]);

  const [pickupPredictions, setPickupPredictions] = useState<string[]>([]);
  const [dropPredictions, setDropPredictions] = useState<string[]>([]);
  const autocompleteService = useRef<any>(null);

  const debouncedPickup = useDebounce(pickupLocation);
  const debouncedDrop = useDebounce(dropLocation);

  useEffect(() => {
    let isActive = true;
    if (!isLoaded || activeBox !== "pickup" || !debouncedPickup) {
      setPickupPredictions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const mapsPlaces = (window as any).google.maps.places;
        if (mapsPlaces.AutocompleteSuggestion) {
          const response = await mapsPlaces.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: debouncedPickup,
            region: "IN",
          });
          if (isActive && response.suggestions) {
            setPickupPredictions(
              response.suggestions.map((s: any) => s.placePrediction?.text?.text || s.placePrediction?.description || "")
            );
          }
        } else {
          // Fallback to legacy
          if (!autocompleteService.current) {
            autocompleteService.current = new mapsPlaces.AutocompleteService();
          }
          autocompleteService.current.getPlacePredictions(
            { input: debouncedPickup, componentRestrictions: { country: "IN" } },
            (predictions: any, status: any) => {
              if (!isActive) return;
              if (status === mapsPlaces.PlacesServiceStatus.OK && predictions) {
                setPickupPredictions(predictions.map((p: any) => p.description));
              } else {
                setPickupPredictions([]);
              }
            }
          );
        }
      } catch (err) {
        if (isActive) setPickupPredictions([]);
      }
    };

    fetchSuggestions();
    return () => {
      isActive = false;
    };
  }, [debouncedPickup, activeBox, isLoaded]);

  useEffect(() => {
    let isActive = true;
    if (!isLoaded || activeBox !== "drop" || !debouncedDrop) {
      setDropPredictions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const mapsPlaces = (window as any).google.maps.places;
        if (mapsPlaces.AutocompleteSuggestion) {
          const response = await mapsPlaces.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: debouncedDrop,
            region: "IN",
          });
          if (isActive && response.suggestions) {
            setDropPredictions(
              response.suggestions.map((s: any) => s.placePrediction?.text?.text || s.placePrediction?.description || "")
            );
          }
        } else {
          // Fallback to legacy
          if (!autocompleteService.current) {
            autocompleteService.current = new mapsPlaces.AutocompleteService();
          }
          autocompleteService.current.getPlacePredictions(
            { input: debouncedDrop, componentRestrictions: { country: "IN" } },
            (predictions: any, status: any) => {
              if (!isActive) return;
              if (status === mapsPlaces.PlacesServiceStatus.OK && predictions) {
                setDropPredictions(predictions.map((p: any) => p.description));
              } else {
                setDropPredictions([]);
              }
            }
          );
        }
      } catch (err) {
        if (isActive) setDropPredictions([]);
      }
    };

    fetchSuggestions();
    return () => {
      isActive = false;
    };
  }, [debouncedDrop, activeBox, isLoaded]);

  const pickupSuggestions = useMemo(() => {
    if (activeBox !== "pickup" || !debouncedPickup) return [];
    return pickupPredictions.slice(0, 5);
  }, [debouncedPickup, activeBox, pickupPredictions]);

  const dropSuggestions = useMemo(() => {
    if (activeBox !== "drop" || !debouncedDrop) return [];
    return dropPredictions.slice(0, 5);
  }, [debouncedDrop, activeBox, dropPredictions]);

  /* ── Default date/time ── */
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

  /* ── Close suggestions on outside click ── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!pickupRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setActiveBox(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isToday = pickupDate === new Date().toISOString().split("T")[0];

  const canBook =
    pickupLocation &&
    dropLocation &&
    pickupLocation !== dropLocation &&
    (rideType === "now" || (pickupDate && pickupTime));

  const swapLocations = useCallback(() => {
    setPickupLocation(dropLocation);
    setDropLocation(pickupLocation);
    setActiveBox(null);
  }, [pickupLocation, dropLocation]);

  const handleBook = useCallback(() => {
    setLoading(true);

    const proceedWithBooking = (distanceKm?: number, durationMin?: number) => {
      // Save ride details safely to localStorage
      const rideDetails = {
        pickup: pickupLocation,
        drop: dropLocation,
        rideType,
        date: pickupDate,
        time: pickupTime,
        timestamp: new Date().toISOString(),
        distanceKm,
        durationMin,
        passengers
      };
      
      localStorage.setItem("rideSummary", JSON.stringify(rideDetails));

      setTimeout(() => {
        setLoading(false);

        let isLoggedAndComplete = false;
        try {
          const profileStr = localStorage.getItem("profile");
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            if (profile.fullName && profile.email && profile.city && profile.dob) {
              isLoggedAndComplete = true;
            }
          }
        } catch (e) {
          console.error("Error reading profile from local storage", e);
        }

        if (isLoggedAndComplete) {
          navigate("/available-rides");
        } else {
          setShowAuthDialog(true);
        }
      }, 700);
    };

    // Calculate distance and duration using new Routes API
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (apiKey && pickupLocation && dropLocation) {
      fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: { address: pickupLocation },
          destination: { address: dropLocation },
          travelMode: "DRIVE",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const route = data?.routes?.[0];
          if (route) {
            const distanceKm = (route.distanceMeters || 0) / 1000;
            const durationSec = parseInt(route.duration?.replace("s", "") || "0", 10);
            const durationMin = durationSec / 60;
            proceedWithBooking(distanceKm || 15, durationMin || 30);
          } else {
            proceedWithBooking(15, 30);
          }
        })
        .catch(() => proceedWithBooking(15, 30));
    } else {
      proceedWithBooking(15, 30);
    }
  }, [navigate, pickupLocation, dropLocation, rideType, pickupDate, pickupTime, passengers]);


  const styleElement = useMemo(() => <style>{bookingStyles}</style>, []);

  return (
    <>
      {styleElement}

      <section
        id="booking-section"
        className="booking-section py-14 sm:py-20 scroll-mt-20 relative overflow-hidden"
        style={{ background: "#FEF9EE" }}
      >
        {/* Dot grid background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(26,26,46,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Warm glow */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 420,
            background: "radial-gradient(ellipse, rgba(255,179,0,0.18) 0%, transparent 70%)",
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
                className="caption-professional text-amber-600 mb-3"
              >
                Instant booking
              </p>
              <h2
                className="heading-professional text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-tight"
              >
                <span className="tricolor-text">India</span> Moves On{" "}
                <span>
                  <span className="text-amber-500">X</span>
                  <span className="text-black">pool</span>
                </span>
              </h2>
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
              >
                Book your ride in under 30 seconds
              </p>
            </motion.div>

            {/* Card */}
            <motion.div variants={fadeUp}>
              <div className="bs-card rounded-3xl p-6 sm:p-8">

                {/* Ride Type Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-gray-50 border border-gray-100">
                  {(["now", "later"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setRideType(type)}
                      className={`bs-tab flex items-center justify-center gap-2 text-sm ${rideType === type ? "bs-tab-active" : "bs-tab-inactive"
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
                      onLocate={handleGetCurrentLocation}
                      isLocating={isLocating}
                    />
                    <SuggestionList
                      visible={activeBox === "pickup"}
                      suggestions={pickupSuggestions}
                      onSelect={(v: string) => {
                        setPickupLocation(v);
                        setActiveBox("drop");
                      }}
                      icon={<MapPin className="h-4 w-4 text-amber-400" />}
                      query={debouncedPickup}
                    />
                  </div>

                  {/* Connector + Swap */}
                  <div className="flex items-center justify-between px-2">
                    <div className="bs-connector" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={swapLocations}
                      className="bs-swap-btn"
                      aria-label="Swap pickup and drop locations"
                    >
                      <ArrowUpDown className="h-4 w-4" />
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
                      query={debouncedDrop}
                    />
                  </div>
                </div>

                {/* Seat Selector */}
                <div className="flex items-center justify-between mt-4 p-3 rounded-2xl bg-gray-50/80 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-sm font-bold text-gray-700"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                      Seats needed
                    </span>
                  </div>
                  <div className="flex items-center bg-white rounded-full p-1 border border-gray-200/50 shadow-inner">
                    <button
                      onClick={() => setPassengers(Math.max(1, passengers - 1))}
                      className="w-8 h-8 rounded-full bg-white text-gray-700 shadow-sm border border-gray-200 flex items-center justify-center active:scale-95 transition-transform hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{passengers}</span>
                    <button
                      onClick={() => setPassengers(Math.min(6, passengers + 1))}
                      className="w-8 h-8 rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/30 border border-amber-600 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
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
                    >
                      Pickup and drop must be different locations
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Schedule DateTime — only for "later" */}
                <AnimatePresence>
                  {rideType === "later" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
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
                  className="bs-book-btn w-full mt-5 flex items-center justify-center gap-2"
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
                      Search Available Rides
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
                    <IndianRupee className="h-3.5 w-3.5 text-green-600" /> Best fare
                  </span>
                  <span className="bs-stat">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Verified drivers
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

/* ===================== Subcomponents ===================== */

const LocationInput = memo(({
  icon, label, value, active, onFocus, onChange, placeholder, onLocate, isLocating,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  onFocus: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  onLocate?: () => void;
  isLocating?: boolean;
}) => (
  <div className={`bs-input-wrap flex items-center gap-3 px-4 py-3.5 transition-all duration-300 ${active ? 'border-amber-400 ring-4 ring-amber-400/10' : ''}`}>
    <span className="flex-shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      {value && (
        <p className="input-label-professional mb-0.5">
          {label}
        </p>
      )}
      <input
        value={value}
        onFocus={onFocus}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border-0 p-0 h-auto text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0 bg-transparent outline-none"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        autoComplete="off"
      />
    </div>
    {onLocate && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLocate();
        }}
        disabled={isLocating}
        className="flex-shrink-0 p-2 hover:bg-amber-50 rounded-full transition-colors text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed group relative"
        title="Use current location"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="h-4 w-4 group-hover:scale-110 transition-transform" />
        )}

        {/* Tooltip */}
        {!isLocating && (
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 font-semibold whitespace-nowrap shadow-lg">
            Use Current Location
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </span>
        )}
      </button>
    )}
  </div>
));
LocationInput.displayName = "LocationInput";

const DateTimeInput: React.FC<DateTimeInputProps> = ({ icon, label, ...props }) => (
  <div className="bs-input-wrap flex items-center gap-3 px-4 py-3.5">
    <span className="flex-shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="input-label-professional mb-0.5">
        {label}
      </p>
      <input
        {...props}
        className="w-full border-0 p-0 h-auto text-sm font-medium text-gray-800 focus:outline-none focus:ring-0 bg-transparent outline-none"
        style={{ fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      />
    </div>
  </div>
);

const SuggestionList = ({
  visible, suggestions, onSelect, icon, query,
}: {
  visible: boolean;
  suggestions: string[];
  onSelect: (v: string) => void;
  icon: React.ReactNode;
  query: string;
}) => (
  <AnimatePresence>
    {visible && query && query.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }}
        className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
      >
        <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
          <p className="caption-professional">
            {suggestions.length > 0 ? "Suggested locations" : "Searching..."}
          </p>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Google Maps
          </div>
        </div>
        <div className="suggestion-list">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <div
                key={item}
                onClick={() => onSelect(item)}
                className="bs-suggestion-item flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-amber-50">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-gray-800 truncate"
                    style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                  >
                    {item.split(",")[0]}
                  </p>
                  <p
                    className="text-xs text-gray-400 truncate"
                    style={{ fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                  >
                    {item.includes(",") ? item.split(",").slice(1).join(",").trim() : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No exact match found. Please try modifying your search, or select from the map later.
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);