import {
  MapPin,
  Users,
  Shield,
  CreditCard,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Phone,
  Bike,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Book Your Ride",
      description:
        "Open the Xpool app or website. Enter your pickup and drop location. Instantly view fare estimate and available vehicle options.",
      icon: MapPin,
      color: "bg-xpool-yellow",
    },
    {
      number: "2",
      title: "Get Matched with a Captain",
      description:
        "Our system finds the nearest available driver. View their name, photo, bike number, and rating. Track their real-time location until pickup.",
      icon: Users,
      color: "bg-primary",
    },
    {
      number: "3",
      title: "Enjoy a Safe & Affordable Ride",
      description:
        "All Captains are KYC-verified with background checks. Helmets provided. Enjoy fast and affordable rides through city traffic.",
      icon: Shield,
      color: "bg-xpool-yellow",
    },
    {
      number: "4",
      title: "Seamless Payments",
      description:
        "Pay via UPI, card, wallet, or cash. Receive instant invoices and earn cashback through Xpool offers.",
      icon: CreditCard,
      color: "bg-primary",
    },
    {
      number: "5",
      title: "Rate & Review",
      description:
        "Rate your Captain after every ride. Your feedback helps us improve safety and service quality.",
      icon: Star,
      color: "bg-xpool-yellow",
    },
  ];

  const benefits = [
    { icon: Clock, text: "Fast pickups in under 5 minutes" },
    { icon: DollarSign, text: "Affordable fares – cheaper than cabs & autos" },
    { icon: Shield, text: "Safe rides with verified Captains" },
    { icon: Phone, text: "24/7 support whenever you need help" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Bike className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              How Xpool Works
            </h1>

            <p className="text-xl text-white/90 leading-relaxed">
              Booking a ride with Xpool is quick, simple, and reliable —
              perfect for daily commutes, college, and city travel.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-24">
          <div className="container mx-auto px-4 space-y-20">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`flex flex-col ${
                    index % 2 === 0
                      ? "lg:flex-row"
                      : "lg:flex-row-reverse"
                  } items-center gap-14`}
                >
                  {/* Text */}
                  <div className="flex-1 text-center lg:text-left">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color} text-white text-xl font-bold mb-6`}
                    >
                      {step.number}
                    </div>

                    <h3 className="text-3xl font-bold mb-4">
                      {step.title}
                    </h3>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="flex-1 flex justify-center">
                    <div
                      className={`w-32 h-32 rounded-full ${step.color} flex items-center justify-center text-white shadow-glow`}
                    >
                      <Icon className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Choose */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold">
                Why Choose Xpool?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-xpool-yellow rounded-full flex items-center justify-center text-white">
                        <Icon className="w-6 h-6" />
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>

                    <p className="mt-4 font-medium">
                      {benefit.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Experience Xpool?
            </h2>

            <p className="text-xl text-white/90 mb-10">
              Download the app today and enjoy fast, affordable, and safe rides across the city.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition">
                Download for Android
              </button>
              <button className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition">
                Download for iOS
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
