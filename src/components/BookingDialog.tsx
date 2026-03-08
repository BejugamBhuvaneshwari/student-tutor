import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface BookingDialogProps {
  tutorId: string;
  tutorName: string;
  hourlyRate: number;
  subjects: string[];
  availability: string[];
}

const BookingDialog = ({ tutorId, tutorName, hourlyRate, subjects, availability }: BookingDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionType, setSessionType] = useState<"paid" | "demo" | "micro">("paid");
  const [subject, setSubject] = useState(subjects[0] || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const durationMap = { paid: 60, demo: 20, micro: 15 };
  const priceMap = { paid: hourlyRate, demo: 0, micro: Math.round(hourlyRate * 0.25) };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book a session");
      navigate("/login");
      return;
    }
    if (!date || !time) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from("sessions").insert({
        student_id: user.id,
        tutor_id: tutorId,
        subject,
        scheduled_at: scheduledAt,
        duration_minutes: durationMap[sessionType],
        session_type: sessionType,
        amount: priceMap[sessionType],
        notes,
        status: sessionType === "demo" ? "pending" : "pending",
      });

      if (error) throw error;

      // Create notification for tutor
      await supabase.from("notifications").insert({
        user_id: tutorId,
        type: sessionType === "demo" ? "demo" : "booking",
        title: sessionType === "demo" ? "New Demo Request" : "New Booking",
        message: `${user.user_metadata?.full_name || "A student"} wants to book a ${sessionType} session for ${subject}.`,
      });

      toast.success(sessionType === "demo" ? "Demo request sent!" : "Session booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to book session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-3">
        <DialogTrigger asChild>
          <Button variant="hero" className="w-full" size="lg" onClick={() => setSessionType("paid")}>
            <Calendar className="mr-2 h-4 w-4" /> Book a Session
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button variant="accent" className="w-full" size="lg" onClick={() => setSessionType("demo")}>
            <Clock className="mr-2 h-4 w-4" /> Free 20-min Demo
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={() => setSessionType("micro")}>
            <Zap className="mr-2 h-4 w-4" /> Micro Session — ₹{priceMap.micro}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {sessionType === "demo" ? "Book Free Demo" : sessionType === "micro" ? "Book Micro Session" : "Book Session"} with {tutorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-foreground">{durationMap[sessionType]} min</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium text-foreground">{priceMap[sessionType] === 0 ? "Free" : `₹${priceMap[sessionType]}`}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {availability.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Available: {availability.join(", ")}
            </p>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific topics you'd like to cover..." rows={2} />
          </div>

          <Button variant="hero" className="w-full" onClick={handleBook} disabled={loading}>
            {loading ? "Booking..." : sessionType === "demo" ? "Request Demo" : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
