import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Users', [{
      id: '00000000-0000-0000-0000-000000000000',
      username: 'admin',
      email: 'admin@example.com',
      password: '$2a$10$XFD9Z9p7Y4jqQ7XvLZ9qE.9VKjX1VlJXK1JXK1JXK1JXK1JXK1JXK1', // password: admin123
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Users', { username: 'admin' });
  }
};
