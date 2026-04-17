import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define pages where we WANT the back button (Ride Flow)
  const showOnPaths = [
    "/available-rides",
    "/ride-summary",
    "/ride-confirmed"
  ];

  // Only show if the current path is in our inclusion list
  if (!showOnPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, x: -20, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.8 }}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 1)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-[60] w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 flex items-center justify-center text-gray-800 transition-all duration-300 group"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 mr-0.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-amber-400/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
      </motion.button>
    </AnimatePresence>
  );
};

export default BackButton;
