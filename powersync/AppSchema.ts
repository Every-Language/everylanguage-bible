import { column, Schema, Table } from '@powersync/react-native';
// Alternative: import { column, Schema, Table } from '@powersync/web';

const bible_versions = new Table(
  {
    // id column (text) is automatically included
    name: column.text,
    structure_notes: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: {} }
);

const books = new Table(
  {
    // id column (text) is automatically included
    name: column.text,
    book_number: column.integer,
    bible_version_id: column.text,
    created_at: column.text,
    updated_at: column.text,
    global_order: column.integer,
    testament: column.text,
  },
  { indexes: {} }
);

const chapters = new Table(
  {
    // id column (text) is automatically included
    chapter_number: column.integer,
    book_id: column.text,
    total_verses: column.integer,
    created_at: column.text,
    updated_at: column.text,
    global_order: column.integer,
  },
  { indexes: {} }
);

const verses = new Table(
  {
    // id column (text) is automatically included
    chapter_id: column.text,
    verse_number: column.integer,
    created_at: column.text,
    updated_at: column.text,
    global_order: column.integer,
  },
  { indexes: {} }
);

export const AppSchema = new Schema({
  bible_versions,
  books,
  chapters,
  verses,
});
