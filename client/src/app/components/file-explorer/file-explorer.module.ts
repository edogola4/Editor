import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatTreeModule } from '@angular/material/tree';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { FileExplorerComponent } from './file-explorer.component';
import { FilePreviewModule } from '../file-preview/file-preview.module';
import { FileService } from '../../services/file.service';
import { FileSocketService } from '../../services/file-socket.service';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@NgModule({
  declarations: [
    FileExplorerComponent,
    FileSizePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatTreeModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    FilePreviewModule
  ],
  exports: [
    FileExplorerComponent,
    FileSizePipe
  ],
  providers: [
    FileService,
    FileSocketService
  ]
})
export class FileExplorerModule { }
