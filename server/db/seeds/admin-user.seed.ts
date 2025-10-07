import { User } from '../../src/models/index.js';

/**
 * Seed an admin user for development/testing
 */
export async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return existingAdmin;
    }

    // Create admin user - password will be hashed by the User model's beforeCreate hook
    const adminPassword = 'Admin123!@#Secure';
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword, // Will be hashed by the model
      role: 'admin' as 'admin',
      isVerified: true,
    });

    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin123!@#Secure');
    console.log('  Role: admin');

    return adminUser;
  } catch (error) {
    console.error('✗ Failed to seed admin user:', error);
    throw error;
  }
}

/**
 * Seed multiple test users
 */
export async function seedTestUsers() {
  try {
    const testUsers = [
      {
        username: 'testuser1',
        email: 'user1@example.com',
        password: 'User123!@#Secure',
        role: 'user' as 'user',
        isVerified: true,
      },
      {
        username: 'testuser2',
        email: 'user2@example.com',
        password: 'User123!@#Secure',
        role: 'user' as 'user',
        isVerified: true,
      },
      {
        username: 'testuser3',
        email: 'user3@example.com',
        password: 'User123!@#Secure',
        role: 'user' as 'user',
        isVerified: false,
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        // Create test user - password will be hashed by the User model's beforeCreate hook
        await User.create(userData);
        console.log(`✓ Test user created: ${userData.email}`);
      } else {
        console.log(`✓ Test user already exists: ${userData.email}`);
      }
    }

    console.log('✓ All test users seeded successfully');
  } catch (error) {
    console.error('✗ Failed to seed test users:', error);
    throw error;
  }
}

/**
 * Run all seeds
 */
export async function runSeeds() {
  console.log('\n🌱 Starting database seeding...\n');
  
  await seedAdminUser();
  await seedTestUsers();
  
  console.log('\n✓ Database seeding completed!\n');
}
