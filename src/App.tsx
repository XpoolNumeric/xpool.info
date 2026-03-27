import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Chatbot from "@/components/ui/chatbot";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalProfileChecker from "@/components/sections/GlobalProfileChecker";

// Pages
import Index from "./pages/Index";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Download from "./pages/Download";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import DocumentVerification from "./pages/DocumentVerification";

import AvailableRides from "./pages/AvailableRides";
import WaitApproval from "./pages/WaitApproval";
import RideConfirmed from "./pages/RideConfirmed";
import RideSummary from "./pages/RideSummary";
import BackButton from "@/components/ui/BackButton";

const queryClient = new QueryClient();

const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          
          <GlobalProfileChecker />

          <BackButton />

          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/download" element={<Download />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify" element={<DocumentVerification />} />

            {/* Ride flow — BlaBlaCar style */}
            <Route path="/available-rides" element={<AvailableRides />} />
            <Route path="/wait-approval" element={<WaitApproval />} />
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
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
