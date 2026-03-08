import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/local/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSessions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
