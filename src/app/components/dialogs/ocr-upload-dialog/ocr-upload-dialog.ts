import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Button } from '../../../components/button/button';
import { OcrBackendService, OcrDrill } from '../../../services/ocr-backend.service';
import { DrillLibraryService } from '../../../services/drill-library.service';
import { LibraryDrill } from '../../../models/library-drill.model';
import { PdfImportStep } from '../../../models/ocr-result.model';

@Component({
  selector: 'app-pdf-import-dialog',
  standalone: true,
  templateUrl: './ocr-upload-dialog.html',
  styleUrl: './ocr-upload-dialog.css',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrUploadDialog {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly dialogRef = inject(MatDialogRef<OcrUploadDialog>);
  private readonly ocrService = inject(OcrBackendService);
  private readonly libraryService = inject(DrillLibraryService);
  private readonly cdr = inject(ChangeDetectorRef);

  step = signal<PdfImportStep>('upload');
  isDragOver = signal(false);
  errorMessage = signal<string | null>(null);
  processingMessage = signal('Uploading file to server...');
  fileName = signal('');

  extractedDrills: OcrDrill[] = [];
  currentDrillIndex = 0;

  // Review form for current drill
  editFormData = {
    title: '',
    description: '',
    category: 'OFFENSE',
    complexity: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    intensity: 'MEDIUM',
    equipment: null as string | null,
  };

  categoryOptions = [
    'SHOOTING',
    'DEFENSE',
    'OFFENSE',
    'CONDITIONING',
    'RECOVERY',
    'REBOUNDING',
    'TEAM_BUILDING',
  ];
  complexityOptions: ('Beginner' | 'Intermediate' | 'Advanced')[] = [
    'Beginner',
    'Intermediate',
    'Advanced',
  ];
  intensityOptions = ['LOW', 'MEDIUM', 'HIGH'];

  // Drag-and-drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onBrowseClick(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      this.errorMessage.set('Invalid file type. Please upload a PDF or image file.');
      return;
    }

    this.errorMessage.set(null);
    this.fileName.set(file.name);
    this.step.set('processing');
    this.processingMessage.set('Uploading and processing... This may take several minutes.');
    this.cdr.detectChanges();

    this.ocrService.uploadFile(file).subscribe({
      next: (response: any) => {
        // Drills come back directly in the upload response
        const drills: OcrDrill[] = response.drills;
        if (Array.isArray(drills) && drills.length > 0) {
          this.extractedDrills = drills;
          this.currentDrillIndex = 0;
          this.loadDrillIntoForm(drills[0]);
          this.step.set('review');
        } else {
          this.errorMessage.set('No drills found in the document.');
          this.step.set('upload');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set('Upload failed: ' + err.message);
        this.step.set('upload');
        this.cdr.detectChanges();
      },
    });
  }

  private loadDrillIntoForm(drill: OcrDrill): void {
    this.editFormData.title = drill.title ?? '';
    this.editFormData.description = drill.description ?? '';
    this.editFormData.category = drill.focus ?? 'OFFENSE';
    this.editFormData.complexity = (drill.level as any) ?? 'Beginner';
    this.editFormData.intensity = drill.intensity ?? 'MEDIUM';
    this.editFormData.equipment = drill.equipment ?? null;
  }

  get totalDrills(): number {
    return this.extractedDrills.length;
  }

  get currentDrillNumber(): number {
    return this.currentDrillIndex + 1;
  }

  onConfirm(): void {
    // Save current form edits back to drill
    this.extractedDrills[this.currentDrillIndex] = {
      title: this.editFormData.title,
      description: this.editFormData.description,
      focus: this.editFormData.category,
      level: this.editFormData.complexity,
      intensity: this.editFormData.intensity,
      equipment: this.editFormData.equipment,
    };

    if (this.currentDrillIndex < this.extractedDrills.length - 1) {
      // Move to next drill
      this.currentDrillIndex++;
      this.loadDrillIntoForm(this.extractedDrills[this.currentDrillIndex]);
      this.cdr.detectChanges();
    } else {
      // All drills reviewed — save all to DB
      this.saveAllDrills();
    }
  }

  onSkip(): void {
    // Remove current drill from list
    this.extractedDrills.splice(this.currentDrillIndex, 1);

    if (this.extractedDrills.length === 0) {
      this.dialogRef.close();
      return;
    }

    if (this.currentDrillIndex >= this.extractedDrills.length) {
      this.currentDrillIndex = this.extractedDrills.length - 1;
    }

    this.loadDrillIntoForm(this.extractedDrills[this.currentDrillIndex]);
    this.cdr.detectChanges();
  }

  onSaveAll(): void {
    this.saveAllDrills();
  }

  private saveAllDrills(): void {
    this.ocrService.confirmAllDrills(this.extractedDrills).subscribe({
      next: (response) => {
        // Also add to local library so UI updates immediately
        this.extractedDrills.forEach((drill) => {
          const libraryDrill: LibraryDrill = {
            id: Date.now().toString() + Math.random(),
            title: drill.title,
            description: drill.description,
            focus: drill.focus as any,
            intensity: drill.intensity as any,
            equipment: drill.equipment ? [drill.equipment] : [],
            level: drill.level as any,
          };
          this.libraryService.addDrill(libraryDrill);
        });

        this.dialogRef.close({ saved: true, count: this.extractedDrills.length });
      },
      error: (err) => {
        this.errorMessage.set('Failed to save drills: ' + err.message);
        this.cdr.detectChanges();
      },
    });
  }

  onDiscard(): void {
    this.dialogRef.close();
  }
}
