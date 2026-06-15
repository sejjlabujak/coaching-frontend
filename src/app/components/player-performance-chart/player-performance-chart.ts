import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PerformanceMetric } from '../../models/player.model';

Chart.register(...registerables);

@Component({
  selector: 'app-player-performance-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-performance-chart.html',
  styleUrl: './player-performance-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerPerformanceChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() metrics: PerformanceMetric[] = [];

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metrics'] && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'radar'> = {
      type: 'radar',
      data: {
        labels: this.metrics.map(m => m.stat),
        datasets: [
          {
            label: 'Player',
            data: this.metrics.map(m => m.value),
            backgroundColor: 'rgba(139, 26, 26, 0.20)',
            borderColor: '#8b1a1a',
            borderWidth: 2,
            pointBackgroundColor: '#8b1a1a',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.r} / 100`,
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 25,
              color: '#94a3b8',
              backdropColor: 'transparent',
              font: { size: 10 },
            },
            grid: { color: '#e2e8f0' },
            angleLines: { color: '#e2e8f0' },
            pointLabels: {
              color: '#1f2937',
              font: { size: 12, weight: 600 },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.data.labels = this.metrics.map(m => m.stat);
    this.chart.data.datasets[0].data = this.metrics.map(m => m.value);
    this.chart.update();
  }
}
