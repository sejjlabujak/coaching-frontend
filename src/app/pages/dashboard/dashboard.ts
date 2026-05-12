import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { StatCardComponent } from '../../components/stat-card/stat-card';
import { PerformanceChartComponent } from '../../components/performance-chart/performance-chart';
import { TeamAnalysisComponent } from '../../components/team-analysis/team-analysis';
import { StatCard, PerformanceMetric, TeamAnalysis } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [
    CommonModule,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent,
    StatCardComponent,
    PerformanceChartComponent,
    TeamAnalysisComponent,
  ],
  standalone: true,
})
export class DashboardComponent {
  isSidebarExpanded = true;

  stats: StatCard[] = [
    {
      label: 'Active Players',
      value: '24',
      icon: 'people',
      color: 'primary',
    },
    {
      label: 'Team Efficiency',
      value: '3',
      icon: 'warning',
      color: 'destructive',
    },
    {
      label: 'Upcoming Practice',
      value: '2 days',
      icon: 'calendar_today',
      color: 'secondary',
    },
  ];

  metrics: PerformanceMetric[] = [
    { stat: 'Shooting', value: 85, fullMark: 100 },
    { stat: 'Defense', value: 72, fullMark: 100 },
    { stat: 'Rebounds', value: 78, fullMark: 100 },
    { stat: 'Assists', value: 68, fullMark: 100 },
    { stat: 'Speed', value: 82, fullMark: 100 },
    { stat: 'Stamina', value: 75, fullMark: 100 },
  ];

  teamAnalysis: TeamAnalysis = {
    strengths:
      'The team shows exceptional shooting accuracy (85%) and speed metrics. Defense coordination has improved by 12% over the last month.',
    improvements:
      'Assist rates need attention. Consider drills focused on passing and court awareness.',
    recommendation:
      'Increase intensity in defensive drills and add dedicated assist training sessions.',
  };

  onExpandedChange(expanded: boolean) {
    this.isSidebarExpanded = expanded;
  }
}

