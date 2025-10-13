import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const handlers = [
  // Add your API request handlers here
  // Example:
  // rest.get('/api/user', (req, res, ctx) => {
  //   return res(
  //     ctx.status(200),
  //     ctx.json({ id: '1', name: 'Test User' })
  //   );
  // }),
];

export const server = setupServer(...handlers);

// Enable API mocking before tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any runtime request handlers we may add during the tests.
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done.
afterAll(() => server.close());
