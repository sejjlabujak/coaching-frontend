import { Input, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'progress-tracker',
  standalone: true,
  templateUrl: 'progress-tracker.html',
  styleUrl: 'progress-tracker.css',
  imports: [CommonModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressTrackerComponent {
  @Input() duration = 0;
  @Input() goal = 90;
  get percent() {
    return Math.min(100, Math.round((this.duration / this.goal) * 100));
  }
}
