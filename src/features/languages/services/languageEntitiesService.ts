import DatabaseManager from '../../../shared/services/database/DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import { languageSync } from '../../../shared/services/sync';
import {
  LanguageEntityCache,
  AvailableVersionCache,
} from '../../../shared/services/database/schema';
import { LanguageEntity, AudioVersion, TextVersion } from '../types';

export interface LanguageEntitiesServiceInterface {
  // Fetch the complete language hierarchy
  fetchLanguageHierarchy(): Promise<LanguageEntity[]>;

  // Get direct children of a language entity
  getChildLanguages(parentId: string): Promise<LanguageEntity[]>;

  // Search languages by name (fuzzy search)
  searchLanguages(query: string): Promise<LanguageEntity[]>;

  // Get language path from root to specific language
  getLanguagePath(languageId: string): Promise<LanguageEntity[]>;

  // Get available versions for a language
  getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;

  // Cache management
  syncLanguageEntities(): Promise<void>;
  clearLanguageCache(): Promise<void>;
}

class LanguageEntitiesService implements LanguageEntitiesServiceInterface {
  /**
   * Fetch the complete language hierarchy using the sync service
   */
  async fetchLanguageHierarchy(): Promise<LanguageEntity[]> {
    try {
      // Ensure language entities are synced
      await this.syncLanguageEntities();

      // Get cached entities from local database
      const cachedEntities = await this.getCachedLanguageEntities();
      return this.buildHierarchy(cachedEntities);
    } catch (error) {
      console.error('Error in fetchLanguageHierarchy:', error);
      throw error;
    }
  }

  /**
   * Get direct children of a specific language entity
   */
  async getChildLanguages(parentId: string): Promise<LanguageEntity[]> {
    try {
      const result = await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache WHERE parent_id = ? ORDER BY name',
        [parentId]
      );

      return result.map(this.mapCacheToEntity);
    } catch (error) {
      console.error('Error getting child languages:', error);
      throw error;
    }
  }

  /**
   * Search languages by name using fuzzy search
   */
  async searchLanguages(query: string): Promise<LanguageEntity[]> {
    try {
      const searchPattern = `%${query.toLowerCase()}%`;

      const result = await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache WHERE LOWER(name) LIKE ? ORDER BY name LIMIT 50',
        [searchPattern]
      );

      return result.map(this.mapCacheToEntity);
    } catch (error) {
      console.error('Error searching languages:', error);
      throw error;
    }
  }

  /**
   * Get language path from root to specific language (breadcrumb trail)
   */
  async getLanguagePath(languageId: string): Promise<LanguageEntity[]> {
    try {
      const path: LanguageEntity[] = [];
      let currentId: string | null = languageId;

      while (currentId) {
        const result = await databaseManager.executeQuery<LanguageEntityCache>(
          'SELECT * FROM language_entities_cache WHERE id = ? LIMIT 1',
          [currentId]
        );

        if (!result || result.length === 0) break;

        const entity = result[0];
        if (!entity) break;

        path.unshift(this.mapCacheToEntity(entity));
        currentId = entity.parent_id || null;
      }

      return path;
    } catch (error) {
      console.error('Error getting language path:', error);
      throw error;
    }
  }

  /**
   * Get available versions for a language entity
   */
  async getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }> {
    try {
      // Ensure available versions are synced
      await languageSync.syncAll({
        syncAvailableVersions: true,
        syncUserVersions: false,
      });

      // Get available versions from cache
      const result = await databaseManager.executeQuery<AvailableVersionCache>(
        'SELECT * FROM available_versions_cache WHERE language_entity_id = ? ORDER BY version_name',
        [languageEntityId]
      );

      const audioVersions: AudioVersion[] = [];
      const textVersions: TextVersion[] = [];

      // Get language name
      const languageResult =
        await databaseManager.executeQuery<LanguageEntityCache>(
          'SELECT name FROM language_entities_cache WHERE id = ? LIMIT 1',
          [languageEntityId]
        );
      const languageName = languageResult[0]?.name || 'Unknown Language';

      for (const version of result) {
        if (version.version_type === 'audio') {
          audioVersions.push({
            id: version.version_id,
            name: version.version_name,
            languageEntityId: version.language_entity_id,
            languageName: languageName,
            mediaFileCount: 0, // This would need to be fetched separately
            createdAt: version.created_at,
            updatedAt: version.updated_at,
          });
        } else if (version.version_type === 'text') {
          textVersions.push({
            id: version.version_id,
            name: version.version_name,
            languageEntityId: version.language_entity_id,
            languageName: languageName,
            source: 'text_version', // Default source
            verseCount: 0, // This would need to be fetched separately
            createdAt: version.created_at,
            updatedAt: version.updated_at,
          });
        }
      }

      return { audio: audioVersions, text: textVersions };
    } catch (error) {
      console.error('Error getting available versions:', error);
      throw error;
    }
  }

  /**
   * Sync language entities using the LanguageSyncService
   */
  async syncLanguageEntities(): Promise<void> {
    try {
      // Check if sync is needed
      const updateCheck = await languageSync.needsUpdate();

      if (updateCheck.needsUpdate) {
        console.log('Syncing language entities...');
        await languageSync.syncAll();
      }
    } catch (error) {
      console.error('Error syncing language entities:', error);
      throw error;
    }
  }

  /**
   * Clear language cache
   */
  async clearLanguageCache(): Promise<void> {
    try {
      await languageSync.clearLocalData();
    } catch (error) {
      console.error('Error clearing language cache:', error);
      throw error;
    }
  }

  // Helper methods
  private async getCachedLanguageEntities(): Promise<LanguageEntityCache[]> {
    try {
      return await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache ORDER BY name'
      );
    } catch (error) {
      console.error('Error getting cached language entities:', error);
      return [];
    }
  }

  private buildHierarchy(entities: LanguageEntityCache[]): LanguageEntity[] {
    const entityMap = new Map<string, LanguageEntity>();
    const rootEntities: LanguageEntity[] = [];

    // First pass: create all entities
    for (const entity of entities) {
      const mappedEntity = this.mapCacheToEntity(entity);
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
        } else {
          // Parent not found, treat as root
          rootEntities.push(mappedEntity);
        }
      } else {
        rootEntities.push(mappedEntity);
      }
    }

    return rootEntities;
  }

  private mapCacheToEntity(cache: LanguageEntityCache): LanguageEntity {
    return {
      id: cache.id,
      name: cache.name,
      level: cache.level as 'family' | 'language' | 'dialect' | 'mother_tongue',
      parent_id: cache.parent_id,
      created_at: cache.created_at,
      updated_at: cache.updated_at,
      deleted_at: null,
      children: [],
      isExpanded: false,
      hasChildren: false, // This would need to be calculated
    };
  }
}

export const languageEntitiesService = new LanguageEntitiesService();
