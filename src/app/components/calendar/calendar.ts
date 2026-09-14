import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TrainingEvent } from '../../models/training-event.model';
import { TrainingService } from '../../services/training.service';
import { EventDetailDialogComponent } from '../dialogs/event-detail-dialog/event-detail-dialog';
import { EmptySlotDialogComponent } from '../dialogs/empty-slot-dialog/empty-slot-dialog';
import { Button } from '../button/button';
import { CreateTrainingDialogComponent } from '../dialogs/create-training-dialog/create-training-dialog';
import { BackendPlayer, PlayerService } from '../../services/player.service';

interface BirthdayReminder {
  name: string;
  month: number;
  day: number;
}

@Component({
  selector: 'calendar',
  templateUrl: 'calendar.html',
  standalone: true,
  styleUrl: 'calendar.css',
  imports: [CommonModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
  today = new Date();

  viewYear = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth());

  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private readonly dialog = inject(MatDialog);
  private readonly trainingService = inject(TrainingService);
  private readonly playerService = inject(PlayerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly birthdays = signal<BirthdayReminder[]>([]);

  ngOnInit(): void {
    this.playerService.getPlayers().subscribe({
      next: (players) => {
        this.birthdays.set(
          players
            .map((player) => this.toBirthdayReminder(player))
            .filter((birthday): birthday is BirthdayReminder => birthday !== null),
        );
        this.cdr.markForCheck();
      },
      error: () => {
        // Training events remain available if the roster cannot be loaded.
      },
    });
  }

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

  getBirthdays(day: number): BirthdayReminder[] {
    return this.birthdays().filter(
      (birthday) => birthday.month === this.viewMonth() && birthday.day === day,
    );
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
      this.trainingService.loadEventForDisplay(events[0].id, clickedDate, { readOnly: isPast }).subscribe({
        next: (fullEvent) => {
          this.dialog.open(EventDetailDialogComponent, {
            width: 'min(560px, 95vw)',
            maxHeight: '95vh',
            data: { event: fullEvent },
          });
        },
        error: () => {
          this.dialog.open(EventDetailDialogComponent, {
            width: 'min(560px, 95vw)',
            maxHeight: '95vh',
            data: { event: { ...events[0], readOnly: isPast } },
          });
        },
      });
    } else if (!isPast) {
      this.dialog.open(EmptySlotDialogComponent, {
        width: 'min(520px, 95vw)',
        maxHeight: '95vh',
        data: { date: clickedDate },
      });
    }
  }

  openEventDetail(event: TrainingEvent, $mouseEvent: MouseEvent): void {
    $mouseEvent.stopPropagation();
    this.trainingService.loadEventForDisplay(event.id, event.date).subscribe({
      next: (fullEvent) => {
        this.dialog.open(EventDetailDialogComponent, {
          width: 'min(560px, 95vw)',
          maxHeight: '95vh',
          data: { event: fullEvent },
        });
      },
      error: () => {
        this.dialog.open(EventDetailDialogComponent, {
          width: 'min(560px, 95vw)',
          maxHeight: '95vh',
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

  private toBirthdayReminder(player: BackendPlayer): BirthdayReminder | null {
    if (!player.birthDate) return null;

    // Parse the date portion directly to avoid a timezone shifting a birthday by one day.
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(player.birthDate);
    if (!match) return null;

    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;

    return {
      name: `${player.firstName} ${player.lastName}`.trim(),
      month,
      day,
    };
  }
}
