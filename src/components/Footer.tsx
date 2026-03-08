import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              TutorBridge <span className="text-primary">AI</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            AI-powered tutor discovery platform connecting students with the perfect tutors.
          </p>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-foreground mb-3">For Students</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/tutors" className="hover:text-foreground transition-colors">Find Tutors</Link>
            <Link to="/subjects" className="hover:text-foreground transition-colors">Browse Subjects</Link>
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-foreground mb-3">For Tutors</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/tutor-signup" className="hover:text-foreground transition-colors">Become a Tutor</Link>
            <Link to="/tutor-resources" className="hover:text-foreground transition-colors">Resources</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-foreground mb-3">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TutorBridge AI. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
