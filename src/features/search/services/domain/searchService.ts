export class SearchService {
  // Format duration for display
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Debounce search to avoid excessive API calls
  static debounceSearch(
    callback: (query: string) => void,
    delay: number = 300
  ): (query: string) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(query), delay);
    };
  }
}

// Export singleton instance
export const searchService = SearchService;
