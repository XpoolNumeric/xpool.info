import { useEffect, useMemo, useState } from "react";
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

/* ---------------- CONFIG ---------------- */

const MAX_WAIT = 7000;
const FOUND_AT = 4500;

type VehicleKey = "bike" | "auto" | "car" | "xl";

const ETA_BY_VEHICLE: Record<VehicleKey, number> = {
  bike: 3,
  auto: 4,
  car: 5,
  xl: 7,
};

/* ---------------- TYPES ---------------- */

interface RideSummaryLite {
  pickup: string;
  drop: string;
}

/* ---------------- COMPONENT ---------------- */

const SearchingVehicle = () => {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] =
    useState<"searching" | "found" | "timeout">("searching");

  const [vehicleType, setVehicleType] =
    useState<VehicleKey>("car");

  const [ride, setRide] = useState<RideSummaryLite | null>(
    null
  );

  /* ---------------- LOAD DATA SAFELY ---------------- */

  useEffect(() => {
    try {
      const savedVehicle =
        localStorage.getItem("vehicleType") as VehicleKey | null;
      if (savedVehicle && savedVehicle in ETA_BY_VEHICLE) {
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
    } catch {
      // fail silently
    }
  }, []);

  const eta = useMemo(
    () => ETA_BY_VEHICLE[vehicleType],
    [vehicleType]
  );

  /* ---------------- SEARCH LOGIC ---------------- */

  useEffect(() => {
    if (status !== "searching") return;

    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min(
        (elapsed / FOUND_AT) * 100,
        100
      );
      setProgress(percent);
    }, 100);

    const foundTimer = setTimeout(() => {
      setStatus("found");
      clearInterval(interval);

      setTimeout(() => {
        navigate("/ride-confirmed");
      }, 1200);
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
  }, [navigate, status]);

  /* ---------------- ACTIONS ---------------- */

  const handleRetry = () => {
    setProgress(0);
    setStatus("searching");
  };

  const handleCancel = () => {
    navigate("/vehicles");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background flex justify-center px-4 py-6">
      <div className="w-full max-w-md space-y-6 text-center">

        {/* STEP */}
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
          Step 4 of 4
        </span>

        {/* FROM → TO GLANCE */}
        {ride && (
          <Card className="p-4 rounded-2xl text-left space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-1" />
              <div className="text-sm">
                <p className="font-medium truncate">
                  {ride.pickup}
                </p>
                <ArrowDown className="h-3 w-3 my-1 text-muted-foreground" />
                <p className="font-medium truncate">
                  {ride.drop}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* MAP PREVIEW */}
        <Card className="h-36 rounded-2xl flex items-center justify-center bg-muted/40">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Map preview
          </span>
        </Card>

        {/* SEARCH / FOUND ICON */}
        <div className="relative flex justify-center items-center h-32">
          {status === "searching" && (
            <>
              <Search className="h-16 w-16 text-primary animate-pulse z-10" />
              <Loader2 className="absolute h-24 w-24 text-primary/30 animate-spin" />
            </>
          )}

          {status === "found" && (
            <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" />
          )}

          {status === "timeout" && (
            <XCircle className="h-20 w-20 text-destructive" />
          )}
        </div>

        {/* TEXT */}
        {status === "searching" && (
          <>
            <h1 className="text-xl font-bold">
              Finding nearby drivers
            </h1>
            <p className="text-sm text-muted-foreground">
              Estimated arrival: {eta} min
            </p>
          </>
        )}

        {status === "found" && (
          <>
            <h1 className="text-xl font-bold text-green-600">
              Driver found!
            </h1>
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

        {/* PROGRESS */}
        {status === "searching" && (
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Matching best driver for you…
            </p>
          </div>
        )}

        {/* ACTIONS */}
        {status === "timeout" && (
          <Button
            onClick={handleRetry}
            className="w-full h-12 rounded-2xl gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retry search
          </Button>
        )}

        {status === "searching" && (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full h-12 rounded-2xl gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel search
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground">
          You will not be charged until the ride starts
        </p>
      </div>
    </div>
  );
};

export default SearchingVehicle;
