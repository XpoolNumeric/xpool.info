import { FC, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
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
  Download,
  ArrowRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  image: string;
}

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const steps: Step[] = [
  {
    number: "1",
    title: "Book Your Ride",
    description:
      "Open the Xpool application. Enter your pickup and drop-off locations to instantly receive a precise fare estimate and available vehicle options.",
    icon: MapPin,
    image: "/steps/step1.png",
  },
  {
    number: "2",
    title: "Captain Allocation",
    description:
      "Our intelligent dispatch system pairs you with the nearest experienced Captain. Review their credentials, ratings, and track their arrival in real-time.",
    icon: Users,
    image: "/steps/step2.png",
  },
  {
    number: "3",
    title: "Secure Transit",
    description:
      "Every captain undergoes rigorous KYC verification. Helmets are strictly provided to ensure your safety throughout the efficient urban commute.",
    icon: Shield,
    image: "/steps/step3.png",
  },
  {
    number: "4",
    title: "Seamless Transactions",
    description:
      "Experience frictionless payments via UPI, credit/debit cards, or corporate wallets. Digital invoices are automatically generated post-ride.",
    icon: CreditCard,
    image: "/steps/step4.png",
  },
  {
    number: "5",
    title: "Quality Assurance",
    description:
      "Your feedback drives our service excellence. Rate your experience to maintain our industry-leading standards of safety and professionalism.",
    icon: Star,
    image: "/steps/step5.png",
  },
];

const benefits: Benefit[] = [
  {
    icon: Clock,
    title: "Optimized Wait Times",
    description: "Algorithmic dispatching ensures pickups typically occur within 5 minutes.",
  },
  {
    icon: DollarSign,
    title: "Competitive Pricing",
    description: "Transparent, upfront fare models yielding significant savings over traditional cabs.",
  },
  {
    icon: Shield,
    title: "Vetted Professionals",
    description: "Comprehensive background checks and strict onboarding standards for all Captains.",
  },
  {
    icon: Phone,
    title: "Dedicated Support",
    description: "24/7 responsive customer service accessible directly through the corporate platform.",
  },
];

const stats = [
  { value: "50K+", label: "Verified Users" },
  { value: "5 min", label: "Avg. Wait Time" },
  { value: "30+", label: "Operating Zones" },
  { value: "4.8★", label: "Service Rating" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  },
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeRightVariant = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeLeftVariant = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components
// ─────────────────────────────────────────────────────────────────────────────

/** Professional Statistics Badge */
const StatsBadgeCard: FC<{ value: string; label: string; index: number }> = ({ value, label, index }) => {
  return (
    <motion.div
      custom={index}
      variants={fadeUpVariant}
      className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      style={{ minWidth: 180 }}
    >
      <span className="text-4xl font-bold tracking-tight text-gray-900 font-syne mb-2">{value}</span>
      <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase font-dmsans">
        {label}
      </span>
    </motion.div>
  );
};

/** Formal Step Card */
const StepCard: FC<{ step: Step; index: number; total: number }> = ({ step, index, total }) => {
  const isEven = index % 2 === 0;

  return (
    <div className="relative w-full max-w-6xl mx-auto py-16 md:py-24">
      {/* Connector Line for Desktop */}
      {index < total - 1 && (
        <div className="absolute left-12 md:left-1/2 top-[12rem] md:top-full w-px h-full bg-gray-200 -translate-x-1/2 z-0 hidden md:block" />
      )}

      <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12 lg:gap-24 relative z-10`}>
        {/* Content Side */}
        <motion.div
          variants={isEven ? fadeRightVariant : fadeLeftVariant}
          className="flex-1 w-full"
        >
          <div className="max-w-lg mx-auto md:mx-0">
            <div className="flex items-center gap-4 mb-8">
              <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-900 text-white font-bold text-lg font-syne">
                {step.number.padStart(2, "0")}
              </span>
              <div className="h-px w-12 bg-gray-300 hidden sm:block" />
              <div className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border border-gray-200">
                Phase {step.number}
              </div>
            </div>

            <h3 className="text-3xl font-bold text-gray-900 mb-5 font-syne tracking-tight leading-tight">{step.title}</h3>
            <p className="text-gray-600 text-lg leading-relaxed font-dmsans">{step.description}</p>

            <div className="mt-8 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 shadow-sm">
                <step.icon size={20} strokeWidth={2} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Image Side */}
        <motion.div
          variants={isEven ? fadeLeftVariant : fadeRightVariant}
          className="flex-1 w-full flex justify-center"
        >
          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200/60 transition-transform duration-700 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gray-100/50" />
            <img
              src={step.image}
              alt={step.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/** Minimalist Benefit Card */
const BenefitCard: FC<{ benefit: Benefit; index: number }> = ({ benefit, index }) => {
  const Icon = benefit.icon;
  return (
    <motion.div
      variants={fadeUpVariant}
      className="p-8 bg-white border border-gray-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-6 shadow-md">
        <Icon size={24} className="text-white" strokeWidth={1.8} />
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-3 font-syne">{benefit.title}</h4>
      <p className="text-base text-gray-500 font-dmsans leading-relaxed">{benefit.description}</p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorks: FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:font-semibold focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-[#FAFAFA] relative isolate selection:bg-gray-200 selection:text-gray-900">
        <Navbar />

        {/* Professional subtle background structure */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,#FAFAFA_100%)] pointer-events-none -z-10" />

        <motion.main
          id="main-content"
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32"
          variants={!prefersReducedMotion ? containerVariants : {}}
          initial="hidden"
          animate="visible"
        >
          {/* ── Hero section ── */}
          <motion.div variants={!prefersReducedMotion ? fadeUpVariant : {}} className="text-center max-w-4xl mx-auto mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm mb-8">
              <span className="text-xs font-bold tracking-widest uppercase font-dmsans">
                The Standard in Urban Mobility
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-8 font-syne">
              How{" "}
              <span className="text-gray-500">
                Xpool
              </span>{" "}
              Works
            </h1>

            <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-dmsans">
              Experience a streamlined, secure, and professional ride-hailing process. Engineered for modern commuters who value reliability and safety.
            </p>
          </motion.div>

          {/* Stats section */}
          <motion.div
            variants={!prefersReducedMotion ? containerVariants : {}}
            className="flex flex-wrap justify-center gap-6 mb-32"
          >
            {stats.map((stat, idx) => (
              <StatsBadgeCard key={stat.label} value={stat.value} label={stat.label} index={idx} />
            ))}
          </motion.div>

          {/* Divider */}
          <div className="w-full max-w-4xl mx-auto h-px bg-gray-200 mb-24" />

          {/* Steps section */}
          <motion.div variants={!prefersReducedMotion ? containerVariants : {}} className="mb-32">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-5 font-syne">
                The Operational Process
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto font-dmsans">
                A meticulously designed procedure ensuring efficiency, accountability, and unparalleled service execution.
              </p>
            </div>

            <div className="space-y-0 md:space-y-0 relative">
              {steps.map((step, idx) => (
                <StepCard key={step.number} step={step} index={idx} total={steps.length} />
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="w-full max-w-4xl mx-auto h-px bg-gray-200 mb-24" />

          {/* Why Xpool section */}
          <motion.div variants={!prefersReducedMotion ? containerVariants : {}} className="mb-32">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-5 font-syne">
                  Enterprise-Grade Standards
                </h2>
                <p className="text-gray-500 text-lg font-dmsans">
                  Built to the highest benchmarks of operational excellence and passenger security.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => (
                <BenefitCard key={idx} benefit={benefit} index={idx} />
              ))}
            </div>
          </motion.div>

          {/* Elegant CTA section */}
          <motion.div variants={!prefersReducedMotion ? fadeUpVariant : {}}>
            <div className="relative bg-black rounded-[2rem] p-12 md:p-24 overflow-hidden shadow-2xl">
              {/* Subtle background element */}
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(50,50,50,1)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-syne tracking-tight max-w-2xl">
                  Ready to optimize your commute?
                </h2>
                <p className="text-gray-400 text-lg sm:text-xl mb-12 font-dmsans max-w-2xl">
                  Join professionals who depend on Xpool for their transportation infrastructure. Access the platform today.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 w-full sm:w-auto px-10 py-7 rounded-xl font-bold transition-colors text-base"
                  >
                    <a href="#">
                      <Download size={20} className="mr-3" />
                      Download for Android
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-gray-700 text-white hover:bg-white hover:text-black w-full sm:w-auto px-10 py-7 rounded-xl font-semibold transition-colors text-base"
                  >
                    <a href="#">
                      <Download size={20} className="mr-3" />
                      Download for iOS
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </>
  );
};

export default HowItWorks;