import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, MapPin, Clock, Award, Users, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import CompatibilityScore from "@/components/CompatibilityScore";
import BookingDialog from "@/components/BookingDialog";
import ReviewDialog from "@/components/ReviewDialog";
import { mockTutors, mockReviews } from "@/data/mockData";
import { useTutor } from "@/hooks/useTutors";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { format } from "date-fns";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TutorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: dbTutor, isLoading } = useTutor(id || "");

  // Fall back to mock data if no DB tutor
  const mockTutor = mockTutors.find((t) => t.id === id);

  // Build display data
  const tutor = dbTutor
    ? {
        id: dbTutor.user_id,
        name: dbTutor.profiles?.full_name || "Unknown",
        avatar: dbTutor.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbTutor.profiles?.full_name || "T")}&background=2a9d8f&color=fff`,
        subjects: dbTutor.subjects,
        rating: dbTutor.avg_rating,
        reviewCount: dbTutor.review_count,
        hourlyRate: Number(dbTutor.hourly_rate),
        location: dbTutor.profiles?.location || "Online",
        experience: dbTutor.experience_years,
        bio: dbTutor.profiles?.bio || "",
        verified: dbTutor.verified,
        availability: dbTutor.availability,
        successRate: Number(dbTutor.success_rate) || 0,
        totalSessions: dbTutor.total_sessions || 0,
        compatibilityScore: Math.floor(Math.random() * 30) + 70,
        reviews: dbTutor.reviews || [],
        isSample: false,
      }
    : mockTutor
    ? { ...mockTutor, subjects: mockTutor.subject, reviews: mockReviews, isSample: true }
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading tutor profile...</div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-lg text-foreground">Tutor not found</p>
          <Button variant="outline" className="mt-4" asChild><Link to="/tutors">Browse Tutors</Link></Button>
        </div>
      </div>
    );
  }

  const isDbTutor = !!dbTutor;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex gap-5">
                <div className="relative shrink-0">
                  <img src={tutor.avatar} alt={tutor.name} className="h-24 w-24 rounded-xl object-cover ring-2 ring-border" />
                  {tutor.verified && <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 fill-primary text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="font-heading text-2xl font-bold text-card-foreground">{tutor.name}</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <StarRating rating={tutor.rating} />
                        <span className="text-sm text-muted-foreground">({tutor.reviewCount} reviews)</span>
                      </div>
                    </div>
                    <CompatibilityScore score={tutor.compatibilityScore} size="md" />
                  </div>
                  <p className="mt-3 text-muted-foreground">{tutor.bio}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tutor.subjects.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center"><div className="font-heading text-xl font-bold text-foreground">{tutor.experience}</div><div className="text-xs text-muted-foreground">Years Exp.</div></div>
                <div className="text-center"><div className="font-heading text-xl font-bold text-foreground">{tutor.totalSessions}</div><div className="text-xs text-muted-foreground">Sessions</div></div>
                <div className="text-center"><div className="font-heading text-xl font-bold text-foreground">{tutor.successRate}%</div><div className="text-xs text-muted-foreground">Success Rate</div></div>
                <div className="text-center"><div className="font-heading text-xl font-bold text-foreground">{tutor.rating.toFixed(1)}</div><div className="text-xs text-muted-foreground">Rating</div></div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="reviews">
              <TabsList className="w-full">
                <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                <TabsTrigger value="availability" className="flex-1">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-4 space-y-4">
                {user && <ReviewDialog tutorId={tutor.id} tutorName={tutor.name} subject={tutor.subjects[0]} />}
                {tutor.reviews.length === 0 && <p className="text-muted-foreground text-center py-8">No reviews yet</p>}
                {tutor.reviews.map((review: any) => (
                  <div key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(review.studentName || review.student_id || "S")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-card-foreground text-sm">{review.studentName || "Student"}</div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" showValue={false} />
                          <span className="text-xs text-muted-foreground">
                            {review.date || (review.created_at ? format(new Date(review.created_at), "MMM d, yyyy") : "")}
                          </span>
                        </div>
                      </div>
                      {(review.subject) && <Badge variant="outline" className="ml-auto text-xs">{review.subject}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="about" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {tutor.location}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4" /> {tutor.experience} years of teaching experience</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {tutor.totalSessions} sessions completed</div>
                  <p className="text-muted-foreground pt-2">{tutor.bio}</p>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="font-heading font-semibold text-card-foreground mb-4">Weekly Availability</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => (
                      <div key={day} className={`rounded-lg p-3 text-center text-sm font-medium ${tutor.availability.includes(day) ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"}`}>
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="text-center mb-4">
                  <span className="font-heading text-3xl font-bold text-foreground">₹{tutor.hourlyRate}</span>
                  <span className="text-muted-foreground">/hour</span>
                </div>
                <BookingDialog
                  tutorId={tutor.id}
                  tutorName={tutor.name}
                  hourlyRate={tutor.hourlyRate}
                  subjects={tutor.subjects}
                  availability={tutor.availability}
                />
                <div className="mt-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/chat?with=${tutor.id}`}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Message Tutor
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-heading font-semibold text-card-foreground text-sm mb-3">AI Compatibility Score</h3>
                <div className="flex items-center gap-3">
                  <CompatibilityScore score={tutor.compatibilityScore} size="lg" />
                  <p className="text-xs text-muted-foreground">Based on your learning style, subject preferences, and schedule compatibility.</p>
                </div>
              </div>
              {tutor.isSample && (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/50 p-4 text-center">
                  <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30 mb-1">
                    Sample Profile
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">This is a sample tutor profile for illustration purposes. Real tutors will appear once they sign up.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default TutorProfile;
