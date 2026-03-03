import { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component
import {
  Car,
  Bike,
  User,
  Phone,
  Star,
  MapPin,
  ArrowDown,
  Clock,
} from "lucide-react";

/* -------------------- TYPES -------------------- */

const VEHICLE_TYPES = ["bike", "auto", "car", "xl"] as const;
type VehicleKey = (typeof VEHICLE_TYPES)[number];

interface RideSummary {
  pickup: string;
  drop: string;
}

interface DriverInfo {
  name: string;
  rating: number;
  totalRides: number;
  phone: string;
  vehicleNumber: string;
  etaMinutes: number; // initial ETA
}

/* -------------------- CONSTANTS -------------------- */

const VEHICLE_ICONS: Record<VehicleKey, React.ElementType> = {
  bike: Bike,
  auto: Car,
  car: Car,
  xl: Car,
};

const FALLBACK_DRIVER: DriverInfo = {
  name: "Ramesh Kumar",
  rating: 4.8,
  totalRides: 1200,
  phone: "+91 98765 43210",
  vehicleNumber: "TN 09 AB 1234",
  etaMinutes: 5,
};

/* -------------------- CUSTOM HOOKS -------------------- */

/** Safely reads and parses an item from localStorage. */
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

/** Validates that a string is a known vehicle type. */
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

/** Fetches ride summary from localStorage. */
function useRideSummary(): [RideSummary | null, boolean, Error | null] {
  const [savedRide, loading, error] = useLocalStorage<RideSummary | null>("rideSummary", null);
  return [savedRide, loading, error];
}

/** Simulates live ETA countdown. */
function useEtaCountdown(initialEta: number): number {
  const [eta, setEta] = useState(initialEta);

  useEffect(() => {
    if (eta <= 0) return;

    const timer = setInterval(() => {
      setEta((prev) => Math.max(prev - 1, 0));
    }, 60000); // update every minute

    return () => clearInterval(timer);
  }, [eta]);

  return eta;
}

/* -------------------- SUBCOMPONENTS -------------------- */

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header = ({ title, subtitle }: HeaderProps) => (
  <header className="text-center space-y-1">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </header>
);

interface RideSummaryCardProps {
  ride: RideSummary;
}

const RideSummaryCard = ({ ride }: RideSummaryCardProps) => (
  <Card className="p-4 rounded-2xl space-y-2">
    <div className="flex items-start gap-3">
      <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" aria-hidden="true" />
      <div className="text-sm flex-1 min-w-0">
        <p className="font-medium truncate" title={ride.pickup}>
          {ride.pickup}
        </p>
        <ArrowDown className="h-3 w-3 my-1 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium truncate" title={ride.drop}>
          {ride.drop}
        </p>
      </div>
    </div>
  </Card>
);

interface VehicleCardProps {
  type: VehicleKey;
  vehicleNumber: string;
  eta: number;
}

const VehicleCard = ({ type, vehicleNumber, eta }: VehicleCardProps) => {
  const Icon = VEHICLE_ICONS[type];
  return (
    <Card className="p-4 rounded-2xl space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold capitalize truncate">{type} Ride</h3>
          <p className="text-xs text-muted-foreground truncate">{vehicleNumber}</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium whitespace-nowrap">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          <span aria-label={`Arrives in ${eta} minute${eta === 1 ? "" : "s"}`}>
            {eta} min
          </span>
        </div>
      </div>
    </Card>
  );
};

interface DriverCardProps {
  driver: DriverInfo;
  onCall: () => void;
}

const DriverCard = ({ driver, onCall }: DriverCardProps) => (
  <Card className="p-4 rounded-2xl space-y-3">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <User className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{driver.name}</h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" aria-hidden="true" />
          <span>
            {driver.rating} • {driver.totalRides.toLocaleString()} rides
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={onCall}
        aria-label={`Call ${driver.name}`}
      >
        <Phone className="h-5 w-5 text-primary" />
      </Button>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Driver arriving at pickup point</span>
    </div>
  </Card>
);

interface LoadingSkeletonProps {
  count?: number;
}

const LoadingSkeleton = ({ count = 3 }: LoadingSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-4 rounded-2xl space-y-3">
        <Skeleton className="h-12 w-full" />
      </Card>
    ))}
  </div>
);

/* -------------------- MAIN COMPONENT -------------------- */

const RideConfirmed = () => {
  const [vehicleType, vehicleLoading] = useVehicleType();
  const [ride, rideLoading, rideError] = useRideSummary();
  const [driver] = useState<DriverInfo>(FALLBACK_DRIVER); // Could be fetched from API
  const eta = useEtaCountdown(driver.etaMinutes);

  const handleCallDriver = useCallback(() => {
    // In a real app, this would initiate a phone call or show a modal.
    window.location.href = `tel:${driver.phone}`;
  }, [driver.phone]);

  const isLoading = vehicleLoading || rideLoading;

  // Show error state if ride data is missing or corrupted
  if (!isLoading && (rideError || !ride)) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex justify-center items-center">
        <Card className="p-6 max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            We couldn't load your ride details. Please go back and try again.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <Header title="Ride Confirmed" subtitle="Your driver is on the way" />

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {ride && <RideSummaryCard ride={ride} />}

            <VehicleCard
              type={vehicleType}
              vehicleNumber={driver.vehicleNumber}
              eta={eta}
            />

            <DriverCard driver={driver} onCall={handleCallDriver} />

            <Button
              className="w-full h-14 rounded-2xl text-lg font-semibold"
              aria-label="Track your ride in real time"
            >
              Track Ride
            </Button>

            {/* Optional: share ride details */}
            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => {
                navigator.share?.({
                  title: "My Ride",
                  text: `I'm riding with ${driver.name} from ${ride?.pickup} to ${ride?.drop}`,
                });
              }}
            >
              Share Ride Details
            </Button>
          </>
        )}
      </div>
    </main>
  );
};

export default RideConfirmed;