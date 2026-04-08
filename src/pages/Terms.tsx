import Navbar from "@/components/ui/navbar";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-24 flex-grow">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Terms of Service</h1>
          
          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <p className="font-medium text-foreground">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            
            <p className="font-semibold text-primary">This website is owned and operated by ABISHEK.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">1. Agreement to Terms</h2>
            <p>By accessing or using Xpool, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">2. User Accounts</h2>
            <p>When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the terms.</p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">3. Using the Platform</h2>
            <p>You agree to use Xpool only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the platform.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">4. Payments</h2>
            <p>All payments made through the platform are processed securely. Ride costs and fees are subject to our pricing policies which are displayed before booking.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">5. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:abishektt001@gmail.com" className="text-primary hover:underline">abishektt001@gmail.com</a>.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
