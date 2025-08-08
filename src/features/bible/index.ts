// Hooks - both legacy and PowerSync versions during migration
export * from './hooks';

// Types
export * from './types';

// Navigation
export * from './navigation';

// Utilities (including migration helpers)
export * from './utils';

// Legacy service (to be deprecated)
export { bibleService } from './services/bibleService';

// New PowerSync service (preferred)
export { powerSyncBibleService } from './services/powerSyncBibleService';

// Export specific components to avoid conflicts
export { BookCard } from './components/BookCard';
export { BookGrid } from './components/BookGrid';
export { BookList } from './components/BookList';
export { ChapterCard } from './components/ChapterCard';
export { VerseCard } from './components/VerseCard';

// Export specific screens
export { BibleBooksScreen } from './screens/BibleBooksScreen';
export { BibleContainerScreen } from './screens/BibleContainerScreen';
export { ChapterScreen } from './screens/ChapterScreen';
export { VersesScreen } from './screens/VersesScreen';
