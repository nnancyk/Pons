import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { Event } from "@/data/events";
import { getLocationString } from "@/data/events";

const statusOptions = [
  { value: "confirmed", label: "Confirmed" },
  { value: "canceled", label: "Cancelled" },
  { value: "pending", label: "Pending" },
];

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

function eventHour(e: Event): number {
  if (!e.eventStart) return 12;
  const timePart = e.eventStart.split("T")[1] || "";
  return parseInt(timePart.split(":")[0]) || 12;
}

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
  statuses: string[];
  timeFrom: number;
  timeTo: number;
}

export const emptySidebarFilters: SidebarFilters = {
  rsos: [],
  tags: [],
  locations: [],
  eventTypes: [],
  statuses: [],
  timeFrom: 0,
  timeTo: 24,
};

export function applySidebarFilters(events: Event[], f: SidebarFilters): Event[] {
  return events.filter((e) => {
    if (f.rsos.length && !f.rsos.includes(e.org.orgName)) return false;
    if (f.tags.length && !f.tags.some((t) => e.tags.includes(t))) return false;
    if (f.locations.length && !f.locations.includes(getLocationString(e))) return false;
    if (f.eventTypes.length && !f.eventTypes.includes(e.eventType)) return false;
    if (f.statuses.length && !f.statuses.includes(e.status)) return false;
    const hour = eventHour(e);
    if (hour < f.timeFrom || hour > f.timeTo) return false;
    return true;
  });
}

interface Props {
  events: Event[];
  filters: SidebarFilters;
  onChange: (filters: SidebarFilters) => void;
}

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

const FilterSidebar = ({ events, filters, onChange }: Props) => {
  const [search, setSearch] = useState("");

  const allRSOs = useMemo(() => [...new Set(events.map((e) => e.org.orgName))].sort(), [events]);
  const allTags = useMemo(() => [...new Set(events.flatMap((e) => e.tags))].sort(), [events]);
  const allLocations = useMemo(() => [...new Set(events.map(getLocationString))].sort(), [events]);
  const allTypes = useMemo(() => [...new Set(events.map((e) => e.eventType).filter(Boolean))].sort(), [events]);

  const rsoCounts = useMemo(() => countBy(events, (e) => e.org.orgName), [events]);
  const tagCounts = useMemo(() => countBy(events, (e) => e.tags), [events]);
  const locationCounts = useMemo(() => countBy(events, (e) => getLocationString(e)), [events]);
  const typeCounts = useMemo(() => countBy(events, (e) => e.eventType), [events]);
  const statusCounts = useMemo(() => countBy(events, (e) => e.status), [events]);

  const toggle = (
    key: keyof Pick<SidebarFilters, "rsos" | "tags" | "locations" | "eventTypes" | "statuses">,
    value: string
  ) => {
    const arr = filters[key];
    onChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  };

  const clearAll = () => onChange(emptySidebarFilters);
  const matchSearch = (label: string) => !search || label.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)] sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-sm font-semibold text-primary hover:text-primary/80">
          Clear All
        </Button>
      </div>

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
        <Section title="RSO">
          {allRSOs.filter(matchSearch).map((rso) => (
            <CheckOption key={rso} label={rso} count={rsoCounts[rso]} checked={filters.rsos.includes(rso)} onCheckedChange={() => toggle("rsos", rso)} />
          ))}
        </Section>

        <Section title="Tags">
          {allTags.filter(matchSearch).map((tag) => (
            <CheckOption key={tag} label={tag} count={tagCounts[tag]} checked={filters.tags.includes(tag)} onCheckedChange={() => toggle("tags", tag)} />
          ))}
        </Section>

        <Section title="Location">
          {allLocations.filter(matchSearch).map((loc) => (
            <CheckOption key={loc} label={loc} count={locationCounts[loc]} checked={filters.locations.includes(loc)} onCheckedChange={() => toggle("locations", loc)} />
          ))}
        </Section>

        <Section title="Event Type">
          {allTypes.filter(matchSearch).map((type) => (
            <CheckOption key={type} label={type} count={typeCounts[type] || 0} checked={filters.eventTypes.includes(type)} onCheckedChange={() => toggle("eventTypes", type)} />
          ))}
        </Section>

        <Section title="Time">
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>From:</span>
                <span className="font-medium text-foreground">{hourToLabel(filters.timeFrom)}</span>
              </div>
              <Slider value={[filters.timeFrom]} onValueChange={([v]) => onChange({ ...filters, timeFrom: Math.min(v, filters.timeTo) })} min={0} max={24} step={1} />
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>To:</span>
                <span className="font-medium text-foreground">{hourToLabel(filters.timeTo)}</span>
              </div>
              <Slider value={[filters.timeTo]} onValueChange={([v]) => onChange({ ...filters, timeTo: Math.max(v, filters.timeFrom) })} min={0} max={24} step={1} />
            </div>
          </div>
        </Section>

        <Section title="Status">
          {statusOptions.filter((o) => matchSearch(o.label)).map((opt) => (
            <CheckOption key={opt.value} label={opt.label} count={statusCounts[opt.value] || 0} checked={filters.statuses.includes(opt.value)} onCheckedChange={() => toggle("statuses", opt.value)} />
          ))}
        </Section>
      </div>
    </div>
  );
};

export default FilterSidebar;
