export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  subject: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  distance?: number;
  experience: number;
  bio: string;
  compatibilityScore: number;
  verified: boolean;
  availability: string[];
  successRate: number;
  totalSessions: number;
  isSample?: boolean;
}

export interface Review {
  id: string;
  studentName: string;
  studentAvatar: string;
  rating: number;
  comment: string;
  date: string;
  subject: string;
}

export interface Session {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "completed" | "cancelled";
  type: "demo" | "paid" | "micro";
}

export interface Notification {
  id: string;
  type: "booking" | "demo" | "payment" | "message";
  title: string;
  message: string;
  time: string;
  read: boolean;
}
