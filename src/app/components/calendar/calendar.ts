import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TrainingEvent } from '../../models/training-event.model';
import { TrainingService } from '../../services/training.service';
import { SessionBackendService } from '../../services/session-backend.service';
import { EventDetailDialogComponent } from '../dialogs/event-detail-dialog/event-detail-dialog';
import { EmptySlotDialogComponent } from '../dialogs/empty-slot-dialog/empty-slot-dialog';
import { Button } from '../button/button';
import { CreateTrainingDialogComponent } from '../dialogs/create-training-dialog/create-training-dialog';

@Component({
  selector: 'calendar',
  templateUrl: 'calendar.html',
  standalone: true,
  styleUrl: 'calendar.css',
  imports: [CommonModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  today = new Date();

  viewYear = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth());

  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private readonly dialog = inject(MatDialog);
  private readonly trainingService = inject(TrainingService);
  private readonly sessionBackend = inject(SessionBackendService);
  private readonly cdr = inject(ChangeDetectorRef);

  get currentMonthLabel(): string {
    return new Date(this.viewYear(), this.viewMonth(), 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get daysInMonth(): number[] {
    const count = new Date(this.viewYear(), this.viewMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  get leadingEmpties(): number[] {
    const firstDay = new Date(this.viewYear(), this.viewMonth(), 1).getDay();
    return Array.from({ length: firstDay });
  }

  getEvents(day: number): TrainingEvent[] {
    return this.trainingService.getEventsByDate(this.viewYear(), this.viewMonth(), day);
  }

  isToday(day: number): boolean {
    return (
      day === this.today.getDate() &&
      this.viewMonth() === this.today.getMonth() &&
      this.viewYear() === this.today.getFullYear()
    );
  }

  isPastDay(day: number): boolean {
    const d = new Date(this.viewYear(), this.viewMonth(), day);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
    this.loadMonth();
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
    this.loadMonth();
  }

  private loadMonth(): void {
    // month + 1 because JS months are 0-indexed but backend expects 1-indexed
    this.trainingService.loadMonth(this.viewMonth() + 1, this.viewYear());
    this.cdr.markForCheck();
  }

  selectDay(day: number): void {
    const isPast = this.isPastDay(day);
    const clickedDate = new Date(this.viewYear(), this.viewMonth(), day);
    const events = this.getEvents(day);

    if (events.length > 0) {
      // Load full detail from backend before opening dialog
      this.sessionBackend.getSessionById(events[0].id).subscribe({
        next: (detail) => {
          const fullEvent: TrainingEvent = {
            id: detail.id!,
            title: detail.title,
            date: clickedDate,
            color: 'red',
            duration: detail.duration,
            intensity: detail.intensity as any,
            focus: detail.focus,
            ageGroup: detail.ageGroup as any,
            drills: (detail.drills ?? []).map((d) => ({
              id: d.id ?? 0,
              name: d.title,
            })),
            note: detail.note,
            readOnly: detail.readOnly ?? isPast,
          };
          this.dialog.open(EventDetailDialogComponent, {
            width: '560px',
            data: { event: fullEvent },
          });
        },
        error: () => {
          this.dialog.open(EventDetailDialogComponent, {
            width: '560px',
            data: { event: { ...events[0], readOnly: isPast } },
          });
        },
      });
    } else if (!isPast) {
      this.dialog.open(EmptySlotDialogComponent, {
        width: '520px',
        data: { date: clickedDate },
      });
    }
  }

  openEventDetail(event: TrainingEvent, $mouseEvent: MouseEvent): void {
    $mouseEvent.stopPropagation();
    this.sessionBackend.getSessionById(event.id).subscribe({
      next: (detail) => {
        const fullEvent: TrainingEvent = {
          id: detail.id!,
          title: detail.title,
          date: event.date,
          color: 'red',
          duration: detail.duration,
          intensity: detail.intensity as any,
          focus: detail.focus,
          ageGroup: detail.ageGroup as any,
          drills: (detail.drills ?? []).map((d) => ({
            id: d.id ?? 0,
            name: d.title,
          })),
          note: detail.note,
          readOnly: detail.readOnly,
        };
        this.dialog.open(EventDetailDialogComponent, {
          width: '560px',
          data: { event: fullEvent },
        });
      },
      error: () => {
        this.dialog.open(EventDetailDialogComponent, {
          width: '560px',
          data: { event },
        });
      },
    });
  }

  openNewTrainingDialog(): void {
    this.dialog.open(CreateTrainingDialogComponent, {
      width: '520px',
      data: { date: new Date() },
    });
  }
}
