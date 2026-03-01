import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Mail, Frown, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Subtle parallax effect on the 404 number
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Design tokens matching the navbar
  const orange = "#FF9500";
  const orangeDeep = "#E07800";
  const gold = "#FFBA00";
  const navy = "#0A0F1C";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${orange}20, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${gold}20, transparent 70%)` }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl text-center">
        {/* Animated 404 */}
        <div
          className="relative mb-6 select-none"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <h1 className="text-[12rem] font-black leading-none tracking-tighter md:text-[16rem]">
            <span
              className="bg-gradient-to-r from-[#FF9500] via-[#FFBA00] to-[#FFD060] bg-clip-text text-transparent"
              style={{ textShadow: `0 10px 30px ${orange}30` }}
            >
              4
            </span>
            <span
              className="bg-gradient-to-r from-[#FFBA00] to-[#FF9500] bg-clip-text text-transparent"
              style={{ textShadow: `0 10px 30px ${orange}30` }}
            >
              0
            </span>
            <span
              className="bg-gradient-to-r from-[#FFD060] via-[#FFBA00] to-[#FF9500] bg-clip-text text-transparent"
              style={{ textShadow: `0 10px 30px ${orange}30` }}
            >
              4
            </span>
          </h1>
          {/* Floating icon */}
          <Frown
            className="absolute -top-4 right-1/4 h-16 w-16 text-gray-300 opacity-30 md:h-24 md:w-24"
            style={{ transform: "rotate(10deg)" }}
          />
        </div>

        {/* Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">
            Oops! Page not found
          </h2>
          <p className="mx-auto max-w-md text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-gray-500">
            Route: <span className="font-mono text-[#FF9500]">{location.pathname}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#FF9500] px-8 py-3 font-semibold text-white transition-all hover:bg-[#E07800] hover:shadow-lg sm:w-auto"
          >
            <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Go back home
          </Link>
          <Link
            to="/contact"
            className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-all hover:border-[#FF9500] hover:text-[#FF9500] hover:shadow-md sm:w-auto"
          >
            <Mail className="h-4 w-4 transition-transform group-hover:scale-110" />
            Contact support
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <Link to="/" className="flex items-center gap-1 hover:text-[#FF9500]">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <Link to="/features" className="hover:text-[#FF9500]">
            Features
          </Link>
          <Link to="/how-it-works" className="hover:text-[#FF9500]">
            How it works
          </Link>
          <Link to="/download" className="hover:text-[#FF9500]">
            Download
          </Link>
        </div>
      </div>

      {/* Subtle footer */}
      <p className="absolute bottom-4 text-xs text-gray-400">
        © {new Date().getFullYear()} Xpool. All rights reserved.
      </p>
    </div>
  );
};

export default NotFound;
