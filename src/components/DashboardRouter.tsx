import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentDashboard from "@/pages/StudentDashboard";
import TutorDashboard from "@/pages/TutorDashboard";

const DashboardRouter = () => {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (role === "tutor") return <TutorDashboard />;
  if (role === "admin") return <Navigate to="/admin" />;
  return <StudentDashboard />;
};

export default DashboardRouter;
