import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/local/client";

type AppRole = "student" | "tutor" | "admin";
type User = { id: string; email?: string; user_metadata?: { full_name?: string } };
type Session = { user: User } | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: { full_name: string; avatar_url: string | null; bio: string | null; location: string | null } | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const hydrateFromSession = async (sessionData: Session) => {
    setSession(sessionData);
    setUser(sessionData?.user ?? null);

    if (sessionData?.user?.id) {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", sessionData.user.id).maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, avatar_url, bio, location")
          .eq("user_id", sessionData.user.id)
          .maybeSingle(),
      ]);

      setRole((roleRes.data?.role as AppRole) || null);
      setProfile(profileRes.data || null);
    } else {
      setRole(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event: string, sessionData: Session) => {
      await hydrateFromSession(sessionData);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: sessionResult }) => {
      await hydrateFromSession((sessionResult?.session as Session) || null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, accountRole: AppRole) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: accountRole },
      },
    });

    if (!error) {
      await hydrateFromSession(data?.user ? { user: data.user } : null);
    }
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await hydrateFromSession(data?.user ? { user: data.user } : null);
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await hydrateFromSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
