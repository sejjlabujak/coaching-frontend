import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { Button } from '../button/button';
// import { DialogService } from '../modal/modal.service';
// import { CreateTrainingDialogComponent } from '../modal/dialogs/create-training-dialog';

export interface TrainingEvent {
  date: Date;
  title: string;
  color: 'red' | 'navy';
}

@Component({
  selector: 'calendar',
  templateUrl: 'calendar.html',
  standalone: true,
  styleUrl: 'calendar.css',
  imports: [CommonModule, ModalComponent, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  today = new Date();

  // Current view month/year
  viewYear = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth()); // 0-indexed

  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // constructor(private dialogService: DialogService) {
  //   this.openNewTraining();
  // }

  private openNewTraining(): void{
    console.log('Open new training dialog');
  }
  // openCreateTrainingDialog(): void {
  //   this.dialogService.openCreateTraining();
  // }
  // Sample events — replace / extend as needed
  events: TrainingEvent[] = [
    { date: new Date(2026, 3, 3), title: 'Shooting Focus', color: 'red' },
    { date: new Date(2026, 3, 5), title: 'Defense Drills', color: 'red' },
    { date: new Date(2026, 3, 8), title: 'Recovery Session', color: 'navy' },
    { date: new Date(2026, 3, 10), title: 'Offensive Tactics', color: 'red' },
    { date: new Date(2026, 3, 12), title: 'Scrimmage', color: 'red' },
    { date: new Date(2026, 3, 15), title: 'Conditioning', color: 'navy' },
    { date: new Date(2026, 3, 17), title: 'Rebounding Drills', color: 'red' },
    { date: new Date(2026, 3, 22), title: 'Team Building', color: 'navy' },
    { date: new Date(2026, 3, 25), title: 'Game Prep', color: 'red' },
  ];

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
    return this.events.filter(
      (e) =>
        e.date.getFullYear() === this.viewYear() &&
        e.date.getMonth() === this.viewMonth() &&
        e.date.getDate() === day,
    );
  }

  isToday(day: number): boolean {
    return (
      day === this.today.getDate() &&
      this.viewMonth() === this.today.getMonth() &&
      this.viewYear() === this.today.getFullYear()
    );
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  selectDay(day: number): void {
    console.log('Selected:', new Date(this.viewYear(), this.viewMonth(), day));
  }

}
