import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TrainingEvent, EventDetailData } from '../../../models/training-event-model';
import { SelectTrainingDialogComponent } from '../select-training-dialog/select-training-dialog';
import { Button } from '../../button/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, Button],
  templateUrl: './event-detail-dialog.html',
  styleUrl: './event-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EventDetailDialogComponent>);
  readonly data = inject<EventDetailData>(MAT_DIALOG_DATA);
  readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  get event(): TrainingEvent {
    return this.data.event;
  }

  onReuse(): void {
    this.dialogRef.close();
    this.dialog.open(SelectTrainingDialogComponent, {
      width: '640px',
      maxHeight: '90vh',
      data: { targetDate: new Date() },
    });
  }

  onEditPlan(): void {
    // Navigate to Training Builder with this event's data
    this.dialogRef.close({ action: 'edit', event: this.event });
    this.router.navigate(['/training-builder']);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
