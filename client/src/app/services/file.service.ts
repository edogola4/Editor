import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { FileNode } from '../components/file-explorer/file-explorer.service';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId: string | null;
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  children?: FileNode[];
  content?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  getRecentFiles() {
    throw new Error('Method not implemented.');
  }
  getFolderContents(id: string) {
    throw new Error('Method not implemented.');
  }
  selectFile(id: string) {
    throw new Error('Method not implemented.');
  }
  addToRecentFiles(file: FileNode) {
    throw new Error('Method not implemented.');
  }
  moveFile(id: any, newParentId: string | null) {
    throw new Error('Method not implemented.');
  }
  createFile(name: any, parentId: string | null, arg2: any) {
    throw new Error('Method not implemented.');
  }
  createFolder(name: any, parentId: string | null) {
    throw new Error('Method not implemented.');
  }
  renameNode(id: string, newName: any) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = '/api/files';
  private fileCache = new Map<string, FileNode>();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  // Get file tree with caching
  getFileTree(refresh = false): Observable<FileNode[]> {
    const now = Date.now();
    if (!refresh && now - this.cacheTimestamp < this.CACHE_DURATION && this.fileCache.size > 0) {
      return of(this.getCachedTree());
    }

    return this.http.get<FileNode[]>(`${this.apiUrl}/tree`).pipe(
      tap(files => {
        this.updateCache(files);
        this.cacheTimestamp = now;
      })
    );
  }

  // Get file content
  getFileContent(fileId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/${fileId}/content`, { responseType: 'text' });
  }

  // Create file or folder
  createNode(node: Partial<FileNode>): Observable<FileNode> {
    return this.http.post<FileNode>(this.apiUrl, node).pipe(
      tap(newNode => this.addToCache(newNode))
    );
  }

  // Update file or folder
  updateNode(id: string, updates: Partial<FileNode>): Observable<FileNode> {
    return this.http.put<FileNode>(`${this.apiUrl}/${id}`, updates).pipe(
      tap(updatedNode => this.updateInCache(updatedNode))
    );
  }

  // Delete file or folder
  deleteNode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.removeFromCache(id))
    );
  }

  // Upload file
  uploadFile(file: File, parentId: string | null = null): Observable<{progress: number, file?: FileNode}> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) {
      formData.append('parentId', parentId);
    }

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return new Observable(observer => {
      this.http.request<FileNode>(req).subscribe(
        (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            observer.next({ progress });
          } else if (event.type === HttpEventType.Response) {
            this.addToCache(event.body as FileNode);
            observer.next({ progress: 100, file: event.body as FileNode });
            observer.complete();
          }
        },
        error => observer.error(error)
      );
    });
  }

  // Download file
  downloadFile(fileId: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download`, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Accept', 'application/octet-stream')
    });
  }

  // Search files
  searchFiles(query: string): Observable<FileNode[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.http.get<FileNode[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }

  // Get file properties
  getFileProperties(fileId: string): Observable<FileNode> {
    return this.http.get<FileNode>(`${this.apiUrl}/${fileId}/properties`);
  }

  // Cache management
  private updateCache(files: FileNode[]) {
    files.forEach(file => this.addToCache(file));
  }

  private addToCache(file: FileNode) {
    this.fileCache.set(file.id, file);
    if (file.children) {
      file.children.forEach(child => this.addToCache(child));
    }
  }

  private updateInCache(updatedFile: FileNode) {
    this.fileCache.set(updatedFile.id, updatedFile);
  }

  private removeFromCache(id: string) {
    this.fileCache.delete(id);
  }

  private getCachedTree(): FileNode[] {
    const rootNodes: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();
    
    // Create a map of all nodes
    this.fileCache.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });
    
    // Build the tree
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else if (!node.parentId) {
        rootNodes.push(node);
      }
    });
    
    return rootNodes;
  }
}
