import { cn } from "@/lib/utils";

interface CompatibilityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const CompatibilityScore = ({ score, size = "md" }: CompatibilityScoreProps) => {
  const colorClass =
    score >= 80 ? "text-score-high border-score-high" :
    score >= 50 ? "text-score-medium border-score-medium" :
    "text-score-low border-score-low";

  const sizeClasses = {
    sm: "h-10 w-10 text-xs",
    md: "h-14 w-14 text-sm",
    lg: "h-18 w-18 text-base",
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-full border-2 font-heading font-bold",
      colorClass,
      sizeClasses[size]
    )}>
      <span>{score}%</span>
    </div>
  );
};

export default CompatibilityScore;
