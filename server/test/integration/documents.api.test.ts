import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setupTestServer, withAuth, createAuthenticatedUser } from '../helpers/api-client';
import { Document } from '../../../src/models/Document';
import { DocumentPermission } from '../../../src/models/DocumentPermission';
import { User } from '../../../src/models/User';

// Setup test server
const { request } = setupTestServer();

describe('Documents API', () => {
  let testUser: User;
  let authToken: string;
  
  beforeAll(async () => {
    // Create and authenticate a test user
    const { user, tokens } = await createAuthenticatedUser();
    testUser = user;
    authToken = tokens.accessToken;
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const documentData = {
        title: 'Test Document',
        content: 'Initial content',
        isPublic: false,
      };

      const res = await withAuth(request.post('/api/documents'), authToken)
        .send(documentData)
        .expect(201);

      expect(res.body).toMatchObject({
        title: documentData.title,
        content: documentData.content,
        isPublic: documentData.isPublic,
        createdById: testUser.id,
      });

      // Verify document was created in the database
      const dbDocument = await Document.findByPk(res.body.id, {
        include: [{ model: DocumentPermission, where: { userId: testUser.id } }],
      });

      expect(dbDocument).not.toBeNull();
      expect(dbDocument?.permissions?.[0]?.permission).toBe('owner');
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request
        .post('/api/documents')
        .send({ title: 'Unauthenticated Doc' })
        .expect(401);
    });
  });

  describe('GET /api/documents/:id', () => {
    let testDocument: Document;

    beforeAll(async () => {
      // Create a test document
      testDocument = await Document.create({
        title: 'Test Get Document',
        content: 'Test content',
        createdById: testUser.id,
      });

      await DocumentPermission.create({
        documentId: testDocument.id,
        userId: testUser.id,
        permission: 'read',
      });
    });

    it('should get a document by ID', async () => {
      const res = await withAuth(
        request.get(`/api/documents/${testDocument.id}`),
        authToken
      ).expect(200);

      expect(res.body).toMatchObject({
        id: testDocument.id,
        title: testDocument.title,
        content: testDocument.content,
      });
    });

    it('should return 404 for non-existent document', async () => {
      await withAuth(
        request.get('/api/documents/non-existent-id'),
        authToken
      ).expect(404);
    });

    it('should return 403 if user has no permission', async () => {
      // Create another user
      const { tokens: otherUserTokens } = await createAuthenticatedUser();
      
      await withAuth(
        request.get(`/api/documents/${testDocument.id}`),
        otherUserTokens.accessToken
      ).expect(403);
    });
  });

  describe('PUT /api/documents/:id', () => {
    let testDocument: Document;

    beforeEach(async () => {
      // Create a test document before each test
      testDocument = await Document.create({
        title: 'Test Update Document',
        content: 'Original content',
        createdById: testUser.id,
      });

      await DocumentPermission.create({
        documentId: testDocument.id,
        userId: testUser.id,
        permission: 'write',
      });
    });

    it('should update a document', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
        isPublic: true,
      };

      const res = await withAuth(
        request.put(`/api/documents/${testDocument.id}`),
        authToken
      )
        .send(updates)
        .expect(200);

      expect(res.body).toMatchObject(updates);

      // Verify document was updated in the database
      const updatedDoc = await Document.findByPk(testDocument.id);
      expect(updatedDoc?.title).toBe(updates.title);
      expect(updatedDoc?.content).toBe(updates.content);
      expect(updatedDoc?.isPublic).toBe(updates.isPublic);
    });

    it('should return 403 if user has no write permission', async () => {
      // Create another user with read-only permission
      const { tokens: otherUserTokens } = await createAuthenticatedUser();
      
      await DocumentPermission.create({
        documentId: testDocument.id,
        userId: testUser.id,
        permission: 'read', // Only read permission
      });

      await withAuth(
        request.put(`/api/documents/${testDocument.id}`)
          .send({ title: 'Unauthorized Update' }),
        otherUserTokens.accessToken
      ).expect(403);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    let testDocument: Document;

    beforeEach(async () => {
      // Create a test document before each test
      testDocument = await Document.create({
        title: 'Test Delete Document',
        content: 'Content to be deleted',
        createdById: testUser.id,
      });

      await DocumentPermission.create({
        documentId: testDocument.id,
        userId: testUser.id,
        permission: 'owner',
      });
    });

    it('should delete a document', async () => {
      await withAuth(
        request.delete(`/api/documents/${testDocument.id}`),
        authToken
      ).expect(204);

      // Verify document was deleted from the database
      const deletedDoc = await Document.findByPk(testDocument.id);
      expect(deletedDoc).toBeNull();
    });

    it('should return 403 if user is not the owner', async () => {
      // Create another user with write permission (but not owner)
      const { tokens: otherUserTokens } = await createAuthenticatedUser();
      
      await DocumentPermission.create({
        documentId: testDocument.id,
        userId: testUser.id,
        permission: 'write',
      });

      await withAuth(
        request.delete(`/api/documents/${testDocument.id}`),
        otherUserTokens.accessToken
      ).expect(403);
    });
  });

  describe('GET /api/documents', () => {
    beforeAll(async () => {
      // Create test documents
      const documents = [
        { title: 'Document 1', content: 'Content 1', createdById: testUser.id, isPublic: true },
        { title: 'Document 2', content: 'Content 2', createdById: testUser.id, isPublic: false },
        { title: 'Document 3', content: 'Content 3', createdById: testUser.id, isPublic: true },
      ];

      for (const doc of documents) {
        const document = await Document.create(doc);
        await DocumentPermission.create({
          documentId: document.id,
          userId: testUser.id,
          permission: 'read',
        });
      }
    });

    it('should list documents with pagination', async () => {
      const res = await withAuth(
        request.get('/api/documents?page=1&limit=2'),
        authToken
      ).expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body.items).toHaveLength(2);
    });

    it('should filter public documents', async () => {
      const res = await withAuth(
        request.get('/api/documents?isPublic=true'),
        authToken
      ).expect(200);

      expect(res.body.items.every((doc: any) => doc.isPublic)).toBe(true);
    });
  });
});
