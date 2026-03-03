import { FC, useCallback, useRef, useState, useEffect } from "react";
import { MapPin, Clock, Shield, Star, ArrowRight, Zap } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────
interface Feature {
  icon: typeof MapPin;
  tag: string;
  number: string;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  img: string;
  fallbackGradient: string;
}

const features: Feature[] = [
  {
    icon: MapPin,
    tag: "Navigation",
    number: "01",
    title: "Real-time Tracking",
    description:
      "Live GPS updates every second. Watch your driver move on the map and know exactly when they'll arrive — no guessing.",
    stat: "< 1s",
    statLabel: "Update Interval",
    img: "/hero1.png",
    fallbackGradient: "from-amber-950 to-amber-900",
  },
  {
    icon: Clock,
    tag: "Speed",
    number: "02",
    title: "Quick Booking",
    description:
      "From open app to confirmed ride in under 3 taps. Our streamlined flow removes every unnecessary step.",
    stat: "3 taps",
    statLabel: "To Book a Ride",
    img: "/hero2.png",
    fallbackGradient: "from-blue-950 to-blue-900",
  },
  {
    icon: Shield,
    tag: "Safety",
    number: "03",
    title: "Secure & Safe",
    description:
      "100% verified drivers, encrypted payments, and a live safety team watching around the clock.",
    stat: "100%",
    statLabel: "Verified Drivers",
    img: "/hero3.png",
    fallbackGradient: "from-emerald-950 to-emerald-900",
  },
  {
    icon: Star,
    tag: "Quality",
    number: "04",
    title: "Top Rated",
    description:
      "4.8★ average across 2 million+ rides. Our riders don't settle — and neither do we.",
    stat: "4.8★",
    statLabel: "Avg. Rating",
    img: "/hero4.png",
    fallbackGradient: "from-yellow-950 to-yellow-900",
  },
];

const cities = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
  "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kochi", "Chandigarh", "Indore", "Nagpur",
];
const cityListDoubled = [...cities, ...cities];

const miniStats = [
  { value: "2M+", label: "Happy Riders" },
  { value: "30+", label: "Cities" },
  { value: "99.7%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Global Styles
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');

    :root {
      --color-amber-50: #fffbeb;
      --color-amber-100: #fef3c7;
      --color-amber-200: #fde68a;
      --color-amber-300: #fcd34d;
      --color-amber-400: #fbbf24;
      --color-amber-500: #f59e0b;
      --color-amber-600: #d97706;
      --color-amber-700: #b45309;
      --color-amber-800: #92400e;
      --color-amber-900: #78350f;
      --color-gray-50: #f9fafb;
      --color-gray-100: #f3f4f6;
      --color-gray-200: #e5e7eb;
      --color-gray-300: #d1d5db;
      --color-gray-400: #9ca3af;
      --color-gray-500: #6b7280;
      --color-gray-600: #4b5563;
      --color-gray-700: #374151;
      --color-gray-800: #1f2937;
      --color-gray-900: #111827;
    }

    @keyframes pulse-fade {
      0%, 100% { opacity: 0; }
      50%      { opacity: 1; }
    }
    @keyframes ring-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
      50%      { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
    }
    @keyframes border-breathe {
      0%, 100% { border-color: rgba(245, 158, 11, 0.18); }
      50%      { border-color: rgba(245, 158, 11, 0.5); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    @keyframes tickerScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite linear;
    }

    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components
// ─────────────────────────────────────────────────────────────────────────────

const AmbientBlobs = () => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute left-[10%] top-[30%] w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "pulse-fade 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[5%] bottom-[20%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
          filter: "blur(70px)",
          animation: "pulse-fade 10s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
};

const DotGrid = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: "radial-gradient(rgba(245,158,11,0.06) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    }}
  />
);

const CardImage: FC<{ src: string; alt: string; fallbackGradient: string }> = ({
  src,
  alt,
  fallbackGradient,
}) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-amber-300/20 to-amber-100/20 animate-shimmer bg-[length:200%_100%]" />
      )}
      {status === "error" && (
        <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
};

const FeatureCard: FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchActive, setTouchActive] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 180, damping: 22 });
  const rotateX = useTransform(springY, [-30, 30], [5, -5]);
  const rotateY = useTransform(springX, [-30, 30], [-5, 5]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      rawX.set(e.clientX - rect.left - rect.width / 2);
      rawY.set(e.clientY - rect.top - rect.height / 2);
    },
    [rawX, rawY, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    setTouchActive(false);
  }, [rawX, rawY]);

  const handleTouchStart = useCallback(() => setTouchActive(true), []);
  const handleTouchEnd = useCallback(() => {
    setTimeout(() => setTouchActive(false), 400);
  }, []);

  const Icon = feature.icon;

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="w-full aspect-[4/3] flex-shrink-0 snap-start"
    >
      <div
        ref={cardRef}
        className={`relative w-full h-full rounded-2xl overflow-hidden cursor-pointer isolate group ${touchActive ? "touch-active" : ""
          }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={
          !prefersReducedMotion
            ? { perspective: "1000px", transformStyle: "preserve-3d" }
            : {}
        }
      >
        <motion.div
          className="absolute inset-0"
          style={
            !prefersReducedMotion
              ? { rotateX, rotateY, transformStyle: "preserve-3d" }
              : {}
          }
        >
          <CardImage
            src={feature.img}
            alt={feature.title}
            fallbackGradient={feature.fallbackGradient}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-all group-hover:from-black/95 group-hover:via-amber-900/30 group-hover:to-transparent" />

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="absolute inset-0 rounded-2xl border border-amber-200/20 group-hover:border-amber-400/60 group-hover:shadow-[0_0_0_3px_rgba(245,158,11,0.1)] transition-all" />

          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 w-0 group-hover:w-full transition-all duration-700 ease-out" />

          <span className="absolute bottom-0 right-2 text-8xl font-black text-white/5 select-none group-hover:text-amber-500/10 transition-colors">
            {feature.number}
          </span>

          <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-amber-600 group-hover:border-transparent transition-all">
                <Icon size={18} className="text-amber-300 group-hover:text-white transition-colors" />
              </div>
              <span className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-black/20 backdrop-blur-sm border border-white/10 rounded-full text-amber-300/80 group-hover:bg-amber-500/20 group-hover:text-amber-200 transition-colors">
                {feature.tag}
              </span>
            </div>

            <div>
              <div className="overflow-hidden">
                <p className="text-xs text-white/70 line-clamp-2 group-hover:line-clamp-3 transition-all duration-300">
                  {feature.description}
                </p>
              </div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-amber-200 transition-colors font-syne">
                {feature.title}
              </h3>
              <div className="h-px bg-white/10 my-2 group-hover:bg-amber-500/30 transition-colors" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-amber-300 group-hover:text-amber-200 transition-colors font-syne">
                    {feature.stat}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-white/40 group-hover:text-amber-300/60 transition-colors">
                    {feature.statLabel}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-amber-600 group-hover:border-transparent group-hover:scale-110 transition-all">
                  <ArrowRight size={12} className="text-white/70 group-hover:text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const FeaturesSection: FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const autoScrollIntervalRef = useRef<NodeJS.Timeout>();
  const isProgrammaticScrollRef = useRef(false);

  const handleBookClick = useCallback(() => {
    document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Long press detection (3 seconds)
  const handleTouchStart = useCallback(() => {
    if (!isMobile) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setAutoScrollActive(true);
    }, 3000);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, [isMobile]);

  const handleTouchMove = useCallback(() => {
    if (!isMobile) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, [isMobile]);

  // Update current index based on scroll position
  const updateCurrentIndexFromScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const positions = cards.map(card => {
      const cardRect = card.getBoundingClientRect();
      return cardRect.left - containerRect.left + container.scrollLeft;
    });

    const scrollLeft = container.scrollLeft;
    let closest = 0;
    let minDiff = Math.abs(positions[0] - scrollLeft);
    for (let i = 1; i < positions.length; i++) {
      const diff = Math.abs(positions[i] - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    setCurrentCardIndex(closest);
  }, []);

  // Stop auto‑scroll on user interaction (ignore programmatic scrolls)
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      updateCurrentIndexFromScroll();
      return;
    }
    setAutoScrollActive(false);
    updateCurrentIndexFromScroll();
  }, [updateCurrentIndexFromScroll]);

  const handleClick = useCallback(() => {
    setAutoScrollActive(false);
  }, []);

  // Auto‑scroll logic
  useEffect(() => {
    if (!isMobile || !autoScrollActive || !carouselRef.current) return;

    const container = carouselRef.current;
    const cards = Array.from(container.children) as HTMLElement[];

    const getCardPositions = () => {
      const containerRect = container.getBoundingClientRect();
      return cards.map(card => {
        const cardRect = card.getBoundingClientRect();
        return cardRect.left - containerRect.left + container.scrollLeft;
      });
    };

    let currentIndex = 0; // local for interval closure

    const scrollToIndex = (index: number) => {
      const positions = getCardPositions();
      if (positions.length === 0) return;
      const targetIndex = ((index % positions.length) + positions.length) % positions.length;
      const targetScroll = positions[targetIndex];
      isProgrammaticScrollRef.current = true;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setCurrentCardIndex(targetIndex); // update indicator immediately
      currentIndex = targetIndex;
    };

    // Start from current visible index
    const updateCurrentIndex = () => {
      const positions = getCardPositions();
      if (positions.length === 0) return;
      const scrollLeft = container.scrollLeft;
      let closest = 0;
      let minDiff = Math.abs(positions[0] - scrollLeft);
      for (let i = 1; i < positions.length; i++) {
        const diff = Math.abs(positions[i] - scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      }
      currentIndex = closest;
    };
    updateCurrentIndex();

    autoScrollIntervalRef.current = setInterval(() => {
      scrollToIndex(currentIndex + 1);
    }, 3000);

    return () => {
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
    };
  }, [isMobile, autoScrollActive]);

  return (
    <>
      <GlobalStyles />
      <section
        className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-amber-50 to-white"
        aria-label="Platform Features"
      >
        <AmbientBlobs />
        <DotGrid />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            ref={headerRef}
            variants={!prefersReducedMotion ? { ...fadeUp, hidden: { opacity: 0, y: 28 } } : {}}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm text-amber-700 shadow-sm mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest uppercase font-dmsans">
                Everything You Need
              </span>
            </motion.div>

            <motion.h2
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 font-syne"
            >
              Ride Smarter.{" "}
              <span className="relative inline-block text-amber-500">
                Every Time.
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full origin-left"
                />
              </span>
            </motion.h2>

            <motion.p
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mt-4 font-dmsans"
            >
              Four pillars that make Xpool the most trusted ride-sharing platform in 30+ cities.
            </motion.p>

            {/* City ticker */}
            <motion.div
              variants={!prefersReducedMotion ? fadeUp : {}}
              className="flex items-center justify-center gap-3 mt-8"
            >
              <Zap size={14} className="text-amber-400" />
              <div className="overflow-hidden max-w-[300px] sm:max-w-md">
                <div
                  className="flex gap-2 whitespace-nowrap"
                  style={{ animation: "tickerScroll 22s linear infinite" }}
                >
                  {cityListDoubled.map((city, i) => (
                    <span
                      key={`${city}-${i}`}
                      className="px-3 py-1 text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-100/50 text-amber-700 rounded-full border border-amber-200/50"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
              <Zap size={14} className="text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Cards grid / carousel */}
          {isMobile ? (
            <>
              <div
                ref={carouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onScroll={handleScroll}
                onClick={handleClick}
              >
                {features.map((feature, i) => (
                  <FeatureCard key={feature.number} feature={feature} index={i} />
                ))}
              </div>
              {/* Scroll indicator dots (mobile only) */}
              <div className="flex justify-center gap-2 mt-4">
                {features.map((_, i) => (
                  <button
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentCardIndex
                        ? "w-6 bg-amber-500"
                        : "bg-gray-300 hover:bg-amber-300"
                      }`}
                    onClick={() => {
                      if (carouselRef.current) {
                        const container = carouselRef.current;
                        const cards = Array.from(container.children) as HTMLElement[];
                        if (cards.length === 0) return;
                        const containerRect = container.getBoundingClientRect();
                        const targetScroll = cards[i].getBoundingClientRect().left - containerRect.left + container.scrollLeft;
                        isProgrammaticScrollRef.current = true;
                        container.scrollTo({ left: targetScroll, behavior: "smooth" });
                        setCurrentCardIndex(i);
                      }
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            // Desktop: grid layout
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, i) => (
                <FeatureCard key={feature.number} feature={feature} index={i} />
              ))}
            </div>
          )}

          {/* Mini stats row */}
          <motion.div
            ref={statsRef}
            variants={!prefersReducedMotion ? fadeUp : {}}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-amber-200/30 shadow-sm"
          >
            {miniStats.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-gray-900 font-syne">{stat.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA strip */}
          <motion.div
            variants={!prefersReducedMotion ? fadeUp : {}}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative mt-16 p-6 md:p-8 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-lg overflow-hidden"
          >
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-300/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-syne">
                  Ready for your first ride?
                </h3>
                <p className="text-sm text-gray-600 mt-1 font-dmsans">
                  Join 2 million+ happy riders across 30+ cities.
                </p>
              </div>
              <button
                onClick={handleBookClick}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Book Your Ride
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;