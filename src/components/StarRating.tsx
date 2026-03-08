import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const StarRating = ({ rating, maxRating = 5, size = "md", showValue = true }: StarRatingProps) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i < Math.floor(rating)
              ? "fill-accent text-accent"
              : i < rating
              ? "fill-accent/50 text-accent"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
    {showValue && (
      <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
    )}
  </div>
);

export default StarRating;
