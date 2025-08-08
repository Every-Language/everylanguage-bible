import { useState, useCallback, useEffect } from 'react';
import { LanguageSearchResult } from '../services/fuzzySearchService';
import { languageSearchService } from '../services/languageSearchService';

export interface UseLanguageSearchReturn {
  // State
  isSearching: boolean;
  availableResults: LanguageSearchResult[];
  unavailableResults: LanguageSearchResult[];
  error: string | null;

  // Actions
  searchAudioVersions: (query: string) => () => void;
  searchTextVersions: (query: string) => () => void;
  searchLanguages: (query: string) => () => void;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Hook for debounced language search with proper cleanup
 */
export const useLanguageSearch = (): UseLanguageSearchReturn => {
  const [isSearching, setIsSearching] = useState(false);
  const [availableResults, setAvailableResults] = useState<
    LanguageSearchResult[]
  >([]);
  const [unavailableResults, setUnavailableResults] = useState<
    LanguageSearchResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Search for audio versions
  const searchAudioVersions = useCallback((query: string): (() => void) => {
    return languageSearchService.searchAudioVersions(
      query,
      results => {
        setAvailableResults(results.available);
        setUnavailableResults(results.unavailable);
        setError(null);
      },
      errorMessage => {
        setError(errorMessage);
        setAvailableResults([]);
        setUnavailableResults([]);
      },
      setIsSearching
    );
  }, []);

  // Search for text versions
  const searchTextVersions = useCallback((query: string): (() => void) => {
    return languageSearchService.searchTextVersions(
      query,
      results => {
        setAvailableResults(results.available);
        setUnavailableResults(results.unavailable);
        setError(null);
      },
      errorMessage => {
        setError(errorMessage);
        setAvailableResults([]);
        setUnavailableResults([]);
      },
      setIsSearching
    );
  }, []);

  // Search for languages (both audio and text)
  const searchLanguages = useCallback((query: string): (() => void) => {
    return languageSearchService.searchLanguages(
      query,
      results => {
        setAvailableResults(results.available);
        setUnavailableResults(results.unavailable);
        setError(null);
      },
      errorMessage => {
        setError(errorMessage);
        setAvailableResults([]);
        setUnavailableResults([]);
      },
      setIsSearching
    );
  }, []);

  // Clear search results
  const clearResults = useCallback(() => {
    setAvailableResults([]);
    setUnavailableResults([]);
    setError(null);
    setIsSearching(false);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      languageSearchService.clearAll();
    };
  }, []);

  return {
    // State
    isSearching,
    availableResults,
    unavailableResults,
    error,

    // Actions
    searchAudioVersions,
    searchTextVersions,
    searchLanguages,
    clearResults,
    clearError,
  };
};
