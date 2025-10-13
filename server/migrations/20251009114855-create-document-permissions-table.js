'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for permissions
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_document_permissions_permission" AS ENUM ('owner', 'editor', 'viewer');
    `);

    // Create document_permissions table
    await queryInterface.createTable('document_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      permission: {
        type: 'enum_document_permissions_permission',
        allowNull: false,
        defaultValue: 'viewer',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('document_permissions', ['document_id']);
    await queryInterface.addIndex('document_permissions', ['user_id']);
    await queryInterface.addIndex('document_permissions', ['document_id', 'user_id'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table
    await queryInterface.dropTable('document_permissions');

    // Drop enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_document_permissions_permission";');
  },
};
