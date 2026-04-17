import Navbar from "@/components/ui/navbar";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-24 flex-grow">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Legal Information</h1>
          
          <div className="bg-card border rounded-lg p-8 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-foreground">
              <div className="font-semibold text-muted-foreground">Business Name:</div>
              <div className="sm:col-span-2 font-medium">ABISHEK</div>
              
              <div className="font-semibold text-muted-foreground">Platform Name:</div>
              <div className="sm:col-span-2 font-medium">Xpool</div>
              
              <div className="font-semibold text-muted-foreground">Owner:</div>
              <div className="sm:col-span-2 font-medium">ABISHEK</div>
              
              <div className="font-semibold text-muted-foreground">Contact Email:</div>
              <div className="sm:col-span-2">
                <a href="mailto:abishektt001@gmail.com" className="text-primary hover:underline font-medium">
                  abishektt001@gmail.com
                </a>
              </div>
              
              <div className="font-semibold text-muted-foreground">Location:</div>
              <div className="sm:col-span-2 font-medium">India</div>
            </div>
            
            <div className="pt-6 mt-6 border-t text-muted-foreground font-medium">
              This platform is owned and operated by ABISHEK.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Legal;
