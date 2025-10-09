import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { FileService, FileNode } from '../../services/file.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnChanges, OnDestroy {
  @Input() file: FileNode;
  @Input() maxHeight = '500px';
  
  content: string | SafeHtml | SafeResourceUrl;
  loading = false;
  error: string | null = null;
  private contentSubscription: Subscription;
  
  // Supported preview types with their corresponding viewer components
  readonly PREVIEW_TYPES = {
    // Code files
    'typescript': 'code',
    'javascript': 'code',
    'html': 'code',
    'css': 'code',
    'scss': 'code',
    'json': 'code',
    'python': 'code',
    'java': 'code',
    'cpp': 'code',
    'c': 'code',
    'go': 'code',
    'rust': 'code',
    'php': 'code',
    'ruby': 'code',
    'swift': 'code',
    'kotlin': 'code',
    'bash': 'code',
    'dockerfile': 'code',
    'yaml': 'code',
    'xml': 'code',
    'sql': 'code',
    'graphql': 'code',
    'markdown': 'markdown',
    
    // Images
    'jpeg': 'image',
    'jpg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    'webp': 'image',
    
    // Documents
    'pdf': 'pdf',
    'doc': 'office',
    'docx': 'office',
    'xls': 'office',
    'xlsx': 'office',
    'ppt': 'office',
    'pptx': 'office',
    
    // Media
    'mp3': 'audio',
    'wav': 'audio',
    'ogg': 'audio',
    'mp4': 'video',
    'webm': 'video',
    'mov': 'video'
  };

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.file && this.file) {
      this.loadPreview();
    }
  }

  ngOnDestroy(): void {
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }
  }

  private loadPreview(): void {
    this.loading = true;
    this.error = null;
    
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }

    if (this.file.type === 'folder') {
      this.loading = false;
      return;
    }

    const fileType = this.getFileType();
    
    switch (this.getPreviewType(fileType)) {
      case 'code':
      case 'markdown':
        this.loadTextContent();
        break;
        
      case 'image':
        this.loadImagePreview();
        break;
        
      case 'pdf':
        this.loadPdfPreview();
        break;
        
      case 'audio':
      case 'video':
        this.loadMediaPreview();
        break;
        
      case 'office':
        this.loadOfficePreview();
        break;
        
      default:
        this.loadUnsupportedPreview();
        break;
    }
  }

  private loadTextContent(): void {
    this.contentSubscription = this.fileService.getFileContent(this.file.id).subscribe({
      next: (content: string) => {
        this.content = content;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load file content';
        this.loading = false;
        console.error('Error loading file content:', err);
      }
    });
  }

  private loadImagePreview(): void {
    this.content = this.sanitizer.bypassSecurityTrustResourceUrl(
      `/api/files/${this.file.id}/preview`
    );
    this.loading = false;
  }

  private loadPdfPreview(): void {
    this.content = this.sanitizer.bypassSecurityTrustResourceUrl(
      `/api/files/${this.file.id}/preview#view=fitH&toolbar=0&navpanes=0`
    );
    this.loading = false;
  }

  private loadMediaPreview(): void {
    this.content = this.sanitizer.bypassSecurityTrustResourceUrl(
      `/api/files/${this.file.id}/preview`
    );
    this.loading = false;
  }

  private loadOfficePreview(): void {
    // Use Microsoft Office Online Viewer for Office documents
    this.content = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        `${window.location.origin}/api/files/${this.file.id}/preview`
      )}`
    );
    this.loading = false;
  }

  private loadUnsupportedPreview(): void {
    this.error = 'Preview not available for this file type';
    this.loading = false;
  }

  private getFileType(): string {
    const parts = this.file.name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private getPreviewType(fileType: string): string {
    return this.PREVIEW_TYPES[fileType] || 'unsupported';
  }

  get isCodePreview(): boolean {
    return this.getPreviewType(this.getFileType()) === 'code';
  }

  get isMarkdownPreview(): boolean {
    return this.getPreviewType(this.getFileType()) === 'markdown';
  }

  get isImagePreview(): boolean {
    return this.getPreviewType(this.getFileType()) === 'image';
  }

  get isPdfPreview(): boolean {
    return this.getPreviewType(this.getFileType()) === 'pdf';
  }

  get isMediaPreview(): boolean {
    const type = this.getPreviewType(this.getFileType());
    return type === 'audio' || type === 'video';
  }

  get isOfficePreview(): boolean {
    return this.getPreviewType(this.getFileType()) === 'office';
  }

  get mediaType(): 'audio' | 'video' | null {
    const type = this.getPreviewType(this.getFileType());
    return type === 'audio' || type === 'video' ? type : null;
  }
}
