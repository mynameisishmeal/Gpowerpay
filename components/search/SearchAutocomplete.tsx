import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchSuggestion {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchAutocomplete Component
 * Real-time search with autocomplete suggestions
 */
export function SearchAutocomplete({
  onSearch,
  placeholder = 'Search products...',
  className = '',
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}&autocomplete=true&limit=5`
        );
        const data = await response.json();

        if (data.success) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setShowSuggestions(false);

    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    saveRecentSearch(suggestion.name);
    setShowSuggestions(false);
    setQuery('');
    router.push(`/products/${suggestion.slug}`);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base"
        />
        
        {/* Clear/Loading Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={20} className="text-gray-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length >= 2 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Autocomplete Results */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                Products
              </p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion._id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  {suggestion.image ? (
                    <Image
                      src={suggestion.image}
                      alt={suggestion.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <Search size={16} className="text-gray-400" />
                    </div>
                  )}
                  <span className="flex-1 text-sm text-gray-900 truncate">
                    {suggestion.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && !loading && suggestions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">No products found for "{query}"</p>
            </div>
          )}

          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Recent Searches
                </p>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recent, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleRecentSearchClick(recent)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <TrendingUp size={16} className="text-gray-400" />
                  <span className="flex-1 text-sm text-gray-900">{recent}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
