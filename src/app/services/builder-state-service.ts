// src/app/services/builder-state.service.ts
import { Injectable, signal } from '@angular/core';
import { TrainingEvent } from '../models/training-event-model';
import { Drill } from '../models/drill-model';

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  targetDate = signal<Date | null>(null);
  existingEvent = signal<TrainingEvent | null>(null);

  setDate(date: Date): void {
    this.targetDate.set(date);
  }

  setExistingEvent(event: TrainingEvent): void {
    this.existingEvent.set(event);
    this.targetDate.set(event.date);
  }

  clear(): void {
    this.targetDate.set(null);
    this.existingEvent.set(null);
  }
}
