import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { toast } from "sonner";
import { subjects } from "@/data/mockData";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TutorSetup = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects((prev) => [...prev, customSubject.trim()]);
      setCustomSubject("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject");
      return;
    }
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      toast.error("Please set a valid hourly rate");
      return;
    }

    setLoading(true);
    try {
      // Update profile
      await supabase.from("profiles").update({ bio, location }).eq("user_id", user.id);

      // Update tutor profile
      const { error } = await supabase
        .from("tutor_profiles")
        .update({
          subjects: selectedSubjects,
          hourly_rate: Number(hourlyRate),
          experience_years: Number(experience) || 0,
          availability,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile setup complete!");
      navigate("/tutor-dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Set Up Your Tutor Profile</h1>
        <p className="text-muted-foreground mb-8">Complete your profile to start receiving bookings</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">About You</h2>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about your teaching experience and approach..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input id="experience" type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5" />
            </div>
          </div>

          {/* Subjects */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">Subjects You Teach</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <Badge
                  key={s}
                  variant={selectedSubjects.includes(s) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                  {selectedSubjects.includes(s) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Add custom subject..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSubject())} />
              <Button type="button" variant="outline" size="icon" onClick={addCustomSubject}><Plus className="h-4 w-4" /></Button>
            </div>
            {selectedSubjects.filter((s) => !subjects.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.filter((s) => !subjects.includes(s)).map((s) => (
                  <Badge key={s} variant="default" className="cursor-pointer" onClick={() => toggleSubject(s)}>
                    {s} <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Availability */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">Pricing & Availability</h2>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input id="rate" type="number" min="1" step="1" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="45" />
            </div>
            <div className="space-y-2">
              <Label>Available Days</Label>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg p-3 text-center text-sm font-medium transition-colors ${
                      availability.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default TutorSetup;
