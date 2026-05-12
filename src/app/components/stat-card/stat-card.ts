import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">{{ label }}</span>
        <mat-icon [class]="'stat-icon ' + colorClass">{{ icon }}</mat-icon>
      </div>
      <div class="stat-value">{{ value }}</div>
    </div>
  `,
  styleUrl: './stat-card.css',
  imports: [CommonModule, MatIconModule],
  standalone: true,
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() icon: string = '';
  @Input() color: 'primary' | 'destructive' | 'secondary' = 'primary';

  get colorClass(): string {
    return `color-${this.color}`;
  }
}

