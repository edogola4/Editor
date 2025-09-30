import { Request, Response, NextFunction } from 'express';
import { Document, DocumentVersion } from '../models/index.js';
import { documentService } from '../socket/services/document.service.js';
import { documentPersistenceService } from '../services/documentPersistence.service.js';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Create a new document
 */
export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, content, language } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Create document in database
    const document = await Document.create({
      name: name || 'Untitled Document',
      content: content || '',
      language: language || 'javascript',
      version: 0,
      ownerId: userId,
      isPublic: false,
    });

    // Initialize in memory for real-time collaboration
    await documentService.createDocument(document.id, document.content, userId);

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        name: document.name,
        content: document.content,
        language: document.language,
        version: document.version,
        ownerId: document.ownerId,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents for the authenticated user
 */
export const getUserDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const documents = await documentPersistenceService.getUserDocuments(userId);

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific document by ID
 */
export const getDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const document = await Document.findByPk(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if user has access (owner or public document)
    if (document.ownerId !== userId && !document.isPublic) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        name: document.name,
        content: document.content,
        language: document.language,
        version: document.version,
        ownerId: document.ownerId,
        isPublic: document.isPublic,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a document
 */
export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content, language, isPublic } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const document = await Document.findByPk(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if user is the owner
    if (document.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Update document
    await document.update({
      ...(name && { name }),
      ...(content !== undefined && { content }),
      ...(language && { language }),
      ...(isPublic !== undefined && { isPublic }),
    });

    res.json({
      success: true,
      data: {
        id: document.id,
        name: document.name,
        content: document.content,
        language: document.language,
        version: document.version,
        ownerId: document.ownerId,
        isPublic: document.isPublic,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const document = await Document.findByPk(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if user is the owner
    if (document.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Delete from memory
    documentService.deleteDocument(id);

    // Delete from database
    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document version history
 */
export const getDocumentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const document = await Document.findByPk(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if user has access
    if (document.ownerId !== userId && !document.isPublic) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const history = await documentPersistenceService.getDocumentHistory(
      id,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fork/duplicate a document
 */
export const forkDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const originalDocument = await Document.findByPk(id);

    if (!originalDocument) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if document is public or user is owner
    if (originalDocument.ownerId !== userId && !originalDocument.isPublic) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Create a copy
    const forkedDocument = await Document.create({
      name: `${originalDocument.name} (Fork)`,
      content: originalDocument.content,
      language: originalDocument.language,
      version: 0,
      ownerId: userId,
      isPublic: false,
    });

    res.status(201).json({
      success: true,
      data: {
        id: forkedDocument.id,
        name: forkedDocument.name,
        content: forkedDocument.content,
        language: forkedDocument.language,
        version: forkedDocument.version,
        ownerId: forkedDocument.ownerId,
        createdAt: forkedDocument.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Share document (make public/private)
 */
export const shareDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const document = await Document.findByPk(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check if user is the owner
    if (document.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    await document.update({ isPublic });

    res.json({
      success: true,
      data: {
        id: document.id,
        isPublic: document.isPublic,
      },
      message: `Document is now ${isPublic ? 'public' : 'private'}`,
    });
  } catch (error) {
    next(error);
  }
};
