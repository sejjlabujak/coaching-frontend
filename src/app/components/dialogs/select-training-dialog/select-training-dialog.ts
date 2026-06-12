import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TrainingEvent, SelectTrainingData } from '../../../models/training-event.model';
import { TrainingService } from '../../../services/training.service';
import { SessionBackendService } from '../../../services/session-backend.service';
import { SearchInputComponent } from '../../search/search-input.component';
import { Button } from '../../button/button';
import { Router } from '@angular/router';
import { BuilderStateService } from '../../../services/builder-state.service';

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
  private readonly sessionBackend = inject(SessionBackendService);
  private readonly router = inject(Router);
  private readonly builderState = inject(BuilderStateService);

  searchQuery = signal('');
  selectedEvent = signal<TrainingEvent | null>(null);
  allEvents = signal<TrainingEvent[]>([]);
  isLoading = signal(true);

  filteredEvents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allEvents();
    return this.allEvents().filter((e) => e.title.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    // Load all sessions once on dialog open
    this.trainingService.searchEvents('').subscribe({
      next: (events) => {
        this.allEvents.set(events);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

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
    const event = this.selectedEvent();
    if (!event) return;

    // Load full detail so drills are available in the builder
    this.sessionBackend.getSessionById(event.id).subscribe({
      next: (detail) => {
        const fullEvent: TrainingEvent = {
          id: event.id,
          title: detail.title,
          date: event.date,
          color: 'red',
          duration: detail.duration,
          intensity: detail.intensity as any,
          focus: detail.focus,
          drills: (detail.drills ?? []).map((d) => ({ id: d.id ?? 0, name: d.title })),
        };
        this.builderState.setReuseEvent(fullEvent);
        // Date is already known from the calendar click — set it so builder skips the picker
        this.builderState.setDate(this.data.targetDate);
        this.dialogRef.close();
        this.router.navigate(['/training-builder']);
      },
      error: () => {
        // Fallback: use basic event without drills
        this.builderState.setReuseEvent(event);
        this.builderState.setDate(this.data.targetDate);
        this.dialogRef.close();
        this.router.navigate(['/training-builder']);
      },
    });
  }
}
