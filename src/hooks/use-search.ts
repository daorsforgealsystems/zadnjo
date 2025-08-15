import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash-es';

interface SearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

interface SearchResult<T> {
  results: T[];
  query: string;
  totalCount: number;
  hasResults: boolean;
  isSearching: boolean;
}

export const useSearch = <T extends Record<string, unknown>>({
  data,
  searchFields,
  debounceMs = 300,
  caseSensitive = false,
  exactMatch = false,
}: SearchOptions<T>): SearchResult<T> & {
  setQuery: (query: string) => void;
  clearSearch: () => void;
} => {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced query update
  const debouncedSetQuery = useMemo(
    () => debounce((newQuery: string) => {
      setDebouncedQuery(newQuery);
      setIsSearching(false);
    }, debounceMs),
    [debounceMs]
  );

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setIsSearching(true);
    debouncedSetQuery(newQuery);
  }, [debouncedSetQuery]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const searchTerm = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();

    return data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (fieldValue == null) return false;

        const stringValue = String(fieldValue);
        const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();

        if (exactMatch) {
          return searchValue === searchTerm;
        }

        return searchValue.includes(searchTerm);
      });
    });
  }, [data, debouncedQuery, searchFields, caseSensitive, exactMatch]);

  return {
    results,
    query,
    totalCount: results.length,
    hasResults: results.length > 0,
    isSearching,
    setQuery,
    clearSearch,
  };
};

// Advanced search with filters
interface FilterOptions<T> {
  filters: Record<string, (item: T) => boolean>;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
}

export const useAdvancedSearch = <T extends Record<string, unknown>>(
  searchOptions: SearchOptions<T>,
  filterOptions?: FilterOptions<T>
) => {
  const searchResult = useSearch(searchOptions);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredResults = useMemo(() => {
    let filtered = searchResult.results;

    // Apply active filters
    if (filterOptions?.filters && activeFilters.length > 0) {
      filtered = filtered.filter(item => {
        return activeFilters.every(filterKey => {
          const filterFn = filterOptions.filters[filterKey];
          return filterFn ? filterFn(item) : true;
        });
      });
    }

    // Apply sorting
    if (filterOptions?.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[filterOptions.sortBy!];
        const bValue = b[filterOptions.sortBy!];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filterOptions.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [searchResult.results, activeFilters, filterOptions]);

  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilters(prev => 
      prev.includes(filterKey)
        ? prev.filter(key => key !== filterKey)
        : [...prev, filterKey]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  return {
    ...searchResult,
    results: filteredResults,
    totalCount: filteredResults.length,
    hasResults: filteredResults.length > 0,
    activeFilters,
    toggleFilter,
    clearFilters,
    availableFilters: Object.keys(filterOptions?.filters || {}),
  };
};