import { useEffect, useState } from "react";
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
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type VehicleKey = "bike" | "auto" | "car" | "xl";

interface RideSummary {
  pickup: string;
  drop: string;
}

/* ---------------- VEHICLE ICONS ---------------- */

const vehicleIcons: Record<VehicleKey, React.ElementType> = {
  bike: Bike,
  auto: Car,
  car: Car,
  xl: Car,
};

/* ---------------- COMPONENT ---------------- */

const RideConfirmed = () => {
  const [vehicleType, setVehicleType] =
    useState<VehicleKey>("car");

  const [ride, setRide] =
    useState<RideSummary | null>(null);

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
    } catch {
      // silent fallback
    }
  }, []);

  const VehicleIcon = vehicleIcons[vehicleType];

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

        {/* VEHICLE CARD */}
        <Card className="p-4 rounded-2xl space-y-3">
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
              <h4 className="font-semibold">
                Ramesh Kumar
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                4.8 • 1,200 rides
              </div>
            </div>

            <Phone className="h-5 w-5 text-primary cursor-pointer" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Driver arriving at pickup point
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
