import Navbar from "@/components/ui/navbar";
import Hero from "@/components/sections/Hero";
import BookingSection from "@/components/sections/BookingSection";
import FeaturesSection from "@/components/sections/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <BookingSection />
      <FeaturesSection />
    </div>
  );
};

export default Index;
