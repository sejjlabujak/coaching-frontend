import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TrainingEvent, SelectTrainingData } from '../../../models/training-event-model';
import { TrainingService } from '../../../services/training-service';
import { SearchInputComponent } from '../../search/search-input.component';
import { Button } from '../../button/button';
import { Router } from '@angular/router';
import { BuilderStateService } from '../../../services/builder-state-service';

@Component({
  selector: 'app-select-training-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, SearchInputComponent, Button],
  templateUrl: './select-training-dialog.html',
  styleUrl: './select-training-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectTrainingDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SelectTrainingDialogComponent>);
  readonly data = inject<SelectTrainingData>(MAT_DIALOG_DATA);
  private readonly trainingService = inject(TrainingService);
  private readonly router = inject(Router);
  private readonly builderState = inject(BuilderStateService);

  searchQuery = signal('');
  selectedEvent = signal<TrainingEvent | null>(null);

  filteredEvents = computed(() => this.trainingService.searchEvents(this.searchQuery()));

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onSelectEvent(event: TrainingEvent): void {
    this.selectedEvent.set(event);
  }

  isSelected(event: TrainingEvent): boolean {
    return this.selectedEvent()?.id === event.id;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onNext(): void {
    if (this.selectedEvent()) {
      this.builderState.setDate(this.data.targetDate);
      this.dialogRef.close({
        action: 'reuse',
        event: this.selectedEvent(),
        targetDate: this.data.targetDate,
      });
      this.router.navigate(['/training-builder']);
    }
  }
}
