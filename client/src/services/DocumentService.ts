import { authService } from './auth.service';
import { webSocketService } from './websocket.service';

export interface Document {
  id: string;
  title: string;
  content: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isPublic: boolean;
  collaborators: Array<{
    userId: string;
    permission: 'read' | 'write' | 'admin';
  }>;
}

class DocumentService {
  private apiUrl = '/api/documents';
  private headers = {
    'Content-Type': 'application/json',
    'Authorization': '',
  };

  constructor() {
    this.updateAuthHeader();
    authService.onAuthStateChanged(this.updateAuthHeader.bind(this));
  }

  private updateAuthHeader() {
    const token = authService.getAccessToken();
    this.headers.Authorization = token ? `Bearer ${token}` : '';
  }

  async getDocuments(): Promise<Document[]> {
    const response = await fetch(this.apiUrl, {
      headers: this.headers,
    });
    this.handleResponseError(response);
    return response.json();
  }

  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      headers: this.headers,
    });
    this.handleResponseError(response);
    return response.json();
  }

  async createDocument(document: Partial<Document>): Promise<Document> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(document),
    });
    this.handleResponseError(response);
    return response.json();
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(updates),
    });
    this.handleResponseError(response);
    return response.json();
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    this.handleResponseError(response);
  }

  async shareDocument(
    documentId: string,
    userId: string,
    permission: 'read' | 'write' | 'admin'
  ): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${documentId}/share`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ userId, permission }),
    });
    this.handleResponseError(response);
  }

  async getDocumentHistory(documentId: string): Promise<Array<{
    id: string;
    version: number;
    content: string;
    updatedAt: string;
    updatedBy: string;
  }>> {
    const response = await fetch(`${this.apiUrl}/${documentId}/history`, {
      headers: this.headers,
    });
    this.handleResponseError(response);
    return response.json();
  }

  async restoreVersion(documentId: string, version: number): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${documentId}/restore`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ version }),
    });
    this.handleResponseError(response);
    return response.json();
  }

  private handleResponseError(response: Response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

export const documentService = new DocumentService();
