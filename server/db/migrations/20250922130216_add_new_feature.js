export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('users', 'newFeatureField', {
    type: Sequelize.STRING,
    allowNull: true,
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('users', 'newFeatureField');
};
