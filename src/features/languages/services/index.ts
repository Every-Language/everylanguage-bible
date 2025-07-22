/**
 * Clean services export - refactored architecture
 */

// Export repository layer (data access)
export {
  languageRepository,
  type LanguageRepositoryInterface,
  LanguageRepositoryError,
} from './data/languageRepository';

export {
  userVersionsRepository,
  type UserVersionsRepositoryInterface,
  UserVersionsRepositoryError,
} from './data/userVersionsRepository';

// Export domain services (business logic)
export {
  languageService,
  type LanguageServiceInterface,
  LanguageServiceError,
} from './domain/languageService';

export {
  userVersionsService,
  type UserVersionsServiceInterface,
  UserVersionsServiceError,
} from './domain/userVersionsService';

// Export availability service (to be refactored later)
export { availabilityService } from './availabilityService';
