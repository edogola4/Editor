import { User } from '../../src/models/User';
import { Document } from '../../src/models/Document';
import { DocumentVersion } from '../../src/models/DocumentVersion';
import { DocumentPermission } from '../../src/models/DocumentPermission';

type UserData = {
  username?: string;
  email?: string;
  password?: string;
  [key: string]: any;
};

type DocumentData = {
  title?: string;
  content?: string;
  createdById?: string;
  [key: string]: any;
};

export const TestHelpers = {
  /**
   * Create a test user
   */
  createUser: async (data: UserData = {}) => {
    return User.create({
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      ...data,
    });
  },

  /**
   * Create a test document
   */
  createDocument: async (data: DocumentData = {}, userId?: string) => {
    if (!userId) {
      const user = await TestHelpers.createUser();
      userId = user.id;
    }

    const document = await Document.create({
      title: `Test Document ${Date.now()}`,
      content: 'Initial content',
      createdById: userId,
      ...data,
    });

    await DocumentPermission.create({
      documentId: document.id,
      userId,
      permission: 'owner',
    });

    // Create initial version
    await DocumentVersion.create({
      documentId: document.id,
      version: 1,
      content: document.content,
      createdById: userId,
    });

    return document;
  },

  /**
   * Generate a random string
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  /**
   * Wait for a specified number of milliseconds
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

export default TestHelpers;
