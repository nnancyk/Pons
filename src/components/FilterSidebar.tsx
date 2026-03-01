import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { sampleEvents } from "@/data/events";
import { categories } from "@/data/events";

// Derive unique values from events
const allRSOs = [...new Set(sampleEvents.map((e) => e.rsoName))].sort();
const allTags = [...new Set(sampleEvents.flatMap((e) => e.tags))].sort();
const allLocations = [...new Set(sampleEvents.map((e) => e.location))].sort();
const eventTypes = categories.filter((c) => c !== "All");
const accessOptions = [
  { value: "open", label: "Open to All" },
  { value: "members", label: "Members Only" },
];
const statusOptions = [
  { value: "ongoing", label: "Ongoing" },
  { value: "delayed", label: "Delayed" },
  { value: "canceled", label: "Cancelled" },
];

// Count occurrences
function countBy<T>(arr: T[], key: (item: T) => string | string[]) {
  const counts: Record<string, number> = {};
  arr.forEach((item) => {
    const val = key(item);
    if (Array.isArray(val)) {
      val.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    } else {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return counts;
}

const rsoCounts = countBy(sampleEvents, (e) => e.rsoName);
const tagCounts = countBy(sampleEvents, (e) => e.tags);
const locationCounts = countBy(sampleEvents, (e) => e.location);
const categoryCounts = countBy(sampleEvents, (e) => e.category);
const accessCounts = countBy(sampleEvents, (e) => e.access);
const statusCounts = countBy(sampleEvents, (e) => e.status);

// Time helpers
const timeToHour = (t: string): number => {
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 12;
  let h = parseInt(match[1]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
};

const hourToLabel = (h: number): string => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

export interface SidebarFilters {
  rsos: string[];
  tags: string[];
  locations: string[];
  eventTypes: string[];
  access: string[];
  timeFrom: number;
  timeTo: number;
  statuses: string[];
}

export const emptySidebarFilters: SidebarFilters = {
  rsos: [],
  tags: [],
  locations: [],
  eventTypes: [],
  access: [],
  timeFrom: 0,
  timeTo: 24,
  statuses: [],
};

export function applySidebarFilters(
  events: typeof sampleEvents,
  f: SidebarFilters
) {
  return events.filter((e) => {
    if (f.rsos.length && !f.rsos.includes(e.rsoName)) return false;
    if (f.tags.length && !f.tags.some((t) => e.tags.includes(t))) return false;
    if (f.locations.length && !f.locations.includes(e.location)) return false;
    if (f.eventTypes.length && !f.eventTypes.includes(e.category)) return false;
    if (f.access.length && !f.access.includes(e.access)) return false;
    if (f.statuses.length && !f.statuses.includes(e.status)) return false;
    const hour = timeToHour(e.time);
    if (hour < f.timeFrom || hour > f.timeTo) return false;
    return true;
  });
}

interface Props {
  filters: SidebarFilters;
  onChange: (filters: SidebarFilters) => void;
}

// Collapsible section
const Section = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const CheckOption = ({
  label,
  count,
  checked,
  onCheckedChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <span className="text-sm text-foreground capitalize">{label}</span>
    </div>
    {count !== undefined && (
      <span className="text-xs text-muted-foreground">({count})</span>
    )}
  </label>
);

const FilterSidebar = ({ filters, onChange }: Props) => {
  const [search, setSearch] = useState("");

  const toggle = (
    key: keyof Pick<SidebarFilters, "rsos" | "tags" | "locations" | "eventTypes" | "access" | "statuses">,
    value: string
  ) => {
    const arr = filters[key];
    onChange({
      ...filters,
      [key]: arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value],
    });
  };

  const clearAll = () => onChange(emptySidebarFilters);

  // Filter section items by search
  const matchSearch = (label: string) =>
    !search || label.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)] sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-foreground">Filters</h3>
        <button
          onClick={clearAll}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search filters..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-0 pr-1">
        {/* RSO */}
        <Section title="RSO">
          {allRSOs.filter(matchSearch).map((rso) => (
            <CheckOption
              key={rso}
              label={rso}
              count={rsoCounts[rso]}
              checked={filters.rsos.includes(rso)}
              onCheckedChange={() => toggle("rsos", rso)}
            />
          ))}
        </Section>

        {/* Tags */}
        <Section title="Tags">
          {allTags.filter(matchSearch).map((tag) => (
            <CheckOption
              key={tag}
              label={tag}
              count={tagCounts[tag]}
              checked={filters.tags.includes(tag)}
              onCheckedChange={() => toggle("tags", tag)}
            />
          ))}
        </Section>

        {/* Location */}
        <Section title="Location">
          {allLocations.filter(matchSearch).map((loc) => (
            <CheckOption
              key={loc}
              label={loc}
              count={locationCounts[loc]}
              checked={filters.locations.includes(loc)}
              onCheckedChange={() => toggle("locations", loc)}
            />
          ))}
        </Section>

        {/* Event Type */}
        <Section title="Event Type">
          {eventTypes.filter(matchSearch).map((cat) => (
            <CheckOption
              key={cat}
              label={cat}
              count={categoryCounts[cat] || 0}
              checked={filters.eventTypes.includes(cat)}
              onCheckedChange={() => toggle("eventTypes", cat)}
            />
          ))}
        </Section>

        {/* Entry Requirements */}
        <Section title="Entry Requirements">
          {accessOptions.filter((o) => matchSearch(o.label)).map((opt) => (
            <CheckOption
              key={opt.value}
              label={opt.label}
              count={accessCounts[opt.value] || 0}
              checked={filters.access.includes(opt.value)}
              onCheckedChange={() => toggle("access", opt.value)}
            />
          ))}
        </Section>

        {/* Time */}
        <Section title="Time">
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>From:</span>
                <span className="font-medium text-foreground">
                  {hourToLabel(filters.timeFrom)}
                </span>
              </div>
              <Slider
                value={[filters.timeFrom]}
                onValueChange={([v]) =>
                  onChange({ ...filters, timeFrom: Math.min(v, filters.timeTo) })
                }
                min={0}
                max={24}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>To:</span>
                <span className="font-medium text-foreground">
                  {hourToLabel(filters.timeTo)}
                </span>
              </div>
              <Slider
                value={[filters.timeTo]}
                onValueChange={([v]) =>
                  onChange({ ...filters, timeTo: Math.max(v, filters.timeFrom) })
                }
                min={0}
                max={24}
                step={1}
              />
            </div>
          </div>
        </Section>

        {/* Status */}
        <Section title="Status">
          {statusOptions.filter((o) => matchSearch(o.label)).map((opt) => (
            <CheckOption
              key={opt.value}
              label={opt.label}
              count={statusCounts[opt.value] || 0}
              checked={filters.statuses.includes(opt.value)}
              onCheckedChange={() => toggle("statuses", opt.value)}
            />
          ))}
        </Section>
      </div>
    </div>
  );
};

export default FilterSidebar;
