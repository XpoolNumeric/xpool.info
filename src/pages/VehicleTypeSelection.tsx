import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bike,
  Car,
  CarTaxiFront,
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
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

const VehicleTypeSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<VehicleId | null>(null);

  /* ---------------- LOAD PREVIOUS ---------------- */

  useEffect(() => {
    const saved = localStorage.getItem("vehicleType");
    if (saved) setSelected(saved as VehicleId);
  }, []);

  /* ---------------- CONTINUE ---------------- */

  const handleContinue = () => {
    if (!selected) return;

    localStorage.setItem("vehicleType", selected);

    // 🚗 Go to searching screen
    navigate("/searching");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 flex justify-center">
      <div className="w-full max-w-md space-y-6">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Choose your ride</h1>
          <p className="text-sm text-muted-foreground">
            Select the vehicle that suits you best
          </p>

          <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            Step 3 of 3
          </span>
        </div>

        {/* VEHICLE LIST */}
        <div className="space-y-4">
          {vehicles.map((v) => {
            const Icon = v.icon;
            const active = selected === v.id;

            return (
              <Card
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border
                ${active
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "hover:border-primary/40"
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* ICON */}
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center
                    transition
                    ${active ? "bg-primary text-white" : "bg-muted"}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{v.name}</h3>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {v.desc}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {v.eta} away
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="text-sm font-medium whitespace-nowrap">
                    {v.price}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CONTINUE */}
        <div className="pt-2">
          <Button
            disabled={!selected}
            onClick={handleContinue}
            className="w-full h-14 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="mt-2 text-[11px] text-center text-muted-foreground">
            Fare may vary based on distance & demand
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleTypeSelection;
