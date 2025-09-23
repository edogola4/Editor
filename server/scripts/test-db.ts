import { Sequelize } from 'sequelize';

async function testConnection() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'collab_editor',
    username: 'postgres',
    password: 'postgres',
    logging: console.log,
  });

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Test query
    const [results] = await sequelize.query('SELECT NOW()');
    console.log('Current database time:', results);
    
    // Check if users table exists
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Database tables:', tables);
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
