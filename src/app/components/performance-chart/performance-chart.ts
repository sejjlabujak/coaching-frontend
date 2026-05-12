import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-performance-chart',
  template: `
    <div class="chart-container">
      <h3 class="chart-title">Team Performance Metrics</h3>
      <div class="metrics-grid">
        <div *ngFor="let metric of metrics" class="metric-item">
          <div class="metric-label">{{ metric.stat }}</div>
          <div class="metric-bar-wrapper">
            <div
              class="metric-bar"
              [style.width.%]="metric.value"
              [style.background-color]="getBarColor(metric.value)"
            ></div>
          </div>
          <div class="metric-value">{{ metric.value }}/{{ metric.fullMark }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './performance-chart.css',
  imports: [CommonModule],
  standalone: true,
})
export class PerformanceChartComponent {
  @Input() metrics: any[] = [];

  getBarColor(value: number): string {
    if (value >= 80) return '#059669'; // green
    if (value >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }
}

