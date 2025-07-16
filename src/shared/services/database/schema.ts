import * as SQLite from 'expo-sqlite';

export interface SyncMetadata {
  table_name: string;
  last_sync: string; // ISO timestamp
  total_records: number;
  sync_status: 'idle' | 'syncing' | 'error';
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
  testament: 'OT' | 'NT';
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
      testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
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

  console.log('Database tables created successfully');
};

export const dropTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
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
});
