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
import { PdfOcrService } from '../../../services/ocr-upload-service';
import { DrillLibraryService } from '../../../services/drill-library-service';
import { OcrParsedDrill,OcrWord, PdfImportStep } from '../../../models/ocr-result-model';
import { LibraryDrill } from '../../../models/library-drill-model';
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
  @ViewChild('pdfCanvas') pdfCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayCanvas') overlayCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly dialogRef = inject(MatDialogRef<OcrUploadDialog>);
  private readonly ocrService = inject(PdfOcrService);
  private readonly libraryService = inject(DrillLibraryService);
  private readonly cdr = inject(ChangeDetectorRef);

  step = signal<PdfImportStep>('upload');
  isDragOver = signal(false);
  errorMessage = signal<string | null>(null);
  processingMessage = signal('Rendering PDF...');
  fileName = signal('');

  // Review form state
  parsedDrill = signal<OcrParsedDrill | null>(null);
  editFormData = {
    title: '',
    description: '',
    category: 'Offense',
    complexity: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
  };

  categoryOptions = [
    'Shooting',
    'Defense',
    'Offense',
    'Conditioning',
    'Recovery',
    'Rebounding',
    'Team Building',
    'Passing',
  ];
  complexityOptions: ('Beginner' | 'Intermediate' | 'Advanced')[] = [
    'Beginner',
    'Intermediate',
    'Advanced',
  ];

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

  private async handleFile(file: File): Promise<void> {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      this.errorMessage.set('Invalid file type. Please upload a PDF or image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('File too large. Maximum size is 10MB.');
      return;
    }

    this.errorMessage.set(null);
    this.fileName.set(file.name);
    this.step.set('processing');
    this.cdr.detectChanges();

    const offscreenCanvas = document.createElement('canvas');
    let words: OcrWord[];

    if (isPdf) {
      words = await this.ocrService.extractTextFromPdf(file);
      await this.ocrService.renderPdfToCanvas(file, offscreenCanvas);

      if (words.length === 0) {
        words = await this.ocrService.runOcr(offscreenCanvas);
      }
    } else {
      await this.ocrService.renderImageToCanvas(file, offscreenCanvas);
      words = await this.ocrService.runOcr(offscreenCanvas);
    }

    console.log('WORDS:', words.map((w) => w.text).join(' '));

    this.processingMessage.set('Running OCR...');
    this.cdr.detectChanges();

    console.log('RAW WORDS:', words.map((w) => w.text).join(' '));

    const parsed = this.ocrService.parseDrillFromWords(words);
    console.log('PARSED:', parsed);
    console.log(
      'WORDS za highlight:',
      words.map((w) => `"${w.text}" [${w.bbox.x0},${w.bbox.y0}]`),
    );
    console.log('PARSED highlighted:', parsed.highlightedWords.length);
    this.parsedDrill.set(parsed);

    this.editFormData.title = parsed.title;
    this.editFormData.description = parsed.description;
    this.editFormData.category = parsed.category;
    this.editFormData.complexity = parsed.complexity;

    this.step.set('review');

    this.cdr.detectChanges();

    await this.waitForNextFrame();

    const pdfCanvas = this.pdfCanvasRef.nativeElement;
    pdfCanvas.width = offscreenCanvas.width;
    pdfCanvas.height = offscreenCanvas.height;
    pdfCanvas.getContext('2d')!.drawImage(offscreenCanvas, 0, 0);

    const overlay = this.overlayCanvasRef.nativeElement;
    overlay.width = offscreenCanvas.width;
    overlay.height = offscreenCanvas.height;
    this.ocrService.drawHighlights(overlay, parsed.highlightedWords);

    this.cdr.detectChanges();
  }
  onConfirm(): void {
    const form = this.editFormData;
    const newDrill: LibraryDrill = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      focus: form.category as any,
      intensity: 'MEDIUM',
      ageGroup: 'U16',
      tag: `#${form.category}`,
      level: form.complexity,
      equipment: [],
      duration: 20,
    };
    this.libraryService.addDrill(newDrill);
    this.dialogRef.close({ added: true, drill: newDrill });
  }

  onDiscard(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private waitForNextFrame(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 50));
  }

  ngOnDestroy(): void {}
}
