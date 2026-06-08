import { Injectable, signal } from '@angular/core';
import { TrainingEvent } from '../models/training-event.model';
import { SessionBackendService, SessionDTO, SessionDetailDTO } from './session-backend.service';
import { map, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private events = signal<TrainingEvent[]>([]);
  isLoading = signal(false);

  constructor(private sessionBackend: SessionBackendService) {
    this.loadCurrentMonth();
  }

  loadCurrentMonth(): void {
    const now = new Date();
    this.loadMonth(now.getMonth() + 1, now.getFullYear());
  }

  loadMonth(month: number, year: number): void {
    this.isLoading.set(true);
    this.sessionBackend.getSessions(month, year).subscribe({
      next: (sessions) => {
        const events: TrainingEvent[] = sessions.map((s) => ({
          id: s.id,
          title: s.title,
          date: new Date(s.date + 'T00:00:00'),
          color: 'red' as const,
        }));
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  getEvents(): TrainingEvent[] {
    return this.events();
  }

  getEventsByDate(year: number, month: number, day: number): TrainingEvent[] {
    return this.events().filter(
      (e) =>
        e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day,
    );
  }

  searchEvents(query: string): Observable<TrainingEvent[]> {
    return this.sessionBackend.getSessions().pipe(
      map((sessions) => {
        const q = query.toLowerCase().trim();
        return sessions
          .filter((s) =>
            !q ||
            s.title.toLowerCase().includes(q)
          )
          .map((s) => ({
            id: s.id,
            title: s.title,
            date: new Date(s.date + 'T00:00:00'),
            color: 'red' as const,
          }));
      })
    );
  }

  addEvent(event: TrainingEvent): void {
    // Optimistically add to local state
    this.events.update((evs) => [...evs, event]);
  }

  updateEvent(updated: TrainingEvent): void {
    this.events.update((evs) => evs.map((e) => (e.id === updated.id ? updated : e)));
  }

  getNextId(): number {
    const ids = this.events().map((e) => e.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  saveSession(event: TrainingEvent): Observable<any> {
    const dto: SessionDetailDTO = {
      title: event.title,
      date: this.formatDate(event.date),
      duration: event.duration,
      intensity: event.intensity,
      focus: event.focus,
      ageGroup: event.ageGroup,
      drills: (event.drills ?? []).map((d, i) => ({
        title: d.name,
        duration: 0,
        orderIndex: i,
      })),
    };

    return this.sessionBackend.createSession(dto).pipe(
      tap((response) => {
        // Update local event with real ID from backend
        if (response?.id) {
          this.events.update((evs) =>
            evs.map((e) =>
              e.title === event.title && e.date.toDateString() === event.date.toDateString()
                ? { ...e, id: response.id }
                : e,
            ),
          );
        }
      }),
    );
  }

  loadEventDetail(id: number): Observable<any> {
    return this.sessionBackend.getSessionById(id);
  }

  reuseSession(id: number): Observable<any> {
    return this.sessionBackend.reuseSession(id);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
