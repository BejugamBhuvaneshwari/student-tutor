import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, DollarSign, Users, Clock, Settings, Video, Link2, Check, X, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessions } from "@/hooks/useSessions";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const generateMeetingLink = (sessionId: string) =>
  `https://meet.jit.si/TutorBridge-${sessionId.slice(0, 8)}`;

const TutorDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useSessions();
  const [customLinks, setCustomLinks] = useState<Record<string, string>>({});
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editLinkValue, setEditLinkValue] = useState("");

  const { data: tutorProfile } = useQuery({
    queryKey: ["my-tutor-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("tutor_profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (!authLoading && !user) return <Navigate to="/login" />;

  const mySessions = sessions.filter((s) => s.tutor_id === user?.id);
  const pendingSessions = mySessions.filter((s) => s.status === "pending");
  const upcomingSessions = mySessions.filter((s) => s.status === "confirmed");
  const completedSessions = mySessions.filter((s) => s.status === "completed");
  const totalEarnings = completedSessions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const handleSessionAction = async (sessionId: string, action: "confirmed" | "cancelled") => {
    const customLink = customLinks[sessionId]?.trim();
    const meetingLink = action === "confirmed"
      ? (customLink || generateMeetingLink(sessionId))
      : null;

    const { error } = await supabase.from("sessions").update({
      status: action,
      ...(meetingLink ? { meeting_link: meetingLink } : {}),
    }).eq("id", sessionId);

    if (error) {
      toast.error("Failed to update session");
    } else {
      toast.success(
        action === "confirmed"
          ? customLink ? "Session accepted with your custom link!" : "Session accepted! Jitsi meeting link generated."
          : "Session declined"
      );
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        await supabase.from("notifications").insert({
          user_id: session.student_id,
          type: action === "confirmed" ? "demo" : "booking",
          title: action === "confirmed" ? "Session Confirmed ✅" : "Session Declined ❌",
          message: action === "confirmed"
            ? `${profile?.full_name || "Your tutor"} accepted your ${session.session_type} session for ${session.subject}. Join link is ready!`
            : `${profile?.full_name || "Your tutor"} declined your ${session.session_type} session for ${session.subject}.`,
        });
      }
    }
  };

  const handleMarkComplete = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const { error } = await supabase.from("sessions").update({ status: "completed" }).eq("id", sessionId);
    if (error) {
      toast.error("Failed to mark session as completed");
    } else {
      toast.success("Session marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (session) {
        await supabase.from("notifications").insert({
          user_id: session.student_id,
          type: "session_complete",
          title: "Session Completed 🎉",
          message: `Your ${session.session_type} session for ${session.subject} with ${profile?.full_name || "your tutor"} is complete. Leave a review or book another session!`,
        });
      }
    }
  };

  const handleUpdateMeetingLink = async (sessionId: string) => {
    const link = editLinkValue.trim();
    if (!link) { toast.error("Please enter a valid link"); return; }
    const { error } = await supabase.from("sessions").update({ meeting_link: link }).eq("id", sessionId);
    if (error) {
      toast.error("Failed to update link");
    } else {
      toast.success("Meeting link updated!");
      setEditingLink(null);
      setEditLinkValue("");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  };

  const needsSetup = tutorProfile && tutorProfile.subjects.length === 0 && Number(tutorProfile.hourly_rate) === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Tutor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your sessions and profile</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/tutor-setup"><Settings className="mr-2 h-4 w-4" /> Edit Profile</Link>
          </Button>
        </div>

        {needsSetup && (
          <div className="mb-6 rounded-xl border-2 border-accent bg-accent/5 p-6 text-center">
            <h2 className="font-heading text-xl font-bold text-foreground">Complete Your Profile</h2>
            <p className="text-muted-foreground mt-1">Set up your subjects, rates, and availability to start receiving bookings.</p>
            <Button variant="accent" className="mt-4" asChild><Link to="/tutor-setup">Set Up Profile</Link></Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { icon: DollarSign, label: "Total Earnings", value: `₹${totalEarnings}`, color: "text-score-high" },
            { icon: Users, label: "Total Sessions", value: mySessions.length, color: "text-primary" },
            { icon: Calendar, label: "Completed", value: completedSessions.length, color: "text-accent" },
            { icon: Clock, label: "Pending", value: pendingSessions.length, color: "text-destructive" },
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

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Bookings */}
            {pendingSessions.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">Pending Requests</h2>
                <div className="space-y-3">
                  {pendingSessions.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary text-sm">
                            {session.subject[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">{session.subject}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(session.scheduled_at), "MMM d, yyyy · h:mm a")} · {session.duration_minutes}min</div>
                            {session.amount ? (
                              <div className="text-sm font-medium text-accent mt-0.5">₹{Number(session.amount)}</div>
                            ) : (
                              <div className="text-sm text-score-high font-medium mt-0.5">Free Demo</div>
                            )}
                          </div>
                          <Badge variant={session.session_type === "demo" ? "outline" : "secondary"}>
                            {session.session_type}
                          </Badge>
                        </div>
                        {session.notes && (
                          <div className="pl-14 text-sm text-muted-foreground italic">"{session.notes}"</div>
                        )}
                        <div className="flex items-center gap-2 pl-14">
                          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Paste your Zoom/Google Meet link (optional — Jitsi auto-generated if empty)"
                            value={customLinks[session.id] || ""}
                            onChange={(e) => setCustomLinks((prev) => ({ ...prev, [session.id]: e.target.value }))}
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="hero" onClick={() => handleSessionAction(session.id, "confirmed")}>
                            <Check className="mr-1 h-4 w-4" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSessionAction(session.id, "cancelled")}>
                            <X className="mr-1 h-4 w-4" /> Decline
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Upcoming Sessions</h2>
              {upcomingSessions.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
                  <p className="text-muted-foreground">No upcoming sessions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary text-sm">
                            {session.subject[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">{session.subject}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(session.scheduled_at), "MMM d, yyyy · h:mm a")} · {session.duration_minutes}min</div>
                          </div>
                          <Badge variant="secondary">{session.session_type}</Badge>
                          {session.amount ? <span className="font-heading font-bold text-foreground">₹{Number(session.amount)}</span> : <Badge variant="outline">Free</Badge>}
                        </div>

                        {/* Meeting link row */}
                        <div className="flex items-center gap-2 pl-14">
                          {editingLink === session.id ? (
                            <>
                              <Input
                                placeholder="Paste Zoom / Google Meet / any link"
                                value={editLinkValue}
                                onChange={(e) => setEditLinkValue(e.target.value)}
                                className="text-sm h-9 flex-1"
                              />
                              <Button size="sm" variant="hero" onClick={() => handleUpdateMeetingLink(session.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingLink(null); setEditLinkValue(""); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {session.meeting_link ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm text-muted-foreground truncate">{session.meeting_link}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">No meeting link set</span>
                              )}
                              <Button size="sm" variant="outline" onClick={() => { setEditingLink(session.id); setEditLinkValue(session.meeting_link || ""); }}>
                                <Link2 className="mr-1 h-4 w-4" /> {session.meeting_link ? "Change Link" : "Add Link"}
                              </Button>
                              {session.meeting_link && (
                                <Button size="sm" variant="hero" asChild>
                                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                                    <Video className="mr-1 h-4 w-4" /> Start Session
                                  </a>
                                </Button>
                              )}
                              <Button size="sm" variant="accent" onClick={() => handleMarkComplete(session.id)}>
                                <CheckCircle className="mr-1 h-4 w-4" /> Mark Complete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Sessions */}
            {completedSessions.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">Completed Sessions</h2>
                <div className="space-y-3">
                  {completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="rounded-xl border border-border bg-card p-4 shadow-card opacity-80">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-heading font-bold text-muted-foreground text-sm">
                          {session.subject[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">{session.subject}</div>
                          <div className="text-sm text-muted-foreground">{format(new Date(session.scheduled_at), "MMM d, yyyy · h:mm a")}</div>
                        </div>
                        <Badge variant="outline" className="text-score-high border-score-high/30">Completed</Badge>
                        {session.amount ? <span className="font-heading font-bold text-accent">₹{Number(session.amount)}</span> : <span className="text-sm text-muted-foreground">Free</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-semibold text-card-foreground mb-3">Earnings Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Earned</span><span className="font-medium text-accent">₹{totalEarnings}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions Completed</span><span className="font-medium text-card-foreground">{completedSessions.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hourly Rate</span><span className="font-medium text-card-foreground">₹{Number(tutorProfile?.hourly_rate || 0)}/hr</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-semibold text-card-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link to="/tutor-setup"><Calendar className="mr-2 h-4 w-4" /> Update Profile</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link to="/chat">💬 Open Chat</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TutorDashboard;
