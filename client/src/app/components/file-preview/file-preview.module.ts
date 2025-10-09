import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { MarkdownModule } from 'ngx-markdown';

import { FilePreviewComponent } from './file-preview.component';
import { FileService } from '../../services/file.service';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@NgModule({
  declarations: [
    FilePreviewComponent,
    FileSizePipe
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    HighlightModule,
    MarkdownModule.forChild()
  ],
  exports: [
    FilePreviewComponent
  ],
  providers: [
    FileService,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('highlightjs-line-numbers.js'),
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          javascript: () => import('highlight.js/lib/languages/javascript'),
          css: () => import('highlight.js/lib/languages/css'),
          xml: () => import('highlight.js/lib/languages/xml'),
          json: () => import('highlight.js/lib/languages/json'),
          bash: () => import('highlight.js/lib/languages/bash'),
          markdown: () => import('highlight.js/lib/languages/markdown'),
          python: () => import('highlight.js/lib/languages/python'),
          java: () => import('highlight.js/lib/languages/java'),
          cpp: () => import('highlight.js/lib/languages/cpp'),
          csharp: () => import('highlight.js/lib/languages/csharp'),
          php: () => import('highlight.js/lib/languages/php'),
          ruby: () => import('highlight.js/lib/languages/ruby'),
          go: () => import('highlight.js/lib/languages/go'),
          rust: () => import('highlight.js/lib/languages/rust'),
          sql: () => import('highlight.js/lib/languages/sql'),
          yaml: () => import('highlight.js/lib/languages/yaml')
        },
        themePath: 'assets/css/highlightjs-themes/github.css'
      }
    }
  ]
})
export class FilePreviewModule { }
