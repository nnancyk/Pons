import { Calendar, MapPin, Users, CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";
import type { Event, EventStatus } from "@/data/events";

interface EventCardProps {
  event: Event;
  index: number;
}

const statusStyles: Record<EventStatus, { bg: string; text: string; label: string }> = {
  ongoing: { bg: "bg-green-100", text: "text-green-700", label: "Ongoing" },
  canceled: { bg: "bg-red-100", text: "text-red-700", label: "Canceled" },
  delayed: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Delayed" },
};

const EventCard = ({ event, index }: EventCardProps) => {
  const status = statusStyles[event.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-xl border border-border p-6 transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 cursor-pointer flex flex-col"
    >
      {/* Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-display text-lg text-foreground leading-snug">
          {event.title}
        </h3>
        <span className={`shrink-0 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{event.date} at {event.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          <span>{event.access === "members" ? "RSVP" : "No requirements"}</span>
        </div>
      </div>

      {/* RSO Name */}
      <p className="text-sm text-primary font-medium mb-4">{event.rsoName}</p>

      {/* Divider */}
      <div className="border-t border-border my-1 mb-4" />

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {event.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full border border-border text-xs text-foreground font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* Add to Calendar Button */}
      <button className="mt-auto w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm">
        <CalendarPlus className="h-4 w-4" />
        Add to Calendar
      </button>
    </motion.div>
  );
};

export default EventCard;
