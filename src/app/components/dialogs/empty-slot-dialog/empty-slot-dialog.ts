import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Button} from '../../button/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EmptySlotData } from '../../../models/training-event.model';
import { SelectTrainingDialogComponent } from '../select-training-dialog/select-training-dialog';
import { CreateTrainingDialogComponent } from '../create-training-dialog/create-training-dialog';

@Component({
  selector: 'app-empty-slot-dialog',
  standalone: true,
  imports: [CommonModule, Button, MatDialogModule, MatIconModule],
  templateUrl: './empty-slot-dialog.html',
  styleUrl: './empty-slot-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptySlotDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EmptySlotDialogComponent>);
  readonly data = inject<EmptySlotData>(MAT_DIALOG_DATA);
  readonly dialog = inject(MatDialog);

  onUseExisting(): void {
    this.dialogRef.close();
    this.dialog.open(SelectTrainingDialogComponent, {
      width: '640px',
      maxHeight: '90vh',
      data: { targetDate: this.data.date },
    });
  }

  onGenerateNew(): void {
    this.dialogRef.close();
    this.dialog.open(CreateTrainingDialogComponent, {
      width: '520px',
      data: { date: this.data.date },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
