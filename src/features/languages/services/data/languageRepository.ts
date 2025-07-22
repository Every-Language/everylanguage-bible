import DatabaseManager from '../../../../shared/services/database/DatabaseManager';
import {
  LanguageEntityCache,
  AvailableVersionCache,
} from '../../../../shared/services/database/schema';

const databaseManager = DatabaseManager.getInstance();

// Repository errors
export class LanguageRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'LanguageRepositoryError';
  }
}

// Pure data access interface
export interface LanguageRepositoryInterface {
  // Language entities
  getAllLanguageEntities(): Promise<LanguageEntityCache[]>;
  getLanguageEntity(id: string): Promise<LanguageEntityCache | null>;
  getChildLanguageEntities(parentId: string): Promise<LanguageEntityCache[]>;
  searchLanguageEntities(query: string): Promise<LanguageEntityCache[]>;
  updateLanguageEntityAvailability(
    id: string,
    hasVersions: boolean,
    audioCount: number,
    textCount: number
  ): Promise<void>;

  // Available versions
  getAvailableVersions(
    languageEntityId: string
  ): Promise<AvailableVersionCache[]>;

  // Cache management
  clearLanguageEntitiesCache(): Promise<void>;
  getLanguageEntityCount(): Promise<number>;
}

class LanguageRepository implements LanguageRepositoryInterface {
  async getAllLanguageEntities(): Promise<LanguageEntityCache[]> {
    try {
      return await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache ORDER BY name'
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        'Failed to fetch language entities',
        'FETCH_ENTITIES_FAILED',
        { originalError: error }
      );
    }
  }

  async getLanguageEntity(id: string): Promise<LanguageEntityCache | null> {
    try {
      const results = await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache WHERE id = ? LIMIT 1',
        [id]
      );
      return results[0] || null;
    } catch (error) {
      throw new LanguageRepositoryError(
        `Failed to fetch language entity with id: ${id}`,
        'FETCH_ENTITY_FAILED',
        { entityId: id, originalError: error }
      );
    }
  }

  async getChildLanguageEntities(
    parentId: string
  ): Promise<LanguageEntityCache[]> {
    try {
      return await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache WHERE parent_id = ? ORDER BY name',
        [parentId]
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        `Failed to fetch child language entities for parent: ${parentId}`,
        'FETCH_CHILDREN_FAILED',
        { parentId, originalError: error }
      );
    }
  }

  async searchLanguageEntities(query: string): Promise<LanguageEntityCache[]> {
    try {
      const searchPattern = `%${query.toLowerCase()}%`;
      return await databaseManager.executeQuery<LanguageEntityCache>(
        'SELECT * FROM language_entities_cache WHERE LOWER(name) LIKE ? ORDER BY name LIMIT 50',
        [searchPattern]
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        `Failed to search language entities with query: ${query}`,
        'SEARCH_ENTITIES_FAILED',
        { query, originalError: error }
      );
    }
  }

  async updateLanguageEntityAvailability(
    id: string,
    hasVersions: boolean,
    audioCount: number,
    textCount: number
  ): Promise<void> {
    try {
      await databaseManager.executeQuery(
        `UPDATE language_entities_cache 
         SET has_available_versions = ?, 
             audio_versions_count = ?, 
             text_versions_count = ?, 
             last_availability_check = ? 
         WHERE id = ?`,
        [
          hasVersions ? 1 : 0,
          audioCount,
          textCount,
          new Date().toISOString(),
          id,
        ]
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        `Failed to update availability for language entity: ${id}`,
        'UPDATE_AVAILABILITY_FAILED',
        { entityId: id, originalError: error }
      );
    }
  }

  async getAvailableVersions(
    languageEntityId: string
  ): Promise<AvailableVersionCache[]> {
    try {
      return await databaseManager.executeQuery<AvailableVersionCache>(
        'SELECT * FROM available_versions_cache WHERE language_entity_id = ? AND is_available = 1 ORDER BY version_name',
        [languageEntityId]
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        `Failed to fetch available versions for language: ${languageEntityId}`,
        'FETCH_VERSIONS_FAILED',
        { languageEntityId, originalError: error }
      );
    }
  }

  async clearLanguageEntitiesCache(): Promise<void> {
    try {
      await databaseManager.executeQuery('DELETE FROM language_entities_cache');
      await databaseManager.executeQuery(
        'DELETE FROM available_versions_cache'
      );
    } catch (error) {
      throw new LanguageRepositoryError(
        'Failed to clear language entities cache',
        'CLEAR_CACHE_FAILED',
        { originalError: error }
      );
    }
  }

  async getLanguageEntityCount(): Promise<number> {
    try {
      const result = await databaseManager.executeQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM language_entities_cache'
      );
      return result[0]?.count || 0;
    } catch (error) {
      throw new LanguageRepositoryError(
        'Failed to get language entity count',
        'COUNT_ENTITIES_FAILED',
        { originalError: error }
      );
    }
  }
}

// Export singleton instance
export const languageRepository = new LanguageRepository();
export default languageRepository;
