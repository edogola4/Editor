import { test, expect } from '@playwright/test';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { app } from '../../server/src/app';
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'Test@1234',
};

const TEST_ROOM = {
  name: 'Test Room',
  description: 'Test Description',
  language: 'javascript',
};

test.describe('Collaborative Editor - End-to-End Tests', () => {
  let server: any;
  let serverAddr: AddressInfo;
  const PORT = 3001; // Different port than dev server
  
  test.beforeAll(async () => {
    // Set up test environment
    await setupTestEnvironment();
    
    // Start test server
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(PORT, '0.0.0.0', () => {
        serverAddr = server.address() as AddressInfo;
        console.log(`Test server running on port ${serverAddr.port}`);
        resolve();
      });
    });
  });
  
  test.afterAll(async () => {
    // Clean up test environment
    await cleanupTestEnvironment();
    
    // Close test server
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
    });
  });
  
  test('should allow multiple users to collaborate in real-time', async ({ browser }) => {
    // Create two browser contexts to simulate two users
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    // Create pages for both users
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();
    
    // Test registration and login flow for both users
    await test.step('Register and login users', async () => {
      // User 1
      await user1Page.goto('http://localhost:3000/register');
      await user1Page.fill('input[name="email"]', TEST_USER.email);
      await user1Page.fill('input[name="username"]', TEST_USER.username);
      await user1Page.fill('input[name="password"]', TEST_USER.password);
      await user1Page.fill('input[name="confirmPassword"]', TEST_USER.password);
      await user1Page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await user1Page.waitForURL('**/dashboard');
      
      // User 2
      await user2Page.goto('http://localhost:3000/register');
      await user2Page.fill('input[name="email"]', 'user2@example.com');
      await user2Page.fill('input[name="username"]', 'testuser2');
      await user2Page.fill('input[name="password"]', TEST_USER.password);
      await user2Page.fill('input[name="confirmPassword"]', TEST_USER.password);
      await user2Page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await user2Page.waitForURL('**/dashboard');
    });
    
    // Test room creation and joining
    await test.step('Create and join room', async () => {
      // User 1 creates a room
      await user1Page.click('button:has-text("Create Room")');
      await user1Page.fill('input[name="name"]', TEST_ROOM.name);
      await user1Page.fill('textarea[name="description"]', TEST_ROOM.description);
      await user1Page.selectOption('select[name="language"]', TEST_ROOM.language);
      await user1Page.click('button[type="submit"]');
      
      // Get room URL
      await user1Page.waitForURL('**/room/**');
      const roomUrl = user1Page.url();
      
      // User 2 joins the room
      await user2Page.goto(roomUrl);
      await user2Page.waitForSelector('.editor-container');
    });
    
    // Test real-time collaboration
    await test.step('Collaborative editing', async () => {
      // Initial code
      const initialCode = '// Initial code\nfunction hello() {\n  return "Hello, World!";\n}';
      
      // User 1 types some code
      await user1Page.click('.editor-container .monaco-editor');
      await user1Page.keyboard.press('Control+KeyA');
      await user1Page.keyboard.press('Delete');
      await user1Page.keyboard.type(initialCode);
      
      // Wait for the code to sync
      await user1Page.waitForTimeout(1000);
      
      // Verify both users see the same code
      const user1Code = await user1Page.$eval('.monaco-editor', (el: any) => 
        (window as any).monaco.editor.getModels()[0].getValue()
      );
      
      const user2Code = await user2Page.$eval('.monaco-editor', (el: any) => 
        (window as any).monaco.editor.getModels()[0].getValue()
      );
      
      expect(user1Code).toBe(initialCode);
      expect(user2Code).toBe(initialCode);
      
      // User 2 makes changes
      await user2Page.click('.editor-container .monaco-editor');
      await user2Page.keyboard.press('End');
      await user2Page.keyboard.press('Enter');
      await user2Page.keyboard.type('// User 2 was here\n');
      
      // Wait for the changes to sync
      await user2Page.waitForTimeout(1000);
      
      // Verify both users see the updated code
      const updatedUser1Code = await user1Page.$eval('.monaco-editor', (el: any) => 
        (window as any).monaco.editor.getModels()[0].getValue()
      );
      
      expect(updatedUser1Code).toContain('// User 2 was here');
    });
    
    // Test chat functionality
    await test.step('Chat functionality', async () => {
      const testMessage = 'Hello from User 1!';
      
      // User 1 sends a message
      await user1Page.fill('input[placeholder="Type a message..."]', testMessage);
      await user1Page.press('input[placeholder="Type a message..."]', 'Enter');
      
      // Verify User 2 receives the message
      const user2Message = user2Page.locator('.message:last-child .content').first();
      await expect(user2Message).toHaveText(testMessage);
      
      // Verify User 1 sees their own message
      const user1Message = user1Page.locator('.message:last-child .content').first();
      await expect(user1Message).toHaveText(testMessage);
    });
    
    // Clean up
    await user1Context.close();
    await user2Context.close();
  });
  
  test('should handle disconnection and reconnection gracefully', async ({ page }) => {
    // This test would simulate network issues and verify reconnection logic
    // Implementation would be similar to the test above but with network condition simulation
    test.skip('Not implemented yet');
  });
});
