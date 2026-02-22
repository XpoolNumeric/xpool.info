import { useEffect, useState } from "react";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Construction,
  Smartphone,
  Clock,
  Bell,
  Rocket,
  Info,
  CheckCircle,
} from "lucide-react";

/* ---------------------------------- */
/* Page Component                     */
/* ---------------------------------- */

const Download = (): JSX.Element => {
  const [progress, setProgress] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Animate progress to 90%
  useEffect(() => {
    const timer = setTimeout(() => setProgress(90), 500);
    return () => clearTimeout(timer);
  }, []);

  /* ------------------------------ */
  /* Push Notification Handler     */
  /* ------------------------------ */
  const handleNotify = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support notifications.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setIsSubscribed(true);

      new Notification("Xpool App Update", {
        body: "You’ll be notified as soon as the app goes live.",
      });

      toast({
        title: "Notifications Enabled",
        description: "We’ll notify you once the app is launched.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Enable notifications to receive launch updates.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="max-w-2xl mx-auto px-6 text-center animate-fade-in">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10 text-primary shadow-sm">
              <Construction className="h-10 w-10" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-foreground mb-4">
            Xpool App is Under Construction
            <Info className="h-6 w-6 text-primary" />
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8">
            We’re almost ready to launch our fast and secure ride-sharing app
            for Android and iOS.
          </p>

          {/* Progress */}
          <div className="mb-10">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Development Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>

            <GradientProgressBar value={progress} />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <StatusCard
              icon={<Smartphone className="h-6 w-6" />}
              title="Mobile App"
              subtitle="Nearly Complete"
            />
            <StatusCard
              icon={<Clock className="h-6 w-6" />}
              title="Launch Stage"
              subtitle="Final QA Testing"
            />
            <StatusCard
              icon={<Bell className="h-6 w-6" />}
              title="Alerts"
              subtitle="Push Notifications"
            />
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="gap-2"
            onClick={handleNotify}
            disabled={isSubscribed}
          >
            {isSubscribed ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Notifications Enabled
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Notify Me When Live
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            You’ll be notified instantly at launch.
          </p>
        </div>
      </section>
    </>
  );
};

export default Download;

/* ---------------------------------- */
/* Gradient Progress Bar              */
/* ---------------------------------- */

interface ProgressBarProps {
  value: number;
}

const GradientProgressBar = ({
  value,
}: ProgressBarProps): JSX.Element => {
  return (
    <div className="w-full h-3 rounded-full bg-border overflow-hidden">
      <div
        className="h-full transition-all duration-1000 ease-out"
        style={{
          width: `${value}%`,
          background:
            "linear-gradient(90deg, #ef4444, #f97316, #facc15)", // 🔥 red → orange → yellow
        }}
      />
    </div>
  );
};

/* ---------------------------------- */
/* Status Card                        */
/* ---------------------------------- */

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const StatusCard = ({
  icon,
  title,
  subtitle,
}: StatusCardProps): JSX.Element => {
  return (
    <div className="border border-border rounded-xl p-4 bg-background/70 backdrop-blur transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex justify-center text-primary mb-2">
        {icon}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
};
