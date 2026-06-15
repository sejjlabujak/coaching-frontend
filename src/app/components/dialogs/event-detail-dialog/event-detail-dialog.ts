import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingEvent, EventDetailData } from '../../../models/training-event.model';
import { Button } from '../../button/button';
import { Router } from '@angular/router';
import { BuilderStateService } from '../../../services/builder-state.service';
import { TrainingService } from '../../../services/training.service';

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatSnackBarModule, Button],
  templateUrl: './event-detail-dialog.html',
  styleUrl: './event-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EventDetailDialogComponent>);
  readonly data = inject<EventDetailData>(MAT_DIALOG_DATA);
  readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly builderState = inject(BuilderStateService);
  private readonly trainingService = inject(TrainingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  noteText: string = '';
  originalNote: string = '';
  isSavingNote = false;
  noteSavedRecently = false;
  isDeleting = false;
  confirmDelete = false;
  private _savedTimer: ReturnType<typeof setTimeout> | null = null;

  get event(): TrainingEvent {
    return this.data.event;
  }

  get isReadOnly(): boolean {
    return this.data.event.readOnly === true;
  }

  ngOnInit(): void {
    this.noteText = this.data.event.note ?? '';
    this.originalNote = this.noteText;
  }

  onReuse(): void {
    this.builderState.setReuseEvent(this.event);
    this.dialogRef.close();
    this.router.navigate(['/training-builder']);
  }

  onEditPlan(): void {
    this.builderState.setExistingEvent(this.event);
    this.dialogRef.close({ action: 'edit', event: this.event });
    this.router.navigate(['/training-builder']);
  }

  onNoteBlur(): void {
    if (this.noteText === this.originalNote || this.isSavingNote) return;
    this.isSavingNote = true;
    this.noteSavedRecently = false;
    this.cdr.markForCheck();
    this.trainingService.updateNote(this.event.id, this.noteText).subscribe({
      next: () => {
        this.isSavingNote = false;
        this.noteSavedRecently = true;
        this.originalNote = this.noteText;
        if (this._savedTimer) clearTimeout(this._savedTimer);
        this._savedTimer = setTimeout(() => {
          this.noteSavedRecently = false;
          this.cdr.markForCheck();
        }, 2000);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSavingNote = false;
        this.snackBar.open('Failed to save note.', 'Close', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.markForCheck();
      },
    });
  }

  onDeleteClick(): void {
    this.confirmDelete = true;
    this.cdr.markForCheck();
  }

  onDeleteConfirm(): void {
    if (this.isDeleting) return;
    this.isDeleting = true;
    this.trainingService.deleteSession(this.event.id).subscribe({
      next: () => {
        this.dialogRef.close({ action: 'deleted' });
        this.snackBar.open('Session deleted.', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
      error: (err) => {
        this.isDeleting = false;
        this.confirmDelete = false;
        const msg = err.error?.error ?? 'Failed to delete session.';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
        this.cdr.markForCheck();
      },
    });
  }

  onDeleteCancel(): void {
    this.confirmDelete = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
