import Navbar from "@/components/ui/navbar";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-24 flex-grow">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          
          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <p className="font-medium text-foreground">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            
            <p className="font-semibold text-primary">This website is owned and operated by ABISHEK.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you create an account, update your profile, or use our services. This may include your name, email address, phone number, and location data.</p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you regarding your rides.</p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">3. Information Sharing</h2>
            <p>We share your basic profile information (like name and photo) with other users (drivers or passengers) only when necessary to facilitate a ride booking.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">4. Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:abishektt001@gmail.com" className="text-primary hover:underline">abishektt001@gmail.com</a>.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
