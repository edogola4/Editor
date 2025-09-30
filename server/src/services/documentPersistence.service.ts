/**
 * Document Persistence Service
 * Handles saving and loading documents from the database
 */

import { Document, DocumentVersion } from '../models/index.js';
import { DocumentOperation } from '../socket/types/events.js';

export class DocumentPersistenceService {
  /**
   * Save document to database
   */
  async saveDocument(
    documentId: string,
    content: string,
    version: number,
    ownerId: string,
    name?: string,
    language?: string
  ): Promise<boolean> {
    try {
      const [document, created] = await Document.findOrCreate({
        where: { id: documentId },
        defaults: {
          id: documentId,
          name: name || 'Untitled Document',
          content,
          language: language || 'javascript',
          version,
          ownerId,
          isPublic: false,
        },
      });

      if (!created) {
        // Update existing document
        await document.update({
          content,
          version,
          ...(name && { name }),
          ...(language && { language }),
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      return false;
    }
  }

  /**
   * Load document from database
   */
  async loadDocument(documentId: string): Promise<{
    content: string;
    version: number;
    name: string;
    language: string;
    ownerId: string;
  } | null> {
    try {
      const document = await Document.findByPk(documentId);
      
      if (!document) {
        return null;
      }

      return {
        content: document.content,
        version: document.version,
        name: document.name,
        language: document.language,
        ownerId: document.ownerId,
      };
    } catch (error) {
      console.error('Error loading document:', error);
      return null;
    }
  }

  /**
   * Save document version (for history)
   */
  async saveDocumentVersion(
    documentId: string,
    content: string,
    version: number,
    operation: DocumentOperation,
    userId: string
  ): Promise<boolean> {
    try {
      await DocumentVersion.create({
        documentId,
        content,
        version,
        operation: operation as any,
        userId,
      });

      return true;
    } catch (error) {
      console.error('Error saving document version:', error);
      return false;
    }
  }

  /**
   * Get document history
   */
  async getDocumentHistory(
    documentId: string,
    limit: number = 50
  ): Promise<Array<{
    version: number;
    operation: DocumentOperation;
    userId: string;
    createdAt: Date;
  }>> {
    try {
      const versions = await DocumentVersion.findAll({
        where: { documentId },
        order: [['version', 'DESC']],
        limit,
      });

      return versions.map((v) => ({
        version: v.version,
        operation: v.operation as any,
        userId: v.userId,
        createdAt: v.createdAt,
      }));
    } catch (error) {
      console.error('Error getting document history:', error);
      return [];
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const result = await Document.destroy({
        where: { id: documentId },
      });

      return result > 0;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<Array<{
    id: string;
    name: string;
    language: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      const documents = await Document.findAll({
        where: { ownerId: userId },
        order: [['updatedAt', 'DESC']],
        attributes: ['id', 'name', 'language', 'version', 'createdAt', 'updatedAt'],
      });

      return documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        language: doc.language,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }

  /**
   * Auto-save document periodically
   */
  async autoSave(
    documentId: string,
    content: string,
    version: number,
    ownerId: string
  ): Promise<void> {
    try {
      await this.saveDocument(documentId, content, version, ownerId);
      console.log(`Auto-saved document ${documentId} at version ${version}`);
    } catch (error) {
      console.error('Error auto-saving document:', error);
    }
  }
}

export const documentPersistenceService = new DocumentPersistenceService();
