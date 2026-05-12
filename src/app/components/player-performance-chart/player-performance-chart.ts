import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceMetric } from '../../models/player.model';

@Component({
  selector: 'app-player-performance-chart',
  template: `
    <div class="chart-container">
      <h4 class="chart-title">Player Performance Metrics</h4>
      <div class="metrics-grid">
        <div *ngFor="let metric of metrics" class="metric-item">
          <div class="metric-label">{{ metric.stat }}</div>
          <div class="metric-bar-wrapper">
            <div
              class="metric-bar"
              [style.width.%]="metric.value"
            ></div>
          </div>
          <div class="metric-value">{{ metric.value }}/100</div>
        </div>
      </div>
      <div class="legend">
        <p>• Playmaking = Assist / Turnover</p>
        <p>• Shooting = eFG%</p>
        <p>• Offensive Aggression = Driven Fouls + ORB + Points</p>
        <p>• Defensive Aggression = Steal + Block</p>
        <p>• Rebounding = ORB + DRB</p>
      </div>
    </div>
  `,
  styleUrl: './player-performance-chart.css',
  imports: [CommonModule],
  standalone: true,
})
export class PlayerPerformanceChartComponent {
  @Input() metrics: PerformanceMetric[] = [];
}

