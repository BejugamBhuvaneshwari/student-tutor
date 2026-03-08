import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorCard from "@/components/TutorCard";
import { mockTutors, subjects } from "@/data/mockData";
import { useTutors, TutorWithProfile } from "@/hooks/useTutors";
import { motion } from "framer-motion";
import { Tutor } from "@/types";

const dbToDisplayTutor = (t: TutorWithProfile): Tutor => ({
  id: t.user_id,
  name: t.profiles?.full_name || "Unnamed",
  avatar: t.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.profiles?.full_name || "U")}&background=2a9d8f&color=fff`,
  subject: t.subjects,
  rating: t.avg_rating || 0,
  reviewCount: t.review_count || 0,
  hourlyRate: Number(t.hourly_rate),
  location: t.profiles?.location || "Online",
  experience: t.experience_years,
  bio: t.profiles?.bio || "",
  compatibilityScore: Math.floor(Math.random() * 30) + 70,
  verified: t.verified,
  availability: t.availability,
  successRate: Number(t.success_rate) || 0,
  totalSessions: t.total_sessions || 0,
});

const pricePresets = [
  { label: "All Prices", min: 0, max: 2000 },
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "Under ₹750", min: 0, max: 750 },
  { label: "Under ₹1000", min: 0, max: 1000 },
  { label: "₹1000+", min: 1000, max: 2000 },
];

const BrowseTutors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);
  const [sortBy, setSortBy] = useState("compatibility");
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<string>("all");

  const { data: dbTutors, isLoading } = useTutors();

  const allTutors = useMemo(() => {
    const sampleTutors = mockTutors.map(t => ({ ...t, isSample: true }));
    if (dbTutors && dbTutors.length > 0) {
      const realTutors = dbTutors.map(dbToDisplayTutor);
      return realTutors;
    }
    return sampleTutors;
  }, [dbTutors]);

  const locations = useMemo(() => {
    const locs = new Set(allTutors.map((t) => t.location));
    return Array.from(locs).sort();
  }, [allTutors]);

  const filteredTutors = useMemo(() => {
    let tutors = [...allTutors];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tutors = tutors.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject.some((s) => s.toLowerCase().includes(q)) ||
          t.location.toLowerCase().includes(q) ||
          (t.bio && t.bio.toLowerCase().includes(q))
      );
    }

    if (selectedSubject && selectedSubject !== "all") {
      tutors = tutors.filter((t) => t.subject.includes(selectedSubject));
    }

    if (selectedLocation && selectedLocation !== "all") {
      tutors = tutors.filter((t) => t.location === selectedLocation);
    }

    if (selectedAvailability && selectedAvailability !== "all") {
      tutors = tutors.filter((t) => t.availability?.includes(selectedAvailability));
    }

    tutors = tutors.filter((t) => t.hourlyRate >= priceRange[0] && t.hourlyRate <= priceRange[1]);

    if (minRating && minRating !== "all") {
      const minR = parseFloat(minRating);
      tutors = tutors.filter((t) => t.rating >= minR);
    }

    switch (sortBy) {
      case "price-low": tutors.sort((a, b) => a.hourlyRate - b.hourlyRate); break;
      case "price-high": tutors.sort((a, b) => b.hourlyRate - a.hourlyRate); break;
      case "rating": tutors.sort((a, b) => b.rating - a.rating); break;
      case "reviews": tutors.sort((a, b) => b.reviewCount - a.reviewCount); break;
      default: tutors.sort((a, b) => b.compatibilityScore - a.compatibilityScore); break;
    }

    return tutors;
  }, [allTutors, searchQuery, selectedSubject, selectedLocation, selectedAvailability, priceRange, sortBy, minRating]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Find Your Perfect Tutor</h1>
          <p className="mt-1 text-muted-foreground">
            Browse {allTutors.length} tutors across {subjects.length}+ subjects
          </p>
          {(!dbTutors || dbTutors.length === 0) && (
            <p className="mt-2 text-xs text-muted-foreground">Showing sample users (demo data) because no real tutors are available yet.</p>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, subject, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Price Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pricePresets.map((preset) => (
            <Button
              key={preset.label}
              variant={priceRange[0] === preset.min && priceRange[1] === preset.max ? "default" : "outline"}
              size="sm"
              onClick={() => setPriceRange([preset.min, preset.max])}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="grid gap-6 md:grid-cols-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}/hr</label>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={2000} step={50} className="mt-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Availability</label>
                <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Day</SelectItem>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Minimum Rating</label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                    <SelectItem value="4.0">4.0+ ⭐</SelectItem>
                    <SelectItem value="3.5">3.5+ ⭐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compatibility">Best Match</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(selectedSubject !== "all" || selectedLocation !== "all" || selectedAvailability !== "all" || priceRange[0] > 0 || priceRange[1] < 2000 || minRating !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {selectedSubject !== "all" && (<Badge variant="secondary" className="gap-1">{selectedSubject}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSubject("all")} /></Badge>)}
                {selectedLocation !== "all" && (<Badge variant="secondary" className="gap-1">📍 {selectedLocation}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLocation("all")} /></Badge>)}
                {selectedAvailability !== "all" && (<Badge variant="secondary" className="gap-1">📅 {selectedAvailability}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAvailability("all")} /></Badge>)}
                {(priceRange[0] > 0 || priceRange[1] < 2000) && (<Badge variant="secondary" className="gap-1">₹{priceRange[0]}-₹{priceRange[1]}/hr<X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 2000])} /></Badge>)}
                {minRating !== "all" && (<Badge variant="secondary" className="gap-1">{minRating}+ ⭐<X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating("all")} /></Badge>)}
              </div>
            )}
          </motion.div>
        )}

        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${filteredTutors.length} tutor${filteredTutors.length !== 1 ? "s" : ""} found`}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTutors.map((tutor) => (<TutorCard key={tutor.id} tutor={tutor} />))}
        </div>

        {!isLoading && filteredTutors.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">No tutors found</p>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrowseTutors;
