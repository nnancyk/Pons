import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  onAdvancedSearchClick?: () => void;
}

const SearchBar = ({ onSearch, placeholder = "Search events...", onAdvancedSearchClick }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const scrollToAI = () => {
    const aiSection = document.getElementById("ask-ai-section");
    if (aiSection) {
      aiSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-[var(--shadow-card)] text-base font-body"
          />
        </div>
      </form>
      {onAdvancedSearchClick && (
        <div className="flex items-center justify-center gap-5 mt-4">
          <button
            onClick={onAdvancedSearchClick}
            className="text-lg font-bold text-accent hover:text-accent/80 transition-colors"
          >
            Advanced Search
          </button>
          <span className="text-accent/50 text-lg">|</span>
          <button
            onClick={scrollToAI}
            className="flex items-center gap-1.5 text-lg font-bold text-accent hover:text-accent/80 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            AI Search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
