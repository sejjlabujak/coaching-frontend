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
import { AgeSelection } from '../../../models/training-event.model';

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
export class OcrUploadDialog implements OnDestroy {
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

  jobId: string | null = null;
  extractedDrills: OcrDrill[] = [];
  currentDrillIndex = 0;

  // Review form for current drill
  editFormData = {
    title: '',
    description: '',
    category: 'OFFENSE',
    complexity: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    ageGroup: null as string | null,
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
  ageGroupOptions: (AgeSelection | null)[] = [null, 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];
  intensityOptions = ['LOW', 'MEDIUM', 'HIGH'];

  private pollingInterval: any = null;

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
    this.processingMessage.set('Uploading to server...');
    this.cdr.detectChanges();

    // Upload to backend
    this.ocrService.uploadFile(file).subscribe({
      next: (response) => {
        this.jobId = response.jobId;
        this.processingMessage.set(
          'Processing PDF with OCR... This may take several minutes for large files.',
        );
        this.cdr.detectChanges();
        this.startPolling(response.jobId);
      },
      error: (err) => {
        this.errorMessage.set('Upload failed: ' + err.message);
        this.step.set('upload');
        this.cdr.detectChanges();
      },
    });
  }

  private startPolling(jobId: string): void {
    this.pollingInterval = setInterval(() => {
      this.ocrService.getStatus(jobId).subscribe({
        next: (status) => {
          if (status.extractedTitle && status.extractedTitle !== 'processing') {
            clearInterval(this.pollingInterval);
            this.processingMessage.set('Fetching extracted drills...');
            this.cdr.detectChanges();
            this.fetchDrills(jobId);
          }
        },
        error: () => {}, // keep polling on error
      });
    }, 10000); // poll every 10 seconds
  }

  private fetchDrills(jobId: string): void {
    this.ocrService.getDrills(jobId).subscribe({
      next: (drills) => {
        if (Array.isArray(drills) && drills.length > 0) {
          this.extractedDrills = drills;
          this.currentDrillIndex = 0;
          this.loadDrillIntoForm(drills[0]);
          this.step.set('review');
          this.cdr.detectChanges();
        } else {
          this.errorMessage.set('No drills found in the document.');
          this.step.set('upload');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage.set('Failed to fetch drills: ' + err.message);
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
    this.editFormData.ageGroup = drill.ageGroup ?? null;
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
      ageGroup: this.editFormData.ageGroup,
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
            ageGroup: (drill.ageGroup ?? 'U16') as any,
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

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
