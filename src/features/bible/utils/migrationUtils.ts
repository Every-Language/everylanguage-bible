import { logger } from '@/shared/utils/logger';
import { powerSyncSystem } from '@/shared/services/powersync';
import { localDataService } from '@/shared/services/database/LocalDataService';
import type { Book, Chapter, Verse } from '../types';
import type {
  PowerSyncBook,
  PowerSyncChapter,
  PowerSyncVerse,
} from '../services/powerSyncBibleService';

/**
 * Migration utilities to help transition from LocalDataService to PowerSync
 *
 * These utilities provide:
 * - Data comparison between old and new systems
 * - Migration validation
 * - Fallback mechanisms during transition
 * - Data transformation helpers
 */

// ==================== TYPE GUARDS ====================

/**
 * Check if PowerSync has the minimum required data
 */
const hasPowerSyncBibleData = async (): Promise<boolean> => {
  try {
    if (!powerSyncSystem.isInitialized) {
      return false;
    }

    const booksCount = await powerSyncSystem.get(
      'SELECT COUNT(*) as count FROM books'
    );
    const chaptersCount = await powerSyncSystem.get(
      'SELECT COUNT(*) as count FROM chapters'
    );
    const versesCount = await powerSyncSystem.get(
      'SELECT COUNT(*) as count FROM verses'
    );

    const hasMinimumData =
      (booksCount?.count || 0) > 0 &&
      (chaptersCount?.count || 0) > 0 &&
      (versesCount?.count || 0) > 0;

    logger.debug('PowerSync Bible data check:', {
      books: booksCount?.count || 0,
      chapters: chaptersCount?.count || 0,
      verses: versesCount?.count || 0,
      hasMinimumData,
    });

    return hasMinimumData;
  } catch (error) {
    logger.error('Failed to check PowerSync Bible data:', error);
    return false;
  }
};

/**
 * Check if LocalDataService has data
 */
const hasLocalBibleData = async (): Promise<boolean> => {
  try {
    const books = await localDataService.getBooksForUI();
    const hasData = books.length > 0;

    logger.debug('Local Bible data check:', {
      books: books.length,
      hasData,
    });

    return hasData;
  } catch (error) {
    logger.error('Failed to check local Bible data:', error);
    return false;
  }
};

// ==================== DATA TRANSFORMATION ====================

/**
 * Transform legacy Book type to PowerSync format
 * (In case there are any structural differences)
 */
const transformLegacyBookToPowerSync = (legacyBook: Book): PowerSyncBook => {
  return {
    id: legacyBook.id,
    name: legacyBook.name,
    book_number: legacyBook.book_number,
    bible_version_id: legacyBook.bible_version_id,
    created_at: legacyBook.created_at,
    updated_at: legacyBook.updated_at,
    global_order: legacyBook.global_order,
    testament: legacyBook.testament,
  };
};

/**
 * Transform legacy Chapter type to PowerSync format
 */
const transformLegacyChapterToPowerSync = (
  legacyChapter: Chapter
): PowerSyncChapter => {
  return {
    id: legacyChapter.id,
    chapter_number: legacyChapter.chapter_number,
    book_id: legacyChapter.book_id,
    total_verses: legacyChapter.total_verses,
    created_at: legacyChapter.created_at,
    updated_at: legacyChapter.updated_at,
    global_order: legacyChapter.global_order,
  };
};

/**
 * Transform legacy Verse type to PowerSync format
 */
const transformLegacyVerseToPowerSync = (
  legacyVerse: Verse
): PowerSyncVerse => {
  return {
    id: legacyVerse.id,
    chapter_id: legacyVerse.chapter_id,
    verse_number: legacyVerse.verse_number,
    created_at: legacyVerse.created_at,
    updated_at: legacyVerse.updated_at,
    global_order: legacyVerse.global_order,
  };
};

// ==================== DATA COMPARISON ====================

/**
 * Compare data counts between PowerSync and LocalDataService
 */
const compareDataCounts = async (): Promise<{
  powerSync: {
    books: number;
    chapters: number;
    verses: number;
  };
  local: {
    books: number;
    chapters: number;
    verses: number;
  };
  differences: {
    books: number;
    chapters: number;
    verses: number;
  };
}> => {
  try {
    // Get PowerSync counts
    const [powerSyncBooks, powerSyncChapters, powerSyncVerses] =
      await Promise.all([
        powerSyncSystem.get('SELECT COUNT(*) as count FROM books'),
        powerSyncSystem.get('SELECT COUNT(*) as count FROM chapters'),
        powerSyncSystem.get('SELECT COUNT(*) as count FROM verses'),
      ]);

    // Get Local counts
    const [localBooks, localChapters, localVerses] = await Promise.all([
      localDataService.getBooksCount(),
      localDataService.getChaptersCount(),
      localDataService.getVersesCount(),
    ]);

    const powerSyncData = {
      books: powerSyncBooks?.count || 0,
      chapters: powerSyncChapters?.count || 0,
      verses: powerSyncVerses?.count || 0,
    };

    const localData = {
      books: localBooks,
      chapters: localChapters,
      verses: localVerses,
    };

    const differences = {
      books: powerSyncData.books - localData.books,
      chapters: powerSyncData.chapters - localData.chapters,
      verses: powerSyncData.verses - localData.verses,
    };

    logger.info('Data comparison completed:', {
      powerSync: powerSyncData,
      local: localData,
      differences,
    });

    return {
      powerSync: powerSyncData,
      local: localData,
      differences,
    };
  } catch (error) {
    logger.error('Failed to compare data counts:', error);
    throw error;
  }
};

// ==================== MIGRATION VALIDATION ====================

/**
 * Validate that PowerSync has sufficient data for migration
 */
const validateMigrationReadiness = async (): Promise<{
  isReady: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check PowerSync initialization
    if (!powerSyncSystem.isInitialized) {
      issues.push('PowerSync is not initialized');
      recommendations.push('Wait for PowerSync initialization to complete');
    }

    // Check PowerSync connection
    if (!powerSyncSystem.isConnected) {
      issues.push('PowerSync is not connected');
      recommendations.push(
        'Ensure network connectivity and check sync credentials'
      );
    }

    // Check if PowerSync has data
    const hasPowerSyncData = await hasPowerSyncBibleData();
    if (!hasPowerSyncData) {
      issues.push('PowerSync does not have sufficient Bible data');
      recommendations.push(
        'Wait for initial sync to complete or check sync rules'
      );
    }

    // Compare data counts if both systems have data
    if (hasPowerSyncData) {
      const comparison = await compareDataCounts();

      if (comparison.differences.books < -10) {
        issues.push(
          `PowerSync has ${Math.abs(comparison.differences.books)} fewer books than local database`
        );
        recommendations.push('Wait for more data to sync or check sync rules');
      }

      if (comparison.differences.verses < -1000) {
        issues.push(
          `PowerSync has ${Math.abs(comparison.differences.verses)} fewer verses than local database`
        );
        recommendations.push('Wait for more verse data to sync');
      }
    }

    const isReady = issues.length === 0;

    logger.info('Migration readiness validation:', {
      isReady,
      issues,
      recommendations,
    });

    return {
      isReady,
      issues,
      recommendations,
    };
  } catch (error) {
    logger.error('Failed to validate migration readiness:', error);
    issues.push('Failed to validate migration readiness');
    recommendations.push('Check system health and try again');

    return {
      isReady: false,
      issues,
      recommendations,
    };
  }
};

// ==================== MIGRATION STATUS ====================

/**
 * Migration configuration and status
 */
interface MigrationConfig {
  usePowerSyncForBooks: boolean;
  usePowerSyncForChapters: boolean;
  usePowerSyncForVerses: boolean;
  usePowerSyncForTextVersions: boolean;
  fallbackToLocal: boolean;
  validateDataConsistency: boolean;
}

/**
 * Default migration configuration (gradual migration)
 */
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  usePowerSyncForBooks: true,
  usePowerSyncForChapters: true,
  usePowerSyncForVerses: true,
  usePowerSyncForTextVersions: true,
  fallbackToLocal: true,
  validateDataConsistency: false, // Disable in production for performance
};

/**
 * Get current migration status
 */
const getMigrationStatus = async (): Promise<{
  config: MigrationConfig;
  readiness: Awaited<ReturnType<typeof validateMigrationReadiness>>;
  dataComparison: Awaited<ReturnType<typeof compareDataCounts>> | null;
}> => {
  const readiness = await validateMigrationReadiness();
  let dataComparison = null;

  try {
    if (readiness.isReady) {
      dataComparison = await compareDataCounts();
    }
  } catch (error) {
    logger.warn('Failed to get data comparison in migration status:', error);
  }

  return {
    config: DEFAULT_MIGRATION_CONFIG,
    readiness,
    dataComparison,
  };
};

// ==================== FALLBACK UTILITIES ====================

/**
 * Generic fallback function that tries PowerSync first, then falls back to LocalDataService
 */
const withFallback = async <T>(
  powerSyncFn: () => Promise<T>,
  localFn: () => Promise<T>,
  operation: string
): Promise<T> => {
  try {
    // Try PowerSync first
    const result = await powerSyncFn();
    logger.debug(`Migration: ${operation} succeeded with PowerSync`);
    return result;
  } catch (powerSyncError) {
    logger.warn(
      `Migration: ${operation} failed with PowerSync, falling back to local:`,
      powerSyncError
    );

    try {
      const result = await localFn();
      logger.debug(`Migration: ${operation} succeeded with fallback to local`);
      return result;
    } catch (localError) {
      logger.error(
        `Migration: ${operation} failed with both PowerSync and local:`,
        {
          powerSyncError,
          localError,
        }
      );
      throw new Error(
        `${operation} failed: PowerSync (${powerSyncError}), Local (${localError})`
      );
    }
  }
};

// ==================== EXPORTS ====================

export {
  // Data checks
  hasPowerSyncBibleData,
  hasLocalBibleData,

  // Data transformation
  transformLegacyBookToPowerSync,
  transformLegacyChapterToPowerSync,
  transformLegacyVerseToPowerSync,

  // Data comparison
  compareDataCounts,

  // Migration validation
  validateMigrationReadiness,
  getMigrationStatus,
  DEFAULT_MIGRATION_CONFIG,

  // Fallback utilities
  withFallback,
};

export type { MigrationConfig };
