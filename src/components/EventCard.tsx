import { Calendar, MapPin, ExternalLink, CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";
import type { Event } from "@/data/events";
import { getLocationString } from "@/data/events";

interface EventCardProps {
  event: Event;
  index: number;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "bg-green-100", text: "text-green-700", label: "Confirmed" },
  canceled:  { bg: "bg-red-100",   text: "text-red-700",   label: "Canceled" },
  pending:   { bg: "bg-yellow-100",text: "text-yellow-700",label: "Pending" },
};

const defaultStatus = { bg: "bg-muted", text: "text-muted-foreground", label: "Unknown" };

const EventCard = ({ event, index }: EventCardProps) => {
  const status = statusStyles[event.status?.toLowerCase()] ?? defaultStatus;
  const locationStr = getLocationString(event);
  const date = event.eventStart
    ? new Date(event.eventStart).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "TBD";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-xl border border-border p-6 transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 cursor-pointer flex flex-col"
    >
      {/* Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-display text-lg text-foreground leading-snug">{event.eventName}</h3>
        <span className={`shrink-0 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{locationStr}</span>
        </div>
        {event.isVirtual && event.virtualLink && (
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 shrink-0" />
            <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
              Join online
            </a>
          </div>
        )}
      </div>

      {/* RSO Name */}
      <p className="text-sm text-primary font-medium mb-4">{event.org.orgName}</p>

      {event.entryReq && (
        <p className="text-xs text-muted-foreground mb-3">Entry: {event.entryReq}</p>
      )}

      <div className="border-t border-border my-1 mb-4" />

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {event.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full border border-border text-xs text-foreground font-medium">
            {tag}
          </span>
        ))}
      </div>

      <button className="mt-auto w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm">
        <CalendarPlus className="h-4 w-4" />
        Add to Calendar
      </button>
    </motion.div>
  );
};

export default EventCard;
