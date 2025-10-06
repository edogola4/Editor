'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to users table
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
      allowNull: false,
      defaultValue: 'pending_verification'
    });

    await queryInterface.addColumn('users', 'firstName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'lastName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'company', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'website', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'loginCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'preferredLanguage', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en'
    });

    await queryInterface.addColumn('users', 'emailNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'emailVerificationToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'emailVerificationExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Update existing role enum if needed
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('user', 'editor', 'admin', 'owner') NOT NULL DEFAULT 'user'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    const columnsToRemove = [
      'status',
      'firstName',
      'lastName',
      'bio',
      'company',
      'location',
      'website',
      'lastLoginAt',
      'loginCount',
      'timezone',
      'preferredLanguage',
      'emailNotifications',
      'twoFactorEnabled',
      'emailVerificationToken',
      'emailVerificationExpires'
    ];

    for (const column of columnsToRemove) {
      await queryInterface.removeColumn('users', column);
    }

    // Revert role enum if needed
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'"
    );
  }
};
