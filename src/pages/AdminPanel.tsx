import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Shield, BarChart3, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const AdminPanel = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all profiles
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, location, created_at")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch all tutor profiles
  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-tutors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tutor_profiles")
        .select(`
          user_id, subjects, hourly_rate, experience_years, verified, total_sessions,
          profiles!tutor_profiles_user_id_fkey (full_name, avatar_url, location)
        `)
        .order("created_at", { ascending: false });
      return (data || []).map((t) => ({
        ...t,
        profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
      }));
    },
  });

  // Fetch session stats
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("id, status, session_type, amount, created_at");
      return data || [];
    },
  });

  // Fetch reviews stats
  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("id, rating, created_at");
      return data || [];
    },
  });

  const handleVerifyTutor = async (tutorUserId: string, verify: boolean) => {
    const { error } = await supabase
      .from("tutor_profiles")
      .update({ verified: verify })
      .eq("user_id", tutorUserId);

    if (error) {
      toast.error("Failed to update verification");
    } else {
      toast.success(verify ? "Tutor verified!" : "Verification removed");
      queryClient.invalidateQueries({ queryKey: ["admin-tutors"] });

      // Notify tutor
      await supabase.from("notifications").insert({
        user_id: tutorUserId,
        type: "booking",
        title: verify ? "Profile Verified ✅" : "Verification Removed",
        message: verify
          ? "Congratulations! Your tutor profile has been verified by our team."
          : "Your verification status has been updated. Please contact support for more info.",
      });
    }
  };

  // Stats
  const totalRevenue = sessions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const pendingSessions = sessions.filter((s) => s.status === "pending").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple admin check - in production you'd use has_role
  if (role !== "admin" && role !== "tutor") {
    // For now allow tutor + admin access for demo purposes
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, tutors, and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: users.length, color: "text-primary" },
            { icon: Shield, label: "Verified Tutors", value: tutors.filter((t) => t.verified).length, color: "text-score-high" },
            { icon: BarChart3, label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "text-accent" },
            { icon: AlertTriangle, label: "Pending Sessions", value: pendingSessions, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-card-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="tutors">
          <TabsList>
            <TabsTrigger value="tutors">Tutor Verification</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tutors" className="mt-4 space-y-3">
            {tutors.map((tutor) => (
              <div key={tutor.user_id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                <img
                  src={tutor.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.profiles?.full_name || "T")}&background=2a9d8f&color=fff`}
                  alt={tutor.profiles?.full_name || "Tutor"}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium text-card-foreground">{tutor.profiles?.full_name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">
                    {tutor.subjects.join(", ") || "No subjects"} · ₹{Number(tutor.hourly_rate)}/hr · {tutor.experience_years}yr exp
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{tutor.profiles?.location || "Online"}</div>
                <Badge variant={tutor.verified ? "default" : "outline"}>
                  {tutor.verified ? "Verified" : "Unverified"}
                </Badge>
                <div className="flex gap-2">
                  {!tutor.verified ? (
                    <Button size="sm" variant="hero" onClick={() => handleVerifyTutor(tutor.user_id, true)}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Verify
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleVerifyTutor(tutor.user_id, false)}>
                      <XCircle className="mr-1 h-3 w-3" /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {tutors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No tutors registered yet</p>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.user_id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                  <img
                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || "U")}&background=2a9d8f&color=fff`}
                    alt={u.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground text-sm">{u.full_name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">{u.location || "No location"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-heading font-semibold text-card-foreground mb-4">Platform Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Users</span>
                    <span className="font-medium text-card-foreground">{users.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tutors</span>
                    <span className="font-medium text-card-foreground">{tutors.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verified Tutors</span>
                    <span className="font-medium text-score-high">{tutors.filter((t) => t.verified).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-medium text-card-foreground">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed Sessions</span>
                    <span className="font-medium text-card-foreground">{completedSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Rating</span>
                    <span className="font-medium text-accent">{avgRating} ⭐</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-heading font-semibold text-card-foreground mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-heading font-bold text-card-foreground">₹{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Commission (10%)</span>
                    <span className="font-medium text-accent">₹{(totalRevenue * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid Sessions</span>
                    <span className="font-medium text-card-foreground">{sessions.filter((s) => s.session_type === "paid").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Demo Sessions</span>
                    <span className="font-medium text-card-foreground">{sessions.filter((s) => s.session_type === "demo").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Micro Sessions</span>
                    <span className="font-medium text-card-foreground">{sessions.filter((s) => s.session_type === "micro").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-medium text-card-foreground">{reviews.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;
