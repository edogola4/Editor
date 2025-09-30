/**
 * Migration: Add Documents and DocumentVersions tables
 * Created: 2025-09-30
 */

export async function up(pgm) {
  // Create Documents table
  pgm.createTable('Documents', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
      default: 'Untitled Document',
    },
    content: {
      type: 'text',
      notNull: true,
      default: '',
    },
    language: {
      type: 'varchar(50)',
      notNull: true,
      default: 'javascript',
    },
    version: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    owner_id: {
      type: 'uuid',
      notNull: true,
      references: 'Users',
      onDelete: 'CASCADE',
    },
    room_id: {
      type: 'uuid',
      references: 'Rooms',
      onDelete: 'SET NULL',
    },
    is_public: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for Documents
  pgm.createIndex('Documents', 'owner_id');
  pgm.createIndex('Documents', 'room_id');
  pgm.createIndex('Documents', 'created_at');

  // Create DocumentVersions table
  pgm.createTable('DocumentVersions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    document_id: {
      type: 'uuid',
      notNull: true,
      references: 'Documents',
      onDelete: 'CASCADE',
    },
    content: {
      type: 'text',
      notNull: true,
    },
    version: {
      type: 'integer',
      notNull: true,
    },
    operation: {
      type: 'jsonb',
      notNull: true,
      comment: 'The OT operation that created this version',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'Users',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for DocumentVersions
  pgm.createIndex('DocumentVersions', ['document_id', 'version'], { unique: true });
  pgm.createIndex('DocumentVersions', 'document_id');
  pgm.createIndex('DocumentVersions', 'user_id');
  pgm.createIndex('DocumentVersions', 'created_at');

  // Add comment to operation column
  pgm.sql(`
    COMMENT ON COLUMN "DocumentVersions".operation IS 'The OT operation that created this version';
  `);
}

export async function down(pgm) {
  // Drop tables in reverse order
  pgm.dropTable('DocumentVersions');
  pgm.dropTable('Documents');
}
