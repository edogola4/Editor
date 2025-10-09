import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId: string | null;
  children?: FileNode[];
  content?: string;
  createdAt: Date;
  updatedAt: Date;
  icon?: string;
  isExpanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FileExplorerService {
  private filesSubject = new BehaviorSubject<FileNode[]>([]);
  private recentFilesSubject = new BehaviorSubject<FileNode[]>([]);
  private selectedFileSubject = new BehaviorSubject<FileNode | null>(null);

  files$ = this.filesSubject.asObservable();
  recentFiles$ = this.recentFilesSubject.asObservable();
  selectedFile$ = this.selectedFileSubject.asObservable();

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sampleFiles: FileNode[] = [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        path: '/src',
        parentId: null,
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [
          {
            id: '2',
            name: 'app',
            type: 'folder',
            path: '/src/app',
            parentId: '1',
            isExpanded: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [
              {
                id: '3',
                name: 'app.component.ts',
                type: 'file',
                path: '/src/app/app.component.ts',
                parentId: '2',
                content: '// Your component code here',
                icon: 'typescript',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: '4',
                name: 'app.component.html',
                type: 'file',
                path: '/src/app/app.component.html',
                parentId: '2',
                content: '<!-- Your template here -->',
                icon: 'html',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: '5',
                name: 'app.component.scss',
                type: 'file',
                path: '/src/app/app.component.scss',
                parentId: '2',
                content: '/* Your styles here */',
                icon: 'css',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ];

    this.filesSubject.next(sampleFiles);
    this.updateRecentFiles(sampleFiles[0].children?.[0].children || []);
  }

  private updateRecentFiles(files: FileNode[]): void {
    const recent = [...files]
      .filter(file => file.type === 'file')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
    this.recentFilesSubject.next(recent);
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      // Code files
      'ts': 'code',
      'js': 'javascript',
      'jsx': 'react',
      'tsx': 'react',
      'html': 'html',
      'css': 'css',
      'scss': 'sass',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'h',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'sh': 'bash',
      'dockerfile': 'docker',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'database',
      'graphql': 'graphql',
      'gitignore': 'git',
      // Add more file type mappings as needed
    };

    return iconMap[extension] || 'file';
  }

  createFile(name: string, parentId: string | null, content: string = ''): void {
    const files = [...this.filesSubject.value];
    const newFile: FileNode = {
      id: Date.now().toString(),
      name,
      type: 'file',
      path: parentId ? `${this.getPathById(parentId)}/${name}` : `/${name}`,
      parentId,
      content,
      icon: this.getFileIcon(name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (parentId) {
      this.addToParent(files, parentId, newFile);
    } else {
      files.push(newFile);
    }

    this.filesSubject.next(files);
    this.updateRecentFiles(this.getAllFiles(files));
  }

  createFolder(name: string, parentId: string | null): void {
    const files = [...this.filesSubject.value];
    const newFolder: FileNode = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      path: parentId ? `${this.getPathById(parentId)}/${name}` : `/${name}`,
      parentId,
      children: [],
      icon: 'folder',
      isExpanded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (parentId) {
      this.addToParent(files, parentId, newFolder);
    } else {
      files.push(newFolder);
    }

    this.filesSubject.next(files);
  }

  private addToParent(nodes: FileNode[], parentId: string, newNode: FileNode): void {
    for (const node of nodes) {
      if (node.id === parentId && node.type === 'folder') {
        if (!node.children) {
          node.children = [];
        }
        node.children.push(newNode);
        node.updatedAt = new Date();
        return;
      }
      if (node.children) {
        this.addToParent(node.children, parentId, newNode);
      }
    }
  }

  deleteNode(id: string): void {
    const files = [...this.filesSubject.value];
    this.removeNode(files, id);
    this.filesSubject.next(files);
    this.updateRecentFiles(this.getAllFiles(files));
  }

  private removeNode(nodes: FileNode[], id: string): boolean {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && this.removeNode(nodes[i].children!, id)) {
        return true;
      }
    }
    return false;
  }

  renameNode(id: string, newName: string): void {
    const files = [...this.filesSubject.value];
    const node = this.findNode(files, id);
    if (node) {
      node.name = newName;
      node.path = this.updatePath(node, files);
      node.updatedAt = new Date();
      this.filesSubject.next(files);
      this.updateRecentFiles(this.getAllFiles(files));
    }
  }

  private updatePath(node: FileNode, nodes: FileNode[]): string {
    if (!node.parentId) return `/${node.name}`;
    
    const parent = this.findNode(nodes, node.parentId);
    if (!parent) return `/${node.name}`;
    
    return `${parent.path}/${node.name}`;
  }

  private findNode(nodes: FileNode[], id: string): FileNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  selectFile(id: string): void {
    const file = this.findNode(this.filesSubject.value, id);
    if (file && file.type === 'file') {
      this.selectedFileSubject.next(file);
    }
  }

  searchFiles(query: string): Observable<FileNode[]> {
    if (!query.trim()) return of([]);
    
    return this.files$.pipe(
      map(files => {
        const results: FileNode[] = [];
        this.searchInNodes(files, query.toLowerCase(), results);
        return results;
      })
    );
  }

  private searchInNodes(nodes: FileNode[], query: string, results: FileNode[]): void {
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(query)) {
        results.push({...node});
      }
      if (node.children) {
        this.searchInNodes(node.children, query, results);
      }
    }
  }

  private getAllFiles(nodes: FileNode[]): FileNode[] {
    let files: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        files.push(node);
      }
      if (node.children) {
        files = [...files, ...this.getAllFiles(node.children)];
      }
    }
    return files;
  }

  private getPathById(id: string): string {
    const node = this.findNode(this.filesSubject.value, id);
    return node ? node.path : '';
  }
}
