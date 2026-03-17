import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Chatbot from "@/components/ui/chatbot";

// Pages
import Index from "./pages/Index";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Download from "./pages/Download"; // ✅ ADD THIS
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Ride flow
import VehicleTypeSelection from "./pages/VehicleTypeSelection";
import SearchingVehicle from "./pages/SearchingVehicle";
import RideConfirmed from "./pages/RideConfirmed";
import RideSummary from "./pages/RideSummary";

const queryClient = new QueryClient();

const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          {/* Marketing */}
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/download" element={<Download />} /> {/* ✅ NEW */}
          <Route path="/profile" element={<Profile />} />

          {/* Ride flow */}
          <Route path="/vehicles" element={<VehicleTypeSelection />} />
          <Route path="/searching" element={<SearchingVehicle />} />
          <Route path="/ride-confirmed" element={<RideConfirmed />} />
          <Route path="/ride-summary" element={<RideSummary />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <div
          className="fixed top-4 right-4 z-[9999]"
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          <Chatbot />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
