import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Language Entities Table
 * Hierarchical language organization (language families, languages, dialects)
 */
export const languageEntitiesTable = sqliteTable('language_entities', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'), // Self-referencing for hierarchy
  name: text('name').notNull(), // Language name
  level: text('level', {
    enum: ['family', 'language', 'dialect', 'variant'],
  }).notNull(), // Hierarchy level
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'), // Soft delete
});

/**
 * Language Aliases Table
 * Alternative names for languages (e.g., English, Inglés, 英語)
 */
export const languageAliasesTable = sqliteTable('language_aliases', {
  id: text('id').primaryKey(),
  languageEntityId: text('language_entity_id')
    .notNull()
    .references(() => languageEntitiesTable.id),
  aliasName: text('alias_name').notNull(), // Alternative name
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'), // Soft delete
});

/**
 * Language Properties Table
 * Key-value properties for languages (ISO codes, scripts, etc.)
 */
export const languagePropertiesTable = sqliteTable('language_properties', {
  id: text('id').primaryKey(),
  languageEntityId: text('language_entity_id')
    .notNull()
    .references(() => languageEntitiesTable.id),
  key: text('key').notNull(), // e.g., 'iso_639_1', 'iso_639_3', 'script', 'rtl'
  value: text('value').notNull(), // e.g., 'en', 'eng', 'Latin', 'false'
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'), // Soft delete
});

/**
 * Regions Table
 * Geographic regions for language distribution
 */
export const regionsTable = sqliteTable('regions', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'), // Self-referencing for hierarchy
  name: text('name').notNull(), // Region name
  level: text('level', {
    enum: ['continent', 'country', 'state', 'city', 'area'],
  }).notNull(), // Geographic hierarchy level
  boundary: text('boundary'), // Geographic boundary (JSON or WKT)
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'), // Soft delete
});

/**
 * Language Entities Regions Table
 * Many-to-many relationship between languages and regions
 */
export const languageEntitiesRegionsTable = sqliteTable(
  'language_entities_regions',
  {
    id: text('id').primaryKey(),
    languageEntityId: text('language_entity_id')
      .notNull()
      .references(() => languageEntitiesTable.id),
    regionId: text('region_id')
      .notNull()
      .references(() => regionsTable.id),
    dominanceLevel: real('dominance_level'), // 0-1, how dominant this language is in this region
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    deletedAt: text('deleted_at'), // Soft delete
  }
);

/**
 * Database Relations
 * Define relationships between language tables
 */
export const languageEntitiesRelations = relations(
  languageEntitiesTable,
  ({ one, many }) => ({
    parent: one(languageEntitiesTable, {
      fields: [languageEntitiesTable.parentId],
      references: [languageEntitiesTable.id],
      relationName: 'parent_language',
    }),
    children: many(languageEntitiesTable, {
      relationName: 'parent_language',
    }),
    aliases: many(languageAliasesTable),
    properties: many(languagePropertiesTable),
    regions: many(languageEntitiesRegionsTable),
  })
);

export const languageAliasesRelations = relations(
  languageAliasesTable,
  ({ one }) => ({
    languageEntity: one(languageEntitiesTable, {
      fields: [languageAliasesTable.languageEntityId],
      references: [languageEntitiesTable.id],
    }),
  })
);

export const languagePropertiesRelations = relations(
  languagePropertiesTable,
  ({ one }) => ({
    languageEntity: one(languageEntitiesTable, {
      fields: [languagePropertiesTable.languageEntityId],
      references: [languageEntitiesTable.id],
    }),
  })
);

export const regionsRelations = relations(regionsTable, ({ one, many }) => ({
  parent: one(regionsTable, {
    fields: [regionsTable.parentId],
    references: [regionsTable.id],
    relationName: 'parent_region',
  }),
  children: many(regionsTable, {
    relationName: 'parent_region',
  }),
  languageEntities: many(languageEntitiesRegionsTable),
}));

export const languageEntitiesRegionsRelations = relations(
  languageEntitiesRegionsTable,
  ({ one }) => ({
    languageEntity: one(languageEntitiesTable, {
      fields: [languageEntitiesRegionsTable.languageEntityId],
      references: [languageEntitiesTable.id],
    }),
    region: one(regionsTable, {
      fields: [languageEntitiesRegionsTable.regionId],
      references: [regionsTable.id],
    }),
  })
);
