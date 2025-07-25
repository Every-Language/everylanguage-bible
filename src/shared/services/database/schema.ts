import * as SQLite from 'expo-sqlite';

export interface SyncMetadata {
  table_name: string;
  last_sync: string; // ISO timestamp
  total_records: number;
  sync_status: string; // Flexible string instead of hardcoded union
  error_message?: string;
  // New fields for bible content sync optimization
  content_version?: string; // For version-based syncing
  last_version_check?: string; // When we last checked for new versions
  created_at?: string;
  updated_at?: string;
}

export interface LocalBook {
  id: string;
  book_number: number;
  name: string;
  testament: string | null; // Flexible string or null to handle remote null values
  chapters: number;
  global_order: number;
  created_at: string;
  updated_at: string;
}

export interface LocalChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  total_verses: number;
  global_order: number | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface LocalVerse {
  id: string;
  chapter_id: string;
  verse_number: number;
  global_order: number | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// ✅ NEW: Interface for verse texts
export interface LocalVerseText {
  id: string;
  verse_id: string;
  text_version_id: string | null;
  verse_text: string;
  publish_status: string;
  version: number;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// Language Selection Feature Interfaces
export interface UserSavedVersion {
  id: string;
  version_type: string; // Flexible string instead of hardcoded union
  language_entity_id: string;
  language_name: string;
  version_id: string; // project_id or text_version_id
  version_name: string;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface LanguageEntityCache {
  id: string;
  name: string;
  level: string; // Changed from hardcoded union to flexible string
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
  // New availability fields
  has_available_versions?: boolean;
  audio_versions_count?: number;
  text_versions_count?: number;
  last_availability_check?: string;
}

export interface AvailableVersionCache {
  id: string;
  version_type: string; // Flexible string instead of hardcoded union
  language_entity_id: string;
  version_id: string; // project_id or text_version_id
  version_name: string;
  created_at: string;
  updated_at: string;
  synced_at: string;
  // New availability fields
  is_available: boolean;
  published_content_count: number;
  last_availability_check: string;
}

// Media Files Table Interface (Non-syncing table)
export interface LocalMediaFile {
  id: string;
  language_entity_id: string;
  sequence_id: string;
  media_type: string;
  local_path: string;
  remote_path: string;
  file_size: number;
  duration_seconds: number;
  upload_status: string;
  publish_status: string;
  check_status: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  chapter_id: string | null;
  verses: string; // JSON string of verse IDs
}

// Media Files Verses Table Interface (Syncing table)
export interface LocalMediaFileVerse {
  id: string;
  media_file_id: string;
  verse_id: string;
  start_time_seconds: number;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export const DATABASE_NAME = 'everylanguage_bible.db';
export const DATABASE_VERSION = 1;

export const createTables = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON');

  // Enhanced sync metadata table to track sync state with bible content optimizations
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_sync TEXT NOT NULL,
      total_records INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'idle',
      error_message TEXT,
      content_version TEXT,
      last_version_check TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Books table (mirroring Supabase books table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      book_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      testament TEXT,
      chapters INTEGER NOT NULL,
      global_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Chapters table (mirroring Supabase chapters table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      total_verses INTEGER NOT NULL,
      global_order INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
    )
  `);

  // Verses table (mirroring Supabase verses table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS verses (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      verse_number INTEGER NOT NULL,
      global_order INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE
    )
  `);

  // ✅ NEW: Verse texts table (mirroring Supabase verse_texts table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS verse_texts (
      id TEXT PRIMARY KEY,
      verse_id TEXT NOT NULL,
      text_version_id TEXT,
      verse_text TEXT NOT NULL,
      publish_status TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (verse_id) REFERENCES verses (id) ON DELETE CASCADE
    )
  `);

  // Language Selection Feature Tables

  // User saved language versions (local storage)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_saved_versions (
      id TEXT PRIMARY KEY,
      version_type TEXT NOT NULL,
      language_entity_id TEXT NOT NULL,
      language_name TEXT NOT NULL,
      version_id TEXT NOT NULL,
      version_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(version_type, version_id)
    )
  `);

  // Cache for language entities (for offline access)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS language_entities_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      has_available_versions BOOLEAN DEFAULT 0,
      audio_versions_count INTEGER DEFAULT 0,
      text_versions_count INTEGER DEFAULT 0,
      last_availability_check TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES language_entities_cache (id)
    )
  `);

  // Cache for available versions (audio/text)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS available_versions_cache (
      id TEXT PRIMARY KEY,
      version_type TEXT NOT NULL,
      language_entity_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      version_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_available BOOLEAN DEFAULT 0,
      published_content_count INTEGER DEFAULT 0,
      last_availability_check TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (language_entity_id) REFERENCES language_entities_cache (id)
    )
  `);

  // Media Files Table (Non-syncing table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      language_entity_id TEXT NOT NULL,
      sequence_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      local_path TEXT NOT NULL,
      remote_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      upload_status TEXT NOT NULL,
      publish_status TEXT NOT NULL,
      check_status TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      chapter_id TEXT,
      verses TEXT NOT NULL,
      FOREIGN KEY (language_entity_id) REFERENCES language_entities_cache (id),
      FOREIGN KEY (chapter_id) REFERENCES chapters (id)
    )
  `);

  // Media Files Verses Table (Syncing table)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS media_files_verses (
      id TEXT PRIMARY KEY,
      media_file_id TEXT NOT NULL,
      verse_id TEXT NOT NULL,
      start_time_seconds INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (media_file_id) REFERENCES media_files (id) ON DELETE CASCADE,
      FOREIGN KEY (verse_id) REFERENCES verses (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_books_testament ON books(testament)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_books_global_order ON books(global_order)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at)'
  );

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON chapters(chapter_number)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_chapters_global_order ON chapters(global_order)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at)'
  );

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_chapter_id ON verses(chapter_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_verse_number ON verses(verse_number)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_global_order ON verses(global_order)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_updated_at ON verses(updated_at)'
  );

  // ✅ NEW: Verse texts indexes for performance
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verse_texts_verse_id ON verse_texts(verse_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verse_texts_text_version_id ON verse_texts(text_version_id)'
  );

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verse_texts_publish_status ON verse_texts(publish_status)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verse_texts_updated_at ON verse_texts(updated_at)'
  );

  // ✅ PERFORMANCE: Add compound indexes for optimized JOIN queries
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_chapters_book_chapter ON chapters(book_id, chapter_number)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_chapter_verse ON verses(chapter_id, verse_number)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_sync_metadata_table_status ON sync_metadata(table_name, sync_status)'
  );
  // ✅ NEW: Compound index for verse texts lookups
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verse_texts_verse_version ON verse_texts(verse_id, text_version_id)'
  );

  // Language Selection Feature Indexes
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_user_saved_versions_type ON user_saved_versions(version_type)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_user_saved_versions_language ON user_saved_versions(language_entity_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_user_saved_versions_version_id ON user_saved_versions(version_id)'
  );

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_language_entities_cache_parent ON language_entities_cache(parent_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_language_entities_cache_level ON language_entities_cache(level)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_language_entities_cache_name ON language_entities_cache(name)'
  );

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_available_versions_cache_language ON available_versions_cache(language_entity_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_available_versions_cache_type ON available_versions_cache(version_type)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_available_versions_cache_version_id ON available_versions_cache(version_id)'
  );

  // Media Files Table Indexes
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_language_entity_id ON media_files(language_entity_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_sequence_id ON media_files(sequence_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files(media_type)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_upload_status ON media_files(upload_status)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_publish_status ON media_files(publish_status)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_chapter_id ON media_files(chapter_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON media_files(deleted_at)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_updated_at ON media_files(updated_at)'
  );

  // Media Files Verses Indexes
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_verses_media_file_id ON media_files_verses(media_file_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_verses_verse_id ON media_files_verses(verse_id)'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_media_files_verses_start_time_seconds ON media_files_verses(start_time_seconds)'
  );

  // Initialize sync metadata for bible content
  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('books', '1970-01-01T00:00:00.000Z')
  `);

  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('chapters', '1970-01-01T00:00:00.000Z')
  `);

  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('verses', '1970-01-01T00:00:00.000Z')
  `);

  // ✅ NEW: Initialize sync metadata for verse texts
  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('verse_texts', '1970-01-01T00:00:00.000Z')
  `);

  // Initialize sync metadata for language selection tables
  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('language_entities_cache', '1970-01-01T00:00:00.000Z')
  `);

  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('available_versions_cache', '1970-01-01T00:00:00.000Z')
  `);

  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('user_saved_versions', '1970-01-01T00:00:00.000Z')
  `);

  // Initialize sync metadata for media files verses
  await db.execAsync(`
    INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
    VALUES ('media_files_verses', '1970-01-01T00:00:00.000Z')
  `);

  console.log('Database tables created successfully');
};

export const dropTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // Drop media files table first (due to foreign key constraints)
  await db.execAsync('DROP TABLE IF EXISTS media_files');
  await db.execAsync('DROP TABLE IF EXISTS media_files_verses');

  // Drop language selection tables first (due to foreign key constraints)
  await db.execAsync('DROP TABLE IF EXISTS available_versions_cache');
  await db.execAsync('DROP TABLE IF EXISTS user_saved_versions');
  await db.execAsync('DROP TABLE IF EXISTS language_entities_cache');

  // ✅ NEW: Drop verse_texts table (before verses due to foreign key)
  await db.execAsync('DROP TABLE IF EXISTS verse_texts');

  // Drop existing tables
  await db.execAsync('DROP TABLE IF EXISTS verses');
  await db.execAsync('DROP TABLE IF EXISTS chapters');
  await db.execAsync('DROP TABLE IF EXISTS books');
  await db.execAsync('DROP TABLE IF EXISTS sync_metadata');
};

export const getTableSchema = () => ({
  books: {
    tableName: 'books',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  chapters: {
    tableName: 'chapters',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  verses: {
    tableName: 'verses',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  // ✅ NEW: Add verse_texts to table schema
  verse_texts: {
    tableName: 'verse_texts',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  language_entities_cache: {
    tableName: 'language_entities_cache',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  available_versions_cache: {
    tableName: 'available_versions_cache',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  user_saved_versions: {
    tableName: 'user_saved_versions',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  media_files: {
    tableName: 'media_files',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
  media_files_verses: {
    tableName: 'media_files_verses',
    primaryKey: 'id',
    timestampField: 'updated_at',
  },
});
