import { useState } from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sampleEvents } from "@/data/events";
import type { Event } from "@/data/events";

// --- Types ---

type FieldKey = "rsoName" | "title" | "location" | "date" | "time" | "tags" | "status" | "access";
type Operator = "contains" | "not_contains" | "equals" | "not_equals" | "starts_with" | "ends_with";
type GroupLogic = "and" | "or";

interface Condition {
  id: string;
  field: FieldKey;
  operator: Operator;
  value: string;
}

interface ConditionGroup {
  id: string;
  logic: GroupLogic;
  conditions: Condition[];
}

export interface AdvancedSearchState {
  groupLogic: GroupLogic;
  groups: ConditionGroup[];
}

const fieldOptions: { value: FieldKey; label: string }[] = [
  { value: "rsoName", label: "RSO" },
  { value: "title", label: "Event Title" },
  { value: "location", label: "Location" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "tags", label: "Tags" },
  { value: "status", label: "Status" },
  { value: "access", label: "Access" },
];

const operatorOptions: { value: Operator; label: string }[] = [
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
];

// Derive unique values per field for suggestions
const fieldValues: Record<FieldKey, string[]> = {
  rsoName: [...new Set(sampleEvents.map((e) => e.rsoName))].sort(),
  title: [...new Set(sampleEvents.map((e) => e.title))].sort(),
  location: [...new Set(sampleEvents.map((e) => e.location))].sort(),
  date: [...new Set(sampleEvents.map((e) => e.date))].sort(),
  time: [...new Set(sampleEvents.map((e) => e.time))].sort(),
  tags: [...new Set(sampleEvents.flatMap((e) => e.tags))].sort(),
  status: ["ongoing", "canceled", "delayed"],
  access: ["open", "members"],
};

let idCounter = 0;
const uid = () => `adv-${++idCounter}`;

const makeCondition = (): Condition => ({
  id: uid(),
  field: "rsoName",
  operator: "contains",
  value: "",
});

const makeGroup = (): ConditionGroup => ({
  id: uid(),
  logic: "and",
  conditions: [makeCondition()],
});

export const emptyAdvancedSearch: AdvancedSearchState = {
  groupLogic: "and",
  groups: [makeGroup()],
};

// --- Filtering logic ---

function matchCondition(event: Event, c: Condition): boolean {
  const rawValue =
    c.field === "tags" ? event.tags.join(" ") : String(event[c.field]);
  const val = rawValue.toLowerCase();
  const target = c.value.toLowerCase().trim();
  if (!target) return true; // empty value matches all
  switch (c.operator) {
    case "contains":
      return val.includes(target);
    case "not_contains":
      return !val.includes(target);
    case "equals":
      return c.field === "tags"
        ? event.tags.some((t) => t.toLowerCase() === target)
        : val === target;
    case "not_equals":
      return c.field === "tags"
        ? !event.tags.some((t) => t.toLowerCase() === target)
        : val !== target;
    case "starts_with":
      return val.startsWith(target);
    case "ends_with":
      return val.endsWith(target);
    default:
      return true;
  }
}

function matchGroup(event: Event, group: ConditionGroup): boolean {
  if (group.conditions.length === 0) return true;
  return group.logic === "and"
    ? group.conditions.every((c) => matchCondition(event, c))
    : group.conditions.some((c) => matchCondition(event, c));
}

export function applyAdvancedSearch(
  events: Event[],
  state: AdvancedSearchState
): Event[] {
  if (state.groups.length === 0) return events;
  return events.filter((event) =>
    state.groupLogic === "and"
      ? state.groups.every((g) => matchGroup(event, g))
      : state.groups.some((g) => matchGroup(event, g))
  );
}

// --- Component ---

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AdvancedSearchState;
  onChange: (state: AdvancedSearchState) => void;
}

const AdvancedSearchDialog = ({ open, onOpenChange, state, onChange }: Props) => {
  const updateGroup = (groupId: string, patch: Partial<ConditionGroup>) => {
    onChange({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...patch } : g
      ),
    });
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    patch: Partial<Condition>
  ) => {
    onChange({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...patch } : c
              ),
            }
          : g
      ),
    });
  };

  const addCondition = (groupId: string) => {
    onChange({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, makeCondition()] }
          : g
      ),
    });
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    onChange({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
          : g
      ),
    });
  };

  const addGroup = () => {
    onChange({ ...state, groups: [...state.groups, makeGroup()] });
  };

  const removeGroup = (groupId: string) => {
    onChange({
      ...state,
      groups: state.groups.filter((g) => g.id !== groupId),
    });
  };

  const clearAll = () => {
    onChange({ groupLogic: "and", groups: [makeGroup()] });
  };

  const hasValues = state.groups.some((g) =>
    g.conditions.some((c) => c.value.trim() !== "")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Advanced Search
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Build complex queries using groups. Each group contains
                    conditions combined with AND or OR. Groups themselves are
                    combined with the top-level logic.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Filter events using custom conditions and groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Top-level group logic */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Combine groups with:
            </span>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => onChange({ ...state, groupLogic: "and" })}
                className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                  state.groupLogic === "and"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                AND
              </button>
              <button
                onClick={() => onChange({ ...state, groupLogic: "or" })}
                className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                  state.groupLogic === "or"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                OR
              </button>
            </div>
          </div>

          {/* Groups */}
          {state.groups.map((group, gi) => (
            <div key={group.id}>
              {gi > 0 && (
                <div className="flex justify-center py-2">
                  <span className="px-3 py-1 rounded-full border border-border text-xs font-semibold text-muted-foreground uppercase">
                    {state.groupLogic}
                  </span>
                </div>
              )}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                {/* Group header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Group {gi + 1}:
                    </span>
                    <div className="inline-flex rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => updateGroup(group.id, { logic: "and" })}
                        className={`px-3 py-1 text-xs font-semibold transition-colors ${
                          group.logic === "and"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        AND
                      </button>
                      <button
                        onClick={() => updateGroup(group.id, { logic: "or" })}
                        className={`px-3 py-1 text-xs font-semibold transition-colors ${
                          group.logic === "or"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        OR
                      </button>
                    </div>
                  </div>
                  {state.groups.length > 1 && (
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Conditions */}
                {group.conditions.map((cond, ci) => (
                  <div key={cond.id}>
                    {ci > 0 && (
                      <div className="flex items-center gap-2 px-1 py-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.logic}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {/* Field */}
                      <Select
                        value={cond.field}
                        onValueChange={(v) =>
                          updateCondition(group.id, cond.id, {
                            field: v as FieldKey,
                            value: "",
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator */}
                      <Select
                        value={cond.operator}
                        onValueChange={(v) =>
                          updateCondition(group.id, cond.id, {
                            operator: v as Operator,
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value — use select for fields with few known values */}
                      {["status", "access"].includes(cond.field) ? (
                        <Select
                          value={cond.value || undefined}
                          onValueChange={(v) =>
                            updateCondition(group.id, cond.id, { value: v })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select value..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldValues[cond.field].map((v) => (
                              <SelectItem key={v} value={v}>
                                <span className="capitalize">{v}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Enter value..."
                          value={cond.value}
                          onChange={(e) =>
                            updateCondition(group.id, cond.id, {
                              value: e.target.value,
                            })
                          }
                          className="flex-1"
                          list={`datalist-${cond.id}`}
                        />
                      )}

                      {/* Remove condition */}
                      {group.conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(group.id, cond.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add condition */}
                <button
                  onClick={() => addCondition(group.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors pt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Condition
                </button>
              </div>
            </div>
          ))}

          {/* Add group */}
          <button
            onClick={addGroup}
            className="w-full py-3 rounded-lg border-2 border-dashed border-border text-sm font-medium text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </button>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={clearAll} className="text-muted-foreground">
            Clear All
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedSearchDialog;
