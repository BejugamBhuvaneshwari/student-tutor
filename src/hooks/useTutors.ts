import { useQuery } from "@tanstack/react-query";

export interface TutorWithProfile {
  user_id: string;
  subjects: string[];
  hourly_rate: number;
  experience_years: number;
  availability: string[];
  verified: boolean;
  success_rate: number | null;
  total_sessions: number | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
  } | null;
  avg_rating?: number;
  review_count?: number;
  reviews?: Array<{
    studentName?: string;
    studentAvatar?: string;
    student_id?: string;
    rating: number;
    comment?: string;
    subject?: string;
    created_at?: string;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const useTutors = () => {
  return useQuery({
    queryKey: ["tutors"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tutors`);
      if (!response.ok) {
        throw new Error("Failed to fetch tutors from local API");
      }
      const data = (await response.json()) as TutorWithProfile[];
      return data || [];
    },
  });
};

export const useTutor = (userId: string) => {
  return useQuery({
    queryKey: ["tutor", userId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tutors/${userId}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error("Failed to fetch tutor from local API");
      }
      return (await response.json()) as TutorWithProfile;
    },
    enabled: !!userId,
  });
};
