import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Pipes
import { FileSizePipe } from '../pipes/file-size.pipe';

// Components
import { FilePreviewComponent } from '../components/file-preview/file-preview.component';

// Directives
// Add any shared directives here

const SHARED_COMPONENTS = [
  FilePreviewComponent,
  // Add other shared components here
];

const SHARED_PIPES = [
  FileSizePipe,
  // Add other shared pipes here
];

@NgModule({
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  exports: [
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    // Re-export commonly used modules
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class SharedModule { }
