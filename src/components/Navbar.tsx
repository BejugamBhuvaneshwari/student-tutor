import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X, LogOut, LayoutDashboard, MessageCircle, Settings } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { label: "Find Tutors", href: "/tutors" },
  { label: "How It Works", href: "/#how-it-works" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, profile, signOut } = useAuth();

  const dashboardPath = role === "tutor" ? "/tutor-dashboard" : "/dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            TutorBridge <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} className={cn("text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", location.pathname === item.href && "text-foreground")}>
              {item.label}
            </Link>
          ))}
          {!user && (
            <Link to="/signup" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Become a Tutor
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="icon" asChild>
                <Link to="/chat"><MessageCircle className="h-5 w-5" /></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 ml-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm max-w-[100px] truncate">{profile?.full_name || "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  {role === "tutor" && (
                    <DropdownMenuItem onClick={() => navigate("/tutor-setup")}>
                      <Settings className="mr-2 h-4 w-4" /> Edit Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Log In</Link></Button>
              <Button variant="hero" asChild><Link to="/signup">Get Started</Link></Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationBell />}
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border bg-background md:hidden">
            <div className="container flex flex-col gap-4 py-4">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>{item.label}</Link>
              ))}
              {user ? (
                <>
                  <Link to={dashboardPath} className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/chat" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Chat</Link>
                  {role === "tutor" && <Link to="/tutor-setup" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Edit Profile</Link>}
                  <Button variant="outline" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign Out</Button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" asChild className="flex-1"><Link to="/login">Log In</Link></Button>
                  <Button variant="hero" asChild className="flex-1"><Link to="/signup">Get Started</Link></Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
