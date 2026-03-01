import { useState } from "react";
import { Tag, Users, MapPin, Clock, Calendar, CircleDot, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { sampleEvents, type EventStatus } from "@/data/events";

export interface ActiveFilters {
  tags: string[];
  rsos: string[];
  locations: string[];
  times: string[];
  dates: string[];
  statuses: EventStatus[];
  mode: "and" | "not";
}

const emptyFilters: ActiveFilters = {
  tags: [],
  rsos: [],
  locations: [],
  times: [],
  dates: [],
  statuses: [],
  mode: "and",
};

// Derive unique options from sample data
const allTags = [...new Set(sampleEvents.flatMap((e) => e.tags))].sort();
const allRsos = [...new Set(sampleEvents.map((e) => e.rsoName))].sort();
const allLocations = [...new Set(sampleEvents.map((e) => e.location))].sort();
const allTimes = [...new Set(sampleEvents.map((e) => e.time))].sort();
const allDates = [...new Set(sampleEvents.map((e) => e.date))].sort();
const allStatuses: EventStatus[] = ["ongoing", "canceled", "delayed"];

interface AdvancedFiltersProps {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
}

type FilterKey = "tags" | "rsos" | "locations" | "times" | "dates" | "statuses";

const filterConfig: { key: FilterKey; label: string; icon: typeof Tag; options: string[] }[] = [
  { key: "tags", label: "Tags", icon: Tag, options: allTags },
  { key: "rsos", label: "RSOs", icon: Users, options: allRsos },
  { key: "locations", label: "Location", icon: MapPin, options: allLocations },
  { key: "times", label: "Time", icon: Clock, options: allTimes },
  { key: "dates", label: "Date", icon: Calendar, options: allDates },
  { key: "statuses", label: "Status", icon: CircleDot, options: allStatuses },
];

const statusColors: Record<EventStatus, string> = {
  ongoing: "bg-green-500",
  canceled: "bg-destructive",
  delayed: "bg-secondary",
};

const AdvancedFilters = ({ filters, onChange }: AdvancedFiltersProps) => {
  const toggleValue = (key: FilterKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const activeCount = (key: FilterKey) => (filters[key] as string[]).length;

  const totalActive =
    filters.tags.length +
    filters.rsos.length +
    filters.locations.length +
    filters.times.length +
    filters.dates.length +
    filters.statuses.length;

  const clearAll = () => onChange({ ...emptyFilters, mode: filters.mode });

  return (
    <div className="w-full max-w-2xl mx-auto mt-3 space-y-3">
      {/* Filter bubbles row */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {filterConfig.map(({ key, label, icon: Icon, options }) => (
          <Popover key={key}>
            <PopoverTrigger asChild>
              <button
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeCount(key) > 0
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {activeCount(key) > 0 && (
                  <span className="ml-0.5 bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {activeCount(key)}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="center">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                Select {label.toLowerCase()}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {options.map((opt, idx) => {
                  const selected = (filters[key] as string[]).includes(opt);
                  const selectedOptions = (filters[key] as string[]);
                  const prevSelected = idx > 0 && selectedOptions.includes(options[idx - 1]);
                  const showOr = selected && prevSelected;
                  return (
                    <div key={opt}>
                      {showOr && (
                        <div className="flex items-center gap-2 px-2 py-0.5">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">or</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <button
                        onClick={() => toggleValue(key, opt)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                          selected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {key === "statuses" && (
                          <span
                            className={`h-2 w-2 rounded-full ${statusColors[opt as EventStatus]}`}
                          />
                        )}
                        <span className="capitalize">{opt}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ))}


        {/* Clear all */}
        {totalActive > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {totalActive > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 justify-center">
          <span className="text-xs text-primary-foreground/80 font-medium mr-1">
            Active:
          </span>
          {filterConfig.map(({ key }) =>
            (filters[key] as string[]).map((val) => (
              <span
                key={`${key}-${val}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-foreground/20 text-primary-foreground"
              >
                <span className="capitalize">{val}</span>
                <button
                  onClick={() => toggleValue(key, val)}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export { emptyFilters };
export default AdvancedFilters;
