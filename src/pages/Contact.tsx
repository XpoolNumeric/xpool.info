import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Users,
  CheckCircle,
  Headphones,
  HelpCircle,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

const Contact = () => {
  const contactMethods = [
    {
      title: "Customer Support",
      description:
        "Need help with a ride, payment, or app issue? Our support team is available 24/7 to assist you.",
      icon: Phone,
      value: "+91 7904790007",
      color: "bg-primary",
    },
    {
      title: "Email Us",
      description:
        "For partnerships, business inquiries, or detailed support requests, drop us an email.",
      icon: Mail,
      value: "support@xpool.app",
      color: "bg-xpool-yellow",
    },
    {
      title: "Our Location",
      description:
        "We currently operate across major cities in India, providing fast and affordable bike taxi services.",
      icon: MapPin,
      value: "Chennai,India",
      color: "bg-primary",
    },
  ];

  const reasons = [
    {
      icon: Clock,
      text: "24/7 customer support",
    },
    {
      icon: Shield,
      text: "Verified captains & secure rides",
    },
    {
      icon: Users,
      text: "Trusted by thousands of riders",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <Headphones className="w-14 h-14 text-white" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Contact Xpool
            </h1>

            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              We’re always here to help. Reach out to Xpool for support, feedback,
              partnerships, or general queries.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-10">
              {contactMethods.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="bg-card p-8 rounded-xl border shadow-sm hover:shadow-lg transition-all animate-fade-in text-center"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`w-20 h-20 mx-auto rounded-full ${item.color} flex items-center justify-center text-white mb-6 shadow-glow`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>

                    <p className="font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Reach Us */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-4">
                <HelpCircle className="w-12 h-12 text-primary" />
              </div>

              <h2 className="text-4xl font-bold text-foreground">
                Why Reach Out to Xpool?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;

                return (
                  <div
                    key={index}
                    className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-xpool-yellow rounded-full flex items-center justify-center text-white">
                        <Icon className="w-6 h-6" />
                      </div>

                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>

                    <p className="text-card-foreground font-medium mt-4">
                      {reason.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Need Immediate Help?
            </h2>

            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Call or email us anytime. Our support team is always ready to help
              you ride smoothly with Xpool.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                <Phone className="w-5 h-5" />
                Call Support
              </button>

              <button className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                <Mail className="w-5 h-5" />
                Email Us
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
