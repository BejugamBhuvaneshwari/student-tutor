import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, BadgeCheck } from "lucide-react";
import StarRating from "@/components/StarRating";
import CompatibilityScore from "@/components/CompatibilityScore";
import { Tutor } from "@/types";

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard = ({ tutor }: TutorCardProps) => (
  <Link
    to={`/tutors/${tutor.id}`}
    className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1"
  >
    <div className="flex gap-4">
      <div className="relative shrink-0">
        <img
          src={tutor.avatar}
          alt={tutor.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
        />
        {tutor.verified && (
          <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-primary text-primary-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold text-card-foreground truncate">
              {tutor.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={tutor.rating} size="sm" />
              <span className="text-xs text-muted-foreground">({tutor.reviewCount})</span>
            </div>
          </div>
          <CompatibilityScore score={tutor.compatibilityScore} size="sm" />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {tutor.subject.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs font-normal">
              {s}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {tutor.distance ? `${tutor.distance} km` : tutor.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tutor.experience}yr exp
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
      <span className="font-heading text-lg font-bold text-foreground">
        ₹{tutor.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span>
      </span>
      <Button size="sm" variant="hero" className="text-xs">
        Book Session
      </Button>
    </div>
    {tutor.isSample && (
      <div className="mt-2 text-center">
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
          Sample Profile — For illustration only
        </Badge>
      </div>
    )}
  </Link>
);

export default TutorCard;
