import { Injectable, signal } from '@angular/core';
import { TrainingEvent } from '../models/training-event.model';

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  private _targetDate = signal<Date | null>(null);
  private _existingEvent = signal<TrainingEvent | null>(null);

  // Read-only public access
  targetDate = this._targetDate.asReadonly();
  existingEvent = this._existingEvent.asReadonly();

  setDate(date: Date): void {
    this._targetDate.set(date);
  }

  setExistingEvent(event: TrainingEvent): void {
    this._existingEvent.set(event);
    this._targetDate.set(event.date);
  }

  clear(): void {
    this._targetDate.set(null);
    this._existingEvent.set(null);
  }

  hasState(): boolean {
    return this._targetDate() !== null || this._existingEvent() !== null;
  }
}
