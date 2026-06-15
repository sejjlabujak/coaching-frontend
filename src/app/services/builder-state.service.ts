import { Injectable, signal } from '@angular/core';
import { TrainingEvent } from '../models/training-event.model';

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  private _targetDate = signal<Date | null>(null);
  private _existingEvent = signal<TrainingEvent | null>(null);
  private _goalDuration = signal<number>(90);
  private _startTime = signal<string>('09:00');
  private _plannedFocus = signal<string | null>(null);

  targetDate = this._targetDate.asReadonly();
  existingEvent = this._existingEvent.asReadonly();
  goalDuration = this._goalDuration.asReadonly();
  startTime = this._startTime.asReadonly();
  plannedFocus = this._plannedFocus.asReadonly();

  setDate(date: Date): void {
    this._targetDate.set(date);
  }

  setGoalDuration(minutes: number): void {
    this._goalDuration.set(minutes > 0 ? minutes : 90);
  }

  setStartTime(time: string): void {
    this._startTime.set(time || '09:00');
  }

  setExistingEvent(event: TrainingEvent): void {
    this._existingEvent.set(event);
    this._targetDate.set(event.date);
    if (event.duration) this._goalDuration.set(event.duration);
  }

  /** Load drills + goal from an event but leave date empty — for reuse flow. */
  setReuseEvent(event: TrainingEvent): void {
    this._existingEvent.set({ ...event, id: -1 }); // id -1 = not yet saved
    this._targetDate.set(null);
    if (event.duration) this._goalDuration.set(event.duration);
  }

  setPlannedFocus(focus: string | null): void {
    this._plannedFocus.set(focus);
  }

  clear(): void {
    this._targetDate.set(null);
    this._existingEvent.set(null);
    this._goalDuration.set(90);
    this._startTime.set('09:00');
    this._plannedFocus.set(null);
  }

  hasState(): boolean {
    return this._targetDate() !== null || this._existingEvent() !== null;
  }
}
