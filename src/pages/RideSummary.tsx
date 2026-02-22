import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type VehicleKey = "bike" | "auto" | "car" | "xl";

interface RideSummary {
  pickup: string;
  drop: string;
}

/* ---------------- CONFIG ---------------- */

const vehicleIcons: Record<VehicleKey, React.ElementType> = {
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

/* ---------------- COMPONENT ---------------- */

const RideConfirmed = () => {
  const [vehicleType, setVehicleType] =
    useState<VehicleKey>("car");

  const [ride, setRide] =
    useState<RideSummary | null>(null);

  const [driverStage, setDriverStage] =
    useState<"assigned" | "arriving">("assigned");

  const [driverProgress, setDriverProgress] =
    useState(0);

  /* ---------------- LOAD DATA SAFELY ---------------- */

  useEffect(() => {
    try {
      const savedVehicle =
        localStorage.getItem("vehicleType") as VehicleKey | null;

      if (savedVehicle && savedVehicle in vehicleIcons) {
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

  const VehicleIcon = vehicleIcons[vehicleType];

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

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background px-4 py-6 flex justify-center">
      <div className="w-full max-w-md space-y-6">

        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Ride Confirmed</h1>
          <p className="text-sm text-muted-foreground">
            Your driver is on the way
          </p>
        </div>

        {/* RIDE SUMMARY */}
        {ride && (
          <Card className="p-4 rounded-2xl space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-1" />
              <div className="text-sm flex-1">
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

        {/* DRIVER MOVEMENT */}
        <Card className="p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Driver {driverStage === "assigned" ? "assigned" : "arriving"}
            </span>
            <span>{Math.max(1, 5 - Math.floor(driverProgress / 25))} min</span>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${driverProgress}%` }}
            />
          </div>
        </Card>

        {/* VEHICLE CARD */}
        <Card className="p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <VehicleIcon className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold capitalize">
                {vehicleType} Ride
              </h3>
              <p className="text-xs text-muted-foreground">
                TN 09 AB 1234
              </p>
            </div>

            <div className="flex items-center gap-1 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              5 min
            </div>
          </div>
        </Card>

        {/* DRIVER CARD */}
        <Card className="p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold">Ramesh Kumar</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                4.8 • 1,200 rides
              </div>
            </div>

            <Phone className="h-5 w-5 text-primary" />
          </div>
        </Card>

        {/* TRIP TIMELINE */}
        <Card className="p-4 rounded-2xl space-y-2 text-sm">
          <TimelineItem label="Ride booked" done />
          <TimelineItem label="Driver assigned" done />
          <TimelineItem
            label="Driver arriving"
            active={driverStage === "arriving"}
          />
        </Card>

        {/* FARE BREAKDOWN */}
        <Card className="p-4 rounded-2xl space-y-2 text-sm">
          <FareRow label="Base fare" value={fare.base} />
          <FareRow
            label="Distance fare"
            value={fare.distanceFare}
          />
          <FareRow label="Platform fee" value={fare.platformFee} />
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total</span>
            <span>₹{fare.total}</span>
          </div>
        </Card>

        {/* ACTION */}
        <Button className="w-full h-14 rounded-2xl text-lg font-semibold">
          Track Ride
        </Button>
      </div>
    </div>
  );
};

export default RideConfirmed;

/* ---------------- HELPERS ---------------- */

const TimelineItem = ({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) => (
  <div className="flex items-center gap-2">
    {done ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <Navigation
        className={`h-4 w-4 ${
          active ? "text-primary animate-pulse" : "text-muted-foreground"
        }`}
      />
    )}
    <span>{label}</span>
  </div>
);

const FareRow = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>₹{value}</span>
  </div>
);
