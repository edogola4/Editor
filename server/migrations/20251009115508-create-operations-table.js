'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create operations table
    await queryInterface.createTable('operations', {
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
      operation: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    await queryInterface.addIndex('operations', ['document_id']);
    await queryInterface.addIndex('operations', ['user_id']);
    await queryInterface.addIndex('operations', ['document_id', 'version'], {
      unique: true,
    });
    await queryInterface.addIndex('operations', ['timestamp']);
  },

  async down(queryInterface, Sequelize) {
    // Drop table
    await queryInterface.dropTable('operations');
  },
};
