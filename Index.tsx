import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import uwLogo from "@/assets/uw-logo.png";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import AskAI from "@/components/AskAI";
import FilterSidebar, {
  emptySidebarFilters,
  applySidebarFilters,
  type SidebarFilters,
} from "@/components/FilterSidebar";
import AdvancedSearchDialog, {
  emptyAdvancedSearch,
  applyAdvancedSearch,
  type AdvancedSearchState,
} from "@/components/AdvancedSearchDialog";
import { sampleEvents } from "@/data/events";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [advancedSearch, setAdvancedSearch] = useState<AdvancedSearchState>(emptyAdvancedSearch);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(emptySidebarFilters);

  const filteredEvents = useMemo(() => {
    let result = sampleEvents.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.rsoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    result = applyAdvancedSearch(result, advancedSearch);
    result = applySidebarFilters(result, sidebarFilters);
    return result;
  }, [searchQuery, selectedCategory, advancedSearch, sidebarFilters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] py-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(42_50%_72%/0.15),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={uwLogo} alt="University of Washington" className="h-28 md:h-32 mx-auto mb-8 brightness-0 invert mix-blend-screen" />
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-4 leading-tight">
              Discover What's Happening on Campus
            </h1>
            <p className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto font-body">
              Search RSO events, browse by category, or ask AI to find the perfect activity for your week.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SearchBar onSearch={setSearchQuery} onAdvancedSearchClick={() => setAdvancedOpen(true)} />
            <AdvancedSearchDialog
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              state={advancedSearch}
              onChange={setAdvancedSearch}
            />
          </motion.div>
        </div>
      </section>

      {/* Browse Events */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-3xl text-center text-foreground mb-8">
            This Week's Events
          </h2>
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </motion.div>

        <div className="mt-10 flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <FilterSidebar filters={sidebarFilters} onChange={setSidebarFilters} />
          </div>

          {/* Cards */}
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <p className="text-center text-muted-foreground mt-12">
                No events found. Try a different search or category.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ask-ai-section" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-display text-3xl text-center text-foreground mb-2">
          Not Sure What to Do?
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
          Ask our AI assistant to help you find the perfect event based on your interests.
        </p>
        <AskAI />
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>UW RSO Events</span>
          </div>
          <p>Connecting Huskies to campus life 🐾</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
