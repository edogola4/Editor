import { Component, OnInit, OnDestroy, HostListener, ViewChild, TemplateRef } from '@angular/core';
import { FileExplorerService, FileNode } from './file-explorer.service';
import { FileService } from '../../services/file.service';
import { FileSocketService, FileEvent } from '../../services/file-socket.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FilePreviewComponent } from '../file-preview/file-preview.component';

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss']
})
export class FileExplorerComponent implements OnInit, OnDestroy {
  @ViewChild('filePreviewDialog') filePreviewDialog!: TemplateRef<any>;
  
  currentPath: string = '/';
  files: FileNode[] = [];
  filteredFiles: FileNode[] = [];
  recentFiles: FileNode[] = [];
  selectedFile: FileNode | null = null;
  searchQuery = '';
  searchResults: FileNode[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Context menu state
  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    target: null as FileNode | null,
    isFile: false,
  };
  
  // Subscriptions
  private subscriptions = new Subscription();
  
  // File type icons mapping
  fileIcons: { [key: string]: string } = {
    // Code files
    'ts': 'code',
    'js': 'javascript',
    'html': 'html',
    'css': 'css',
    'scss': 'sass',
    'json': 'data_object',
    'md': 'article',
    'py': 'code',
    'java': 'code',
    'cpp': 'code',
    'c': 'code',
    'h': 'code',
    'go': 'code',
    'rs': 'code',
    'php': 'php',
    'rb': 'code',
    'sh': 'terminal',
    'dockerfile': 'docker',
    'yaml': 'code',
    'yml': 'code',
    'xml': 'code',
    'sql': 'storage',
    'graphql': 'account_tree',
    // Documents
    'pdf': 'picture_as_pdf',
    'doc': 'description',
    'docx': 'description',
    'xls': 'table_chart',
    'xlsx': 'table_chart',
    'ppt': 'slideshow',
    'pptx': 'slideshow',
    'txt': 'text_snippet',
    'rtf': 'text_snippet',
    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    'webp': 'image',
    'bmp': 'image',
    // Archives
    'zip': 'folder_zip',
    'rar': 'folder_zip',
    'tar': 'folder_zip',
    'gz': 'folder_zip',
    '7z': 'folder_zip',
    // Default
    'default': 'insert_drive_file'
  };
  
  // Context menu items
  menuItems = [
    { label: 'New File', icon: 'add', action: 'newFile', divider: false },
    { label: 'New Folder', icon: 'create_new_folder', action: 'newFolder', divider: true },
    { label: 'Rename', icon: 'edit', action: 'rename', divider: false },
    { label: 'Delete', icon: 'delete', action: 'delete', divider: true },
    { label: 'Copy', icon: 'content_copy', action: 'copy', divider: false },
    { label: 'Cut', icon: 'content_cut', action: 'cut', divider: false },
    { label: 'Paste', icon: 'content_paste', action: 'paste', divider: true },
  ];
  
  // Keyboard shortcuts
  private keyBindings: { [key: string]: () => void } = {
    'ArrowUp': () => this.navigateSelection(-1),
    'ArrowDown': () => this.navigateSelection(1),
    'Enter': () => this.openSelectedItem(),
    'Delete': () => this.deleteSelectedItem(),
    'F2': () => this.renameSelectedItem(),
    'F5': () => this.refresh()
  };

  constructor(
    private fileService: FileService,
    private socketService: FileSocketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFiles();
    this.setupSocketListeners();
    this.loadRecentFiles();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  private loadFiles(): void {
    this.isLoading = true;
    this.error = null;
    
    this.subscriptions.add(
      this.fileService.getFileTree().subscribe({
        next: (files) => {
          this.files = files;
          this.filteredFiles = [...files];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load files:', err);
          this.error = 'Failed to load files. Please try again.';
          this.isLoading = false;
        }
      })
    );
  }
  
  private loadRecentFiles(): void {
    this.subscriptions.add(
      this.fileService.getRecentFiles().subscribe({
        next: (files) => {
          this.recentFiles = files;
        },
        error: (err) => {
          console.error('Failed to load recent files:', err);
        }
      })
    );
  }
  
  private setupSocketListeners(): void {
    // Handle file created event
    this.subscriptions.add(
      this.socketService.onFileCreated().subscribe((event: FileEvent) => {
        this.handleFileEvent(event);
      })
    );
    
    // Handle file updated event
    this.subscriptions.add(
      this.socketService.onFileUpdated().subscribe((event: FileEvent) => {
        this.handleFileEvent(event);
      })
    );
    
    // Handle file deleted event
    this.subscriptions.add(
      this.socketService.onFileDeleted().subscribe((event: FileEvent) => {
        this.handleFileEvent(event);
      })
    );
    
    // Handle file moved/renamed event
    this.subscriptions.add(
      this.socketService.onFileMoved().subscribe((event: FileEvent) => {
        this.handleFileEvent(event);
      })
    );
  }
  
  private handleFileEvent(event: FileEvent): void {
    switch (event.type) {
      case 'create':
        this.handleFileCreated(event.data);
        break;
      case 'update':
      case 'content-update':
        this.handleFileUpdated(event.data);
        break;
      case 'delete':
        this.handleFileDeleted(event.data);
        break;
      case 'move':
      case 'rename':
        this.handleFileMoved(event.data);
        break;
    }
  }
  
  private handleFileCreated(file: FileNode): void {
    this.snackBar.open(`Created: ${file.name}`, 'Dismiss', { duration: 3000 });
    this.loadFiles();
  }
  
  private handleFileUpdated(file: FileNode): void {
    const index = this.files.findIndex(f => f.id === file.id);
    if (index !== -1) {
      this.files[index] = { ...this.files[index], ...file };
      this.files = [...this.files];
    }
  }
  
  private handleFileDeleted(file: FileNode): void {
    this.files = this.files.filter(f => f.id !== file.id);
    this.snackBar.open(`Deleted: ${file.name}`, 'Undo', { duration: 5000 })
      .onAction()
      .subscribe(() => this.restoreFile(file));
  }
  
  private handleFileMoved(file: FileNode): void {
    this.loadFiles(); // Refresh the entire tree as the structure might have changed
  }
  
  private restoreFile(file: FileNode): void {
    // Implement file restoration logic
    console.log('Restore file:', file);
  }

  toggleExpand(node: FileNode, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (node.type === 'folder') {
      if (!node.isExpanded && (!node.children || node.children.length === 0)) {
        // Lazy load folder contents
        this.loadFolderContents(node);
      }
      node.isExpanded = !node.isExpanded;
    } else {
      this.openFile(node);
    }
  }
  
  private loadFolderContents(folder: FileNode): void {
    this.subscriptions.add(
      this.fileService.getFolderContents(folder.id).subscribe({
        next: (contents) => {
          folder.children = contents;
          this.files = [...this.files]; // Trigger change detection
        },
        error: (err) => {
          console.error(`Failed to load contents of ${folder.name}:`, err);
          this.snackBar.open(`Failed to load ${folder.name}`, 'Dismiss', { duration: 3000 });
        }
      })
    );
  }
  
  openFile(file: FileNode): void {
    if (file.type === 'folder') return;
    
    this.selectedFile = file;
    
    // For non-text files, open in preview dialog
    if (!this.isTextFile(file)) {
      this.openPreviewDialog(file);
      return;
    }
    
    // For text files, open in editor
    this.fileService.selectFile(file.id);
    
    // Add to recent files
    this.fileService.addToRecentFiles(file);
  }
  
  private openPreviewDialog(file: FileNode): void {
    this.dialog.open(FilePreviewComponent, {
      width: '80%',
      height: '80%',
      data: { file },
      panelClass: 'file-preview-dialog'
    });
  }
  
  private isTextFile(file: FileNode): boolean {
    const textFileExtensions = ['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'scss', 'py', 'java', 'cpp', 'c', 'h', 'go', 'rs', 'php', 'rb', 'sh', 'yaml', 'yml', 'xml', 'sql', 'graphql'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return textFileExtensions.includes(extension);
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFiles = [...this.files];
      this.searchResults = [];
      return;
    }
    
    this.isLoading = true;
    
    this.subscriptions.add(
      this.fileService.searchFiles(this.searchQuery).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Search failed:', err);
          this.snackBar.open('Search failed. Please try again.', 'Dismiss', { duration: 3000 });
          this.isLoading = false;
        }
      })
    );
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.filteredFiles = [...this.files];
  }

  onDrop(event: CdkDragDrop<FileNode[]>, parentId: string | null = null): void {
    if (event.previousContainer === event.container) {
      // Reorder within the same container
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move to a different container (folder)
      const node = event.previousContainer.data[event.previousIndex];
      const newParentId = parentId || null;
      
      if (node.parentId === newParentId) {
        return; // No change in parent
      }
      
      this.subscriptions.add(
        this.fileService.moveFile(node.id, newParentId).subscribe({
          next: () => {
            this.snackBar.open(`Moved ${node.name}`, 'Dismiss', { duration: 3000 });
          },
          error: (err) => {
            console.error('Move failed:', err);
            this.snackBar.open(`Failed to move ${node.name}`, 'Dismiss', { duration: 3000 });
          }
        })
      );
    }
  }

  onContextMenu(event: MouseEvent, node: FileNode | null = null): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Update selection
    if (node) {
      this.selectedFile = node;
    }
    
    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      target: node,
      isFile: node ? node.type === 'file' : false,
    };
  }

  @HostListener('document:click')
  closeContextMenu(): void {
    this.contextMenu.visible = false;
  }

  onContextMenuAction(action: string): void {
    const target = this.contextMenu.target || this.selectedFile;
    
    if (!target && action !== 'newFile' && action !== 'newFolder' && action !== 'paste') {
      return;
    }
    
    switch (action) {
      case 'open':
        if (target) this.openFile(target);
        break;
        
      case 'download':
        if (target) this.downloadFile(target);
        break;
        
      case 'rename':
        if (target) this.renameNode(target);
        break;
        
      case 'delete':
        if (target) this.deleteNode(target);
        break;
        
      case 'newFile':
        this.createNewFile(target?.id || null);
        break;
        
      case 'newFolder':
        this.createNewFolder(target?.id || null);
        break;
        
      case 'properties':
        if (target) this.showProperties(target);
        break;
        
      case 'copy':
        if (target) this.copyToClipboard(target);
        break;
        
      case 'cut':
        if (target) this.cutToClipboard(target);
        break;
        
      case 'paste':
        this.pasteFromClipboard(target?.id || null);
        break;
    }
    
    this.contextMenu.visible = false;
  }

  private createNewFile(parentId: string | null): void {
    const dialogRef = this.dialog.open(NewFileDialogComponent, {
      width: '400px',
      data: { parentId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.subscriptions.add(
          this.fileService.createFile(result.name, parentId, result.content || '').subscribe({
            next: (file) => {
              this.snackBar.open(`Created ${file.name}`, 'Dismiss', { duration: 3000 });
              this.loadFiles();
            },
            error: (err) => {
              console.error('Failed to create file:', err);
              this.snackBar.open('Failed to create file', 'Dismiss', { duration: 3000 });
            }
          })
        );
      }
    });
  }

  private createNewFolder(parentId: string | null): void {
    const dialogRef = this.dialog.open(NewFolderDialogComponent, {
      width: '400px',
      data: { parentId }
    });
    
    dialogRef.afterClosed().subscribe(name => {
      if (name) {
        this.subscriptions.add(
          this.fileService.createFolder(name, parentId).subscribe({
            next: (folder) => {
              this.snackBar.open(`Created folder ${folder.name}`, 'Dismiss', { duration: 3000 });
              this.loadFiles();
            },
            error: (err) => {
              console.error('Failed to create folder:', err);
              this.snackBar.open('Failed to create folder', 'Dismiss', { duration: 3000 });
            }
          })
        );
      }
    });
  }

  private renameNode(node: FileNode): void {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '400px',
      data: { name: node.name }
    });
    
    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName !== node.name) {
        this.subscriptions.add(
          this.fileService.renameNode(node.id, newName).subscribe({
            next: (updatedNode) => {
              this.snackBar.open(`Renamed to ${updatedNode.name}`, 'Dismiss', { duration: 3000 });
              this.loadFiles();
            },
            error: (err) => {
              console.error('Failed to rename:', err);
              this.snackBar.open('Failed to rename', 'Dismiss', { duration: 3000 });
            }
          })
        );
      }
    });
  }

  private deleteNode(node: FileNode): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete ${node.name}?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.subscriptions.add(
          this.fileService.deleteNode(node.id).subscribe({
            next: () => {
              this.snackBar.open(`Deleted ${node.name}`, 'Undo', { duration: 5000 })
                .onAction()
                .subscribe(() => this.restoreFile(node));
              this.loadFiles();
            },
            error: (err) => {
              console.error('Failed to delete:', err);
              this.snackBar.open('Failed to delete', 'Dismiss', { duration: 3000 });
            }
          })
        );
      }
    });
  }
  
  private downloadFile(file: FileNode): void {
    this.subscriptions.add(
      this.fileService.downloadFile(file.id, file.name).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (err) => {
          console.error('Download failed:', err);
          this.snackBar.open('Download failed', 'Dismiss', { duration: 3000 });
        }
      })
    );
  }
  
  private showProperties(node: FileNode): void {
    this.dialog.open(FilePropertiesDialogComponent, {
      width: '500px',
      data: { file: node }
    });
  }
  
  private copyToClipboard(node: FileNode): void {
    // Implement copy to clipboard logic
    console.log('Copy to clipboard:', node);
  }
  
  private cutToClipboard(node: FileNode): void {
    // Implement cut to clipboard logic
    console.log('Cut to clipboard:', node);
  }
  
  private pasteFromClipboard(parentId: string | null): void {
    // Implement paste from clipboard logic
    console.log('Paste from clipboard to:', parentId);
  }
  
  private navigateSelection(direction: number): void {
    if (!this.filteredFiles.length) return;
    
    let currentIndex = this.selectedFile 
      ? this.filteredFiles.findIndex(f => f.id === this.selectedFile?.id) 
      : -1;
    
    let newIndex = currentIndex + direction;
    
    // Wrap around if needed
    if (newIndex < 0) newIndex = this.filteredFiles.length - 1;
    if (newIndex >= this.filteredFiles.length) newIndex = 0;
    
    this.selectedFile = this.filteredFiles[newIndex];
    
    // Scroll into view
    const element = document.querySelector(`.file-item[data-id="${this.selectedFile.id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  private openSelectedItem(): void {
    if (this.selectedFile) {
      this.openFile(this.selectedFile);
    }
  }
  
  private deleteSelectedItem(): void {
    if (this.selectedFile) {
      this.deleteNode(this.selectedFile);
    }
  }
  
  private renameSelectedItem(): void {
    if (this.selectedFile) {
      this.renameNode(this.selectedFile);
    }
  }
  
  refresh(): void {
    this.loadFiles();
    this.snackBar.open('Refreshed', 'Dismiss', { duration: 2000 });
  }
  
  getFileIcon(file: FileNode): string {
    if (file.type === 'folder') {
      return 'folder';
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return this.fileIcons[extension] || this.fileIcons['default'];
  }
  
  trackById(index: number, item: FileNode): string {
    return item.id;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Skip if an input or textarea is focused
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const key = event.key;
    
    // Check for Ctrl/Cmd + key combinations
    if (event.ctrlKey || event.metaKey) {
      switch (key.toLowerCase()) {
        case 'f':
          event.preventDefault();
          const searchInput = document.querySelector('.search-input') as HTMLInputElement;
          searchInput?.focus();
          return;
          
        case 'n':
          event.preventDefault();
          if (event.shiftKey) {
            this.createNewFolder(this.selectedFile?.id || null);
          } else {
            this.createNewFile(this.selectedFile?.id || null);
          }
          return;
          
        case 'f5':
          // Don't prevent default for F5 to allow normal refresh
          return;
      }
    }
    
    // Handle single key presses
    const action = this.keyBindings[key];
    if (action) {
      event.preventDefault();
      action();
    }
  }
}
