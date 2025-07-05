// Bible Content Schema
export {
  booksTable,
  chaptersTable,
  versesTable,
  audioTracksTable,
  booksRelations,
  chaptersRelations,
  versesRelations,
  audioTracksRelations,
} from './bible';

// Language Schema
export {
  languageEntitiesTable,
  languageAliasesTable,
  languagePropertiesTable,
  regionsTable,
  languageEntitiesRegionsTable,
  languageEntitiesRelations,
  languageAliasesRelations,
  languagePropertiesRelations,
  regionsRelations,
  languageEntitiesRegionsRelations,
} from './languages';

// Combined schema for Drizzle database instance
import * as bibleSchema from './bible';
import * as languageSchema from './languages';

export const schema = {
  ...bibleSchema,
  ...languageSchema,
};

// Type definitions for database tables
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Bible Content Types
export type Book = InferSelectModel<typeof bibleSchema.booksTable>;
export type NewBook = InferInsertModel<typeof bibleSchema.booksTable>;

export type Chapter = InferSelectModel<typeof bibleSchema.chaptersTable>;
export type NewChapter = InferInsertModel<typeof bibleSchema.chaptersTable>;

export type Verse = InferSelectModel<typeof bibleSchema.versesTable>;
export type NewVerse = InferInsertModel<typeof bibleSchema.versesTable>;

export type AudioTrack = InferSelectModel<typeof bibleSchema.audioTracksTable>;
export type NewAudioTrack = InferInsertModel<
  typeof bibleSchema.audioTracksTable
>;

// Language Types
export type LanguageEntity = InferSelectModel<
  typeof languageSchema.languageEntitiesTable
>;
export type NewLanguageEntity = InferInsertModel<
  typeof languageSchema.languageEntitiesTable
>;

export type LanguageAlias = InferSelectModel<
  typeof languageSchema.languageAliasesTable
>;
export type NewLanguageAlias = InferInsertModel<
  typeof languageSchema.languageAliasesTable
>;

export type LanguageProperty = InferSelectModel<
  typeof languageSchema.languagePropertiesTable
>;
export type NewLanguageProperty = InferInsertModel<
  typeof languageSchema.languagePropertiesTable
>;

export type Region = InferSelectModel<typeof languageSchema.regionsTable>;
export type NewRegion = InferInsertModel<typeof languageSchema.regionsTable>;

export type LanguageEntityRegion = InferSelectModel<
  typeof languageSchema.languageEntitiesRegionsTable
>;
export type NewLanguageEntityRegion = InferInsertModel<
  typeof languageSchema.languageEntitiesRegionsTable
>;

// Composite types for complex queries
export type ChapterWithAudio = Chapter & {
  audioTracks: AudioTrack[];
  verses: Verse[];
  book: Book;
};

export type VerseWithTiming = Verse & {
  chapter: Chapter;
};
