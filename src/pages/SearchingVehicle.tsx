import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Search,
  MapPin,
  CheckCircle2,
  RotateCcw,
  XCircle,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* -------------------- CONSTANTS -------------------- */

const MAX_WAIT = 7000;          // ms before timeout
const FOUND_AT = 4500;          // ms when driver is found
const FOUND_DELAY = 1200;       // ms to show "found" before navigation

const VEHICLE_TYPES = ["bike", "auto", "car", "xl"] as const;
type VehicleKey = (typeof VEHICLE_TYPES)[number];

const ETA_BY_VEHICLE: Record<VehicleKey, number> = {
  bike: 3,
  auto: 4,
  car: 5,
  xl: 7,
};

/* -------------------- TYPES -------------------- */

interface RideSummaryLite {
  pickup: string;
  drop: string;
}

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
function useRideSummary(): [RideSummaryLite | null, boolean, Error | null] {
  const [savedRide, loading, error] = useLocalStorage<RideSummaryLite | null>("rideSummary", null);
  return [savedRide, loading, error];
}

/** Simulates the driver search process. */
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
      // Allow the user to see the "found" state before navigating
      setTimeout(() => {
        onFound?.();
      }, FOUND_DELAY);
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

  // Start search on mount and when vehicleType changes (implicitly via key)
  useEffect(() => {
    const cleanup = startSearch();
    return cleanup;
  }, [startSearch, vehicleType]); // vehicleType is a dependency to restart if it changes

  const retry = useCallback(() => {
    startSearch();
  }, [startSearch]);

  return { status, progress, retry };
}

/* -------------------- SUBCOMPONENTS -------------------- */

interface StepIndicatorProps {
  current: number;
  total: number;
}

const StepIndicator = ({ current, total }: StepIndicatorProps) => (
  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
    Step {current} of {total}
  </span>
);

interface RideSummaryCardProps {
  ride: RideSummaryLite;
}

const RideSummaryCard = ({ ride }: RideSummaryCardProps) => (
  <Card className="p-4 rounded-2xl text-left space-y-2">
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

const MapPreview = () => (
  <Card className="h-36 rounded-2xl flex items-center justify-center bg-muted/40">
    <MapPin className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
    <span className="ml-2 text-sm text-muted-foreground">Map preview</span>
  </Card>
);

interface StatusIconProps {
  status: "searching" | "found" | "timeout";
}

const StatusIcon = ({ status }: StatusIconProps) => {
  switch (status) {
    case "searching":
      return (
        <div className="relative flex justify-center items-center h-32">
          <Search className="h-16 w-16 text-primary animate-pulse z-10" aria-hidden="true" />
          <Loader2 className="absolute h-24 w-24 text-primary/30 animate-spin" aria-hidden="true" />
        </div>
      );
    case "found":
      return (
        <div className="flex justify-center h-32 items-center">
          <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" aria-hidden="true" />
        </div>
      );
    case "timeout":
      return (
        <div className="flex justify-center h-32 items-center">
          <XCircle className="h-20 w-20 text-destructive" aria-hidden="true" />
        </div>
      );
  }
};

interface StatusTextProps {
  status: "searching" | "found" | "timeout";
  eta: number;
}

const StatusText = ({ status, eta }: StatusTextProps) => {
  const ariaLive = status === "searching" ? "polite" : "assertive";

  return (
    <div aria-live={ariaLive} className="space-y-1">
      {status === "searching" && (
        <>
          <h1 className="text-xl font-bold">Finding nearby drivers</h1>
          <p className="text-sm text-muted-foreground">
            Estimated arrival: {eta} min
          </p>
        </>
      )}
      {status === "found" && (
        <>
          <h1 className="text-xl font-bold text-green-600">Driver found!</h1>
          <p className="text-sm text-muted-foreground">
            Connecting you to the ride
          </p>
        </>
      )}
      {status === "timeout" && (
        <>
          <h1 className="text-xl font-bold text-destructive">
            No drivers available
          </h1>
          <p className="text-sm text-muted-foreground">
            Please try again
          </p>
        </>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  label: string;
}

const ProgressBar = ({ progress, label }: ProgressBarProps) => (
  <div className="space-y-2">
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

interface ActionButtonsProps {
  status: "searching" | "found" | "timeout";
  onRetry: () => void;
  onCancel: () => void;
}

const ActionButtons = ({ status, onRetry, onCancel }: ActionButtonsProps) => {
  if (status === "timeout") {
    return (
      <Button onClick={onRetry} className="w-full h-12 rounded-2xl gap-2">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Retry search
      </Button>
    );
  }

  if (status === "searching") {
    return (
      <Button
        variant="outline"
        onClick={onCancel}
        className="w-full h-12 rounded-2xl gap-2"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Cancel search
      </Button>
    );
  }

  return null; // no actions when found (automatic navigation)
};

/* -------------------- MAIN COMPONENT -------------------- */

const SearchingVehicle = () => {
  const navigate = useNavigate();

  // Load data from localStorage
  const [vehicleType, vehicleLoading] = useVehicleType();
  const [ride, rideLoading, rideError] = useRideSummary();

  // Memoized ETA based on vehicle type
  const eta = useMemo(() => ETA_BY_VEHICLE[vehicleType], [vehicleType]);

  // Handle found state: navigate to ride confirmed
  const handleFound = useCallback(() => {
    navigate("/ride-confirmed");
  }, [navigate]);

  // Search simulation
  const { status, progress, retry } = useSearchSimulation(vehicleType, handleFound);

  // Redirect if ride data is missing (after loading)
  useEffect(() => {
    if (!rideLoading && (rideError || !ride)) {
      // You could show an error toast here and then redirect
      navigate("/vehicles", { replace: true });
    }
  }, [rideLoading, rideError, ride, navigate]);

  const handleCancel = useCallback(() => {
    navigate("/vehicles");
  }, [navigate]);

  // Show loading state (unlikely, but possible)
  if (vehicleLoading || rideLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // At this point ride is guaranteed to exist because we redirect if not
  if (!ride) return null; // or a fallback, but redirect will happen

  return (
    <main className="min-h-screen bg-background flex justify-center px-4 py-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <StepIndicator current={4} total={4} />

        <RideSummaryCard ride={ride} />

        <MapPreview />

        <StatusIcon status={status} />

        <StatusText status={status} eta={eta} />

        {status === "searching" && (
          <ProgressBar progress={progress} label="Matching best driver for you…" />
        )}

        <ActionButtons
          status={status}
          onRetry={retry}
          onCancel={handleCancel}
        />

        <p className="text-[11px] text-muted-foreground">
          You will not be charged until the ride starts
        </p>
      </div>
    </main>
  );
};

export default SearchingVehicle;