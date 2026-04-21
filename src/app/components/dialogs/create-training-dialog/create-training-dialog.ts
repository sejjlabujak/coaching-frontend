import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../../button/button'
import { Router } from '@angular/router';
import {
  CreateTrainingFormData,
  EmptySlotData,
  TrainingFocus,
  IntensityLevel,
  AgeSelection,
} from '../../../models/training-event-model';
import { BuilderStateService } from '../../../services/builder-state-service';

@Component({
  selector: 'app-create-training-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, Button],
  templateUrl: './create-training-dialog.html',
  styleUrl: './create-training-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTrainingDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateTrainingDialogComponent>);
  readonly data = inject<EmptySlotData>(MAT_DIALOG_DATA);
  private readonly router = inject(Router);
  private readonly builderState = inject(BuilderStateService);

  focusOptions: TrainingFocus[] = [
    'Shooting',
    'Defense',
    'Offense',
    'Conditioning',
    'Recovery',
    'Rebounding',
    'Team Building',
  ];

  intensityOptions: IntensityLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

  groupOptions: AgeSelection[] = ['U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];

  formData = signal<CreateTrainingFormData>({
    date: this.data?.date ?? null,
    duration: 0,
    focus: 'Shooting',
    intensity: 'LOW',
    ageGroup: 'U16',
  });

  get dateString(): string {
    const d = this.formData().date;
    if (!d) return '';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  onDateChange(value: string): void {
    const date = value ? new Date(value + 'T00:00:00') : null;
    this.formData.update((f) => ({ ...f, date }));
  }

  onFieldChange<K extends keyof CreateTrainingFormData>(
    field: K,
    value: CreateTrainingFormData[K],
  ): void {
    this.formData.update((f) => ({ ...f, [field]: value }));
  }
  onGenerate(): void {
    const form = this.formData();
    if (this.isFormValid()) {
      this.dialogRef.close({ action: 'generate', formData: form });
      this.router.navigate(['/training-builder']);
    }
  }
  onCancel(): void {
    this.dialogRef.close();
  }

  isFormValid(): boolean {
    const f = this.formData();
    return !!(f.date && f.duration > 0 && f.focus && f.intensity && f.ageGroup);
  }
}
