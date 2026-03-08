import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, TrendingUp, Sparkles, Video, X, MessageSquare, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorCard from "@/components/TutorCard";
import ReviewDialog from "@/components/ReviewDialog";
import { mockTutors } from "@/data/mockData";
import { useSessions } from "@/hooks/useSessions";
import { useNotifications } from "@/hooks/useSessions";
import { useTutors } from "@/hooks/useTutors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tutor } from "@/types";
import { TutorWithProfile } from "@/hooks/useTutors";

const dbToDisplay = (t: TutorWithProfile): Tutor => ({
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

const StudentDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { data: sessions = [] } = useSessions();
  const { data: notifications = [] } = useNotifications();
  const { data: dbTutors = [] } = useTutors();
  const queryClient = useQueryClient();

  // Fetch existing reviews by this student to know which sessions are already reviewed
  const { data: myReviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("reviews").select("session_id").eq("student_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch tutor profile names for session display
  const { data: tutorProfiles = [] } = useQuery({
    queryKey: ["tutor-profiles-for-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  if (!authLoading && !user) return <Navigate to="/login" />;

  const reviewedSessionIds = new Set(myReviews.map((r) => r.session_id));
  const getTutorName = (tutorId: string) => tutorProfiles.find((p) => p.user_id === tutorId)?.full_name || "Tutor";

  const pendingSessions = sessions.filter((s) => s.student_id === user?.id && s.status === "pending");
  const confirmedSessions = sessions.filter((s) => s.student_id === user?.id && s.status === "confirmed");
  const completedSessions = sessions.filter((s) => s.student_id === user?.id && s.status === "completed");
  const upcomingSessions = [...pendingSessions, ...confirmedSessions];
  const unreadNotifs = notifications.filter((n) => !n.read);

  const recommendedTutors = dbTutors.length > 0
    ? dbTutors.slice(0, 2).map(dbToDisplay)
    : mockTutors.slice(0, 2);

  const handleCancelSession = async (sessionId: string) => {
    const { error } = await supabase.from("sessions").update({ status: "cancelled" }).eq("id", sessionId);
    if (error) {
      toast.error("Failed to cancel session");
    } else {
      toast.success("Session cancelled");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}! 👋</h1>
            <p className="text-muted-foreground mt-1">Here's your learning overview</p>
          </div>
          <Button variant="hero" asChild><Link to="/tutors">Find a Tutor</Link></Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { icon: Calendar, label: "Upcoming", value: upcomingSessions.length, color: "text-primary" },
            { icon: BookOpen, label: "Completed", value: completedSessions.length, color: "text-score-high" },
            { icon: TrendingUp, label: "Learning Points", value: completedSessions.length * 100, color: "text-accent" },
            { icon: Clock, label: "Notifications", value: unreadNotifs.length, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-card-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Upcoming Sessions</h2>
              {upcomingSessions.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
                  <p className="text-muted-foreground">No upcoming sessions</p>
                  <Button variant="hero" className="mt-3" asChild><Link to="/tutors">Book a Session</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <motion.div key={session.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary text-sm">
                          {session.subject[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">{session.subject}</div>
                          <div className="text-xs text-muted-foreground">with {getTutorName(session.tutor_id)}</div>
                          <div className="text-sm text-muted-foreground">{format(new Date(session.scheduled_at), "MMM d, yyyy · h:mm a")} · {session.duration_minutes}min</div>
                        </div>
                        <Badge variant={session.session_type === "demo" ? "outline" : "secondary"}>
                          {session.session_type}
                        </Badge>
                        <Badge variant={session.status === "confirmed" ? "default" : "outline"}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                        {session.status === "confirmed" && session.meeting_link && (
                          <Button size="sm" variant="hero" asChild>
                            <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                              <Video className="mr-1 h-4 w-4" /> Join Session
                            </a>
                          </Button>
                        )}
                        {session.status === "confirmed" && !session.meeting_link && (
                          <span className="text-xs text-muted-foreground flex items-center">⏳ Tutor will share the meeting link soon</span>
                        )}
                        {session.status === "pending" && (
                          <span className="text-xs text-muted-foreground flex items-center">⏳ Waiting for tutor to accept...</span>
                        )}
                        {session.amount ? (
                          <span className="text-sm font-medium text-accent flex items-center">₹{Number(session.amount)}</span>
                        ) : (
                          <Badge variant="outline" className="text-score-high border-score-high/30">Free Demo</Badge>
                        )}
                        <Button size="sm" variant="outline" className="ml-auto" onClick={() => handleCancelSession(session.id)}>
                          <X className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Sessions — Post-session actions */}
            {completedSessions.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">Completed Sessions</h2>
                <div className="space-y-3">
                  {completedSessions.map((session) => {
                    const alreadyReviewed = reviewedSessionIds.has(session.id);
                    return (
                      <div key={session.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-heading font-bold text-muted-foreground text-sm">
                            {session.subject[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">{session.subject}</div>
                            <div className="text-xs text-muted-foreground">with {getTutorName(session.tutor_id)}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(session.scheduled_at), "MMM d, yyyy")}</div>
                          </div>
                          <Badge variant="outline" className="text-score-high border-score-high/30">Completed</Badge>
                          {session.amount ? <span className="font-heading font-bold text-accent">₹{Number(session.amount)}</span> : <span className="text-sm text-muted-foreground">Free</span>}
                        </div>
                        {/* Post-session actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                          {alreadyReviewed ? (
                            <span className="text-xs text-score-high flex items-center gap-1"><Star className="h-3 w-3" /> Reviewed</span>
                          ) : (
                            <ReviewDialog
                              tutorId={session.tutor_id}
                              tutorName={getTutorName(session.tutor_id)}
                              sessionId={session.id}
                              subject={session.subject}
                            />
                          )}
                          <Button size="sm" variant="hero" asChild>
                            <Link to={`/tutor/${session.tutor_id}`}>
                              <Calendar className="mr-1 h-4 w-4" /> Book Again
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/chat">
                              <MessageSquare className="mr-1 h-4 w-4" /> Chat
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Recommended */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="font-heading text-xl font-bold">AI Recommended For You</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedTutors.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-semibold text-card-foreground mb-3">Recent Notifications</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`rounded-lg p-3 text-sm ${n.read ? "bg-background" : "bg-primary/5 border border-primary/10"}`}>
                      <div className="font-medium text-card-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-semibold text-card-foreground mb-3">Learning Rewards</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions Attended</span><span className="font-medium text-card-foreground">{completedSessions.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Points</span><span className="font-medium text-accent">{completedSessions.length * 100} 🏆</span></div>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/chat">💬 Open Chat</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
