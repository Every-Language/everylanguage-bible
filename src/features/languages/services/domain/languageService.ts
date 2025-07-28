import {
  languageRepository,
  type LanguageRepositoryInterface,
} from '../data/languageRepository';
import { languageSync } from '../../../../shared/services/sync/language/LanguageSyncService';
import type {
  LanguageEntity,
  AudioVersion,
  TextVersion,
} from '../../types/entities';
import type { LanguageEntityCache } from '../../../../shared/services/database/schema';
import { logger } from '../../../../shared/utils/logger';

// Domain service errors
export class LanguageServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'LanguageServiceError';
  }
}

// Domain service interface
export interface LanguageServiceInterface {
  // Hierarchy operations with business logic
  getLanguageHierarchy(): Promise<LanguageEntity[]>;
  getLanguageHierarchyFromCache(): Promise<LanguageEntity[]>;
  hasCachedLanguageData(): Promise<boolean>;
  syncInBackground(): Promise<void>;

  // Navigation and search with business logic
  getChildLanguages(parentId: string): Promise<LanguageEntity[]>;
  searchLanguages(query: string): Promise<LanguageEntity[]>;
  getLanguagePath(languageId: string): Promise<LanguageEntity[]>;

  // Available versions with business logic
  getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;

  // Sync operations
  syncLanguageEntities(): Promise<void>;
  clearLanguageCache(): Promise<void>;
}

// Language entity validation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateLanguageEntity = (entity: any): LanguageEntity => {
  if (!entity.id || !entity.name) {
    throw new LanguageServiceError(
      'Invalid language entity: missing required fields',
      'INVALID_ENTITY',
      { entity }
    );
  }

  return {
    id: entity.id,
    name: entity.name,
    level: entity.level,
    parent_id: entity.parent_id,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    deleted_at: entity.deleted_at || null,
    children: [],
    isExpanded: false,
    hasChildren: false,
    hasAvailableVersions: entity.has_available_versions || false,
    availableVersionCounts: {
      audio: entity.audio_versions_count || 0,
      text: entity.text_versions_count || 0,
    },
    lastAvailabilityCheck: entity.last_availability_check,
  };
};

// Helper to build hierarchy from flat entities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildHierarchy = (entities: any[]): LanguageEntity[] => {
  const entityMap = new Map<string, LanguageEntity>();
  const rootEntities: LanguageEntity[] = [];

  // First pass: create all entities
  for (const entity of entities) {
    const mappedEntity = validateLanguageEntity(entity);
    mappedEntity.children = [];
    entityMap.set(entity.id, mappedEntity);
  }

  // Second pass: build hierarchy
  for (const entity of entities) {
    const mappedEntity = entityMap.get(entity.id)!;

    if (entity.parent_id) {
      const parent = entityMap.get(entity.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(mappedEntity);
        parent.hasChildren = true;
      } else {
        // Parent not found, treat as root
        rootEntities.push(mappedEntity);
      }
    } else {
      rootEntities.push(mappedEntity);
    }
  }

  return rootEntities;
};

class LanguageService implements LanguageServiceInterface {
  constructor(
    private readonly repository: LanguageRepositoryInterface = languageRepository
  ) {}

  async getLanguageHierarchy(): Promise<LanguageEntity[]> {
    try {
      // Ensure language entities are synced
      await this.syncLanguageEntities();

      // Get cached entities from repository
      const cachedEntities = await this.repository.getAllLanguageEntities();
      return buildHierarchy(cachedEntities);
    } catch (error) {
      throw new LanguageServiceError(
        'Failed to get language hierarchy',
        'GET_HIERARCHY_FAILED',
        { originalError: error }
      );
    }
  }

  async getLanguageHierarchyFromCache(): Promise<LanguageEntity[]> {
    try {
      // Get cached entities without syncing (fast)
      const cachedEntities = await this.repository.getAllLanguageEntities();
      return buildHierarchy(cachedEntities);
    } catch (error) {
      logger.error('Error getting hierarchy from cache:', error);
      return [];
    }
  }

  async hasCachedLanguageData(): Promise<boolean> {
    try {
      const count = await this.repository.getLanguageEntityCount();
      return count > 0;
    } catch (error) {
      logger.error('Error checking cached language data:', error);
      return false;
    }
  }

  async syncInBackground(): Promise<void> {
    try {
      // Check if sync is needed
      const updateCheck = await languageSync.needsUpdate();

      if (updateCheck.needsUpdate) {
        logger.info('Performing background sync');
        await languageSync.syncAll({
          syncAvailableVersions: true,
          syncUserVersions: false,
        });
      }
    } catch (error) {
      logger.warn('Background sync failed silently:', error);
      // Don't throw error for background operations
    }
  }

  async getChildLanguages(parentId: string): Promise<LanguageEntity[]> {
    try {
      const childEntities =
        await this.repository.getChildLanguageEntities(parentId);
      return childEntities.map(validateLanguageEntity);
    } catch (error) {
      throw new LanguageServiceError(
        `Failed to get child languages for parent: ${parentId}`,
        'GET_CHILDREN_FAILED',
        { parentId, originalError: error }
      );
    }
  }

  async searchLanguages(query: string): Promise<LanguageEntity[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchResults = await this.repository.searchLanguageEntities(query);
      return searchResults.map(validateLanguageEntity);
    } catch (error) {
      throw new LanguageServiceError(
        `Failed to search languages with query: ${query}`,
        'SEARCH_FAILED',
        { query, originalError: error }
      );
    }
  }

  async getLanguagePath(languageId: string): Promise<LanguageEntity[]> {
    try {
      const path: LanguageEntity[] = [];
      let currentId: string | null = languageId;

      while (currentId) {
        const entity: LanguageEntityCache | null =
          await this.repository.getLanguageEntity(currentId);
        if (!entity) break;

        path.unshift(validateLanguageEntity(entity));
        currentId = entity.parent_id;
      }

      return path;
    } catch (error) {
      throw new LanguageServiceError(
        `Failed to get language path for: ${languageId}`,
        'GET_PATH_FAILED',
        { languageId, originalError: error }
      );
    }
  }

  async getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }> {
    try {
      // Check if sync is needed first
      await this.ensureLanguageDataIsUpToDate();

      const cachedVersions =
        await this.repository.getAvailableVersions(languageEntityId);

      const audioVersions: AudioVersion[] = [];
      const textVersions: TextVersion[] = [];

      for (const version of cachedVersions) {
        const languageName = await this.getLanguageName(
          version.language_entity_id
        );

        if (version.version_type === 'audio') {
          audioVersions.push({
            id: version.version_id,
            name: version.version_name,
            languageEntityId: version.language_entity_id,
            languageName,
            mediaFileCount: version.published_content_count || 0,
            createdAt: version.created_at,
            updatedAt: version.updated_at,
          });
        } else if (version.version_type === 'text') {
          textVersions.push({
            id: version.version_id,
            name: version.version_name,
            languageEntityId: version.language_entity_id,
            languageName,
            source: 'text_version',
            verseCount: version.published_content_count || 0,
            createdAt: version.created_at,
            updatedAt: version.updated_at,
          });
        }
      }

      return {
        audio: audioVersions,
        text: textVersions,
      };
    } catch (error) {
      logger.error('Error getting available versions:', error);
      return {
        audio: [],
        text: [],
      };
    }
  }

  async syncLanguageEntities(): Promise<void> {
    try {
      // Check if sync is needed
      const updateCheck = await languageSync.needsUpdate();

      if (updateCheck.needsUpdate) {
        await languageSync.syncAll();
      }
    } catch (error) {
      throw new LanguageServiceError(
        'Failed to sync language entities',
        'SYNC_FAILED',
        { originalError: error }
      );
    }
  }

  async clearLanguageCache(): Promise<void> {
    try {
      await languageSync.clearLocalData();
    } catch (error) {
      throw new LanguageServiceError(
        'Failed to clear language cache',
        'CLEAR_CACHE_FAILED',
        { originalError: error }
      );
    }
  }

  // Private helper methods
  private async ensureLanguageDataIsUpToDate(): Promise<void> {
    // Only sync if language data is stale
    const updateCheck = await languageSync.needsUpdate();
    if (updateCheck.needsUpdate) {
      await languageSync.syncAll({
        syncAvailableVersions: true,
        syncUserVersions: false,
      });
    }
  }

  private async getLanguageName(languageEntityId: string): Promise<string> {
    try {
      const entity = await this.repository.getLanguageEntity(languageEntityId);
      return entity?.name || 'Unknown Language';
    } catch (error) {
      logger.error(
        `Error getting language name for ${languageEntityId}:`,
        error
      );
      return 'Unknown Language';
    }
  }
}

// Export singleton instance
export const languageService = new LanguageService();
export default languageService;
