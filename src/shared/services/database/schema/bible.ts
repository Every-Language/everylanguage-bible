import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Bible Books Table
 * Contains information about each book of the Bible
 */
export const booksTable = sqliteTable('books', {
  id: text('id').primaryKey(), // e.g., 'genesis', 'matthew'
  name: text('name').notNull(), // Full name in English
  localName: text('local_name'), // Name in local language
  testament: text('testament', { enum: ['old', 'new'] }).notNull(),
  chapterCount: integer('chapter_count').notNull(),
  bookOrder: integer('book_order').notNull(), // 1-66 order in Bible
  abbreviation: text('abbreviation').notNull(), // e.g., 'Gen', 'Matt'
  alternativeAbbreviations: text('alternative_abbreviations'), // JSON array of alternatives
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Bible Chapters Table
 * Contains chapter information with audio metadata
 */
export const chaptersTable = sqliteTable('chapters', {
  id: text('id').primaryKey(), // e.g., 'genesis-1', 'matthew-5'
  bookId: text('book_id')
    .notNull()
    .references(() => booksTable.id),
  chapterNumber: integer('chapter_number').notNull(),
  verseCount: integer('verse_count').notNull(),
  audioFileUrl: text('audio_file_url'), // Remote URL for audio
  audioDuration: integer('audio_duration'), // Duration in seconds
  audioFileSize: integer('audio_file_size'), // Size in bytes
  audioQuality: text('audio_quality', { enum: ['low', 'medium', 'high'] }),
  audioLanguageEntityId: text('audio_language_entity_id'),
  isAudioDownloaded: integer('is_audio_downloaded', {
    mode: 'boolean',
  }).default(false),
  localAudioPath: text('local_audio_path'), // Local file path when downloaded
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Bible Verses Table
 * Contains verse text and audio timing information
 */
export const versesTable = sqliteTable('verses', {
  id: text('id').primaryKey(), // e.g., 'genesis-1-1', 'matthew-5-16'
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chaptersTable.id),
  verseNumber: integer('verse_number').notNull(),
  text: text('text').notNull(), // Verse text content
  textLanguageEntityId: text('text_language_entity_id').notNull(),
  translationId: text('translation_id'), // e.g., 'niv', 'nlt', 'bsb'
  audioStartTime: real('audio_start_time'), // Start time in seconds from chapter beginning
  audioEndTime: real('audio_end_time'), // End time in seconds from chapter beginning
  audioDuration: real('audio_duration'), // Duration of this verse in seconds
  // Formatting metadata (JSON)
  formatting: text('formatting'), // JSON: { words_of_jesus: boolean, is_poetry: boolean, emphasis: string[] }
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Audio Tracks Table
 * Detailed audio file metadata for chapters
 */
export const audioTracksTable = sqliteTable('audio_tracks', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chaptersTable.id),
  languageEntityId: text('language_entity_id').notNull(),
  url: text('url').notNull(), // Remote URL
  localPath: text('local_path'), // Local file path when downloaded
  duration: integer('duration').notNull(), // Duration in seconds
  fileSize: integer('file_size').notNull(), // Size in bytes
  quality: text('quality', { enum: ['low', 'medium', 'high'] }).notNull(),
  format: text('format').notNull(), // e.g., 'mp3', 'aac'
  bitrate: integer('bitrate').notNull(), // Bitrate in kbps
  isDownloaded: integer('is_downloaded', { mode: 'boolean' }).default(false),
  downloadProgress: integer('download_progress'), // 0-100
  // Narrator information (JSON)
  narrator: text('narrator'), // JSON: { name: string, gender: 'male'|'female', age_range?: string }
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Database Relations
 * Define relationships between tables for Drizzle queries
 */
export const booksRelations = relations(booksTable, ({ many }) => ({
  chapters: many(chaptersTable),
}));

export const chaptersRelations = relations(chaptersTable, ({ one, many }) => ({
  book: one(booksTable, {
    fields: [chaptersTable.bookId],
    references: [booksTable.id],
  }),
  verses: many(versesTable),
  audioTracks: many(audioTracksTable),
}));

export const versesRelations = relations(versesTable, ({ one }) => ({
  chapter: one(chaptersTable, {
    fields: [versesTable.chapterId],
    references: [chaptersTable.id],
  }),
}));

export const audioTracksRelations = relations(audioTracksTable, ({ one }) => ({
  chapter: one(chaptersTable, {
    fields: [audioTracksTable.chapterId],
    references: [chaptersTable.id],
  }),
}));
