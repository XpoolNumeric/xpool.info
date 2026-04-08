import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-background border-t py-8 mt-auto z-10 relative">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground text-center md:text-left font-medium">
          <p>© 2026 Xpool. All rights reserved.</p>
          <p>Owned and operated by ABISHEK</p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground font-medium">
          <Link to="/legal" className="hover:text-primary transition-colors">Legal</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
