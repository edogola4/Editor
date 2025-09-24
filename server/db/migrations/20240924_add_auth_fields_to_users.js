const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'githubId', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'avatarUrl', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'isVerified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'passwordResetToken', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'passwordResetExpires', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'githubId');
    await queryInterface.removeColumn('users', 'avatarUrl');
    await queryInterface.removeColumn('users', 'isVerified');
    await queryInterface.removeColumn('users', 'passwordResetToken');
    await queryInterface.removeColumn('users', 'passwordResetExpires');
  },
};
