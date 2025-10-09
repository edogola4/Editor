import supertest from 'supertest';
import { createServer } from '../../src/app';
import { User } from '../../src/models/User';

let server: ReturnType<typeof createServer>;
let request: ReturnType<typeof supertest>;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const setupTestServer = () => {
  if (!server) {
    server = createServer();
    request = supertest(server);
  }
  return { request, server };
};

export const createAuthenticatedUser = async (): Promise<{ user: User; tokens: AuthTokens }> => {
  const { request } = setupTestServer();
  
  // Create user
  const userData = {
    username: `testuser-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };
  
  await request.post('/api/auth/register').send(userData);
  
  // Login to get tokens
  const loginRes = await request
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password,
    });
    
  return {
    user: loginRes.body.user,
    tokens: {
      accessToken: loginRes.body.accessToken,
      refreshToken: loginRes.body.refreshToken,
    },
  };
};

export const withAuth = (request: any, token: string) => {
  return request.set('Authorization', `Bearer ${token}`);
};

export const createTestDocument = async (accessToken: string, documentData = {}) => {
  const { request } = setupTestServer();
  return withAuth(request.post('/api/documents'), accessToken)
    .send({
      title: `Test Document ${Date.now()}`,
      content: 'Initial content',
      ...documentData,
    });
};
