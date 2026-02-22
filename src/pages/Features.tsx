import Navbar from "@/components/ui/navbar";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Smartphone,
  MapPin,
  MessageCircle,
  KeyRound,
  DollarSign,
  CreditCard,
  Shield,
  Clock,
  Star,
  Gift,
  Settings,
  ArrowRight,
} from "lucide-react";

/* ---------------------------------- */
/* Types                              */
/* ---------------------------------- */

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

/* ---------------------------------- */
/* Feature Data                       */
/* ---------------------------------- */

const features: Feature[] = [
  {
    id: 1,
    title: "Quick Ride Booking",
    description:
      "Book your ride in seconds. Enter pickup and drop locations and get instantly matched with nearby drivers.",
    icon: Smartphone,
  },
  {
    id: 2,
    title: "Real-Time Location Tracking",
    description:
      "Track your driver’s live location from acceptance to destination with precise GPS updates.",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Seamless Communication",
    description:
      "Chat or call drivers securely within the app—no need to share personal phone numbers.",
    icon: MessageCircle,
  },
  {
    id: 4,
    title: "OTP Ride Verification",
    description:
      "Every ride starts with OTP verification to ensure rider safety and prevent misuse.",
    icon: KeyRound,
  },
  {
    id: 5,
    title: "Transparent & Affordable Fares",
    description:
      "Real-time fare calculation with zero hidden charges. What you see is what you pay.",
    icon: DollarSign,
  },
  {
    id: 6,
    title: "Multiple Payment Options",
    description:
      "Pay via UPI, Wallet, Debit/Credit Card, or Cash—whatever suits you best.",
    icon: CreditCard,
  },
  {
    id: 7,
    title: "Driver & Customer Safety",
    description:
      "Verified drivers, SOS support, and strict safety protocols for peace of mind.",
    icon: Shield,
  },
  {
    id: 8,
    title: "Ride History & Invoices",
    description:
      "Access trip history, download invoices, and manage ride expenses easily.",
    icon: Clock,
  },
  {
    id: 9,
    title: "Ratings & Reviews",
    description:
      "Rate drivers and provide feedback to improve service quality across the platform.",
    icon: Star,
  },
  {
    id: 10,
    title: "Promotions & Offers",
    description:
      "Get exclusive discounts, referral rewards, and seasonal offers directly in-app.",
    icon: Gift,
  },
  {
    id: 11,
    title: "Admin Dashboard",
    description:
      "Advanced admin tools for monitoring rides, managing drivers, and maintaining quality.",
    icon: Settings,
  },
];

/* ---------------------------------- */
/* Page Component                     */
/* ---------------------------------- */

const Features = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Powerful{" "}
              <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                Features
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Everything you need for a safe, affordable, and seamless ride-sharing experience—built for both riders and drivers.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to experience smarter ride-sharing?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands who rely on Xpool for safe, reliable, and affordable rides.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/download"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Download App
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-border rounded-lg font-semibold hover:bg-accent transition"
              >
                Become a Driver
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;

/* ---------------------------------- */
/* Feature Card Component             */
/* ---------------------------------- */

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps): JSX.Element => {
  const Icon = feature.icon;

  return (
    <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          <div>
            <span className="text-sm font-medium text-primary">
              {String(feature.id).padStart(2, "0")}
            </span>
            <h3 className="text-xl font-semibold text-card-foreground mt-1">
              {feature.title}
            </h3>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>
    </Card>
  );
};
