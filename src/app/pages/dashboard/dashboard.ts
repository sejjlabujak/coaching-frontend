import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { StatCardComponent } from '../../components/stat-card/stat-card';
import { TeamAnalysisComponent } from '../../components/team-analysis/team-analysis';
import { RecentTeamGamesComponent, RecentTeamGame } from '../../components/recent-team-games/recent-team-games';
import { StatCard, TeamAnalysis } from '../../models/dashboard.model';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface RecommendationDTO {
  weakArea: string;
  averageStat: string;
  analysis: string;
  recommendedDrills: { title: string; focus: string }[];
}

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
    TeamAnalysisComponent,
    RecentTeamGamesComponent,
  ],
  standalone: true,
})
export class DashboardComponent implements OnInit {
  readonly sidebarState = inject(SidebarStateService);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }

  recommendations = signal<RecommendationDTO[]>([]);
  recentGames = signal<RecentTeamGame[]>([]);
  playerCount = signal<number>(0);
  loading = signal(true);
  error = signal<string | null>(null);

  stats = computed<StatCard[]>(() => [
    {
      label: 'Active Players',
      value: String(this.playerCount()),
      icon: 'people',
      color: 'primary',
    },
    {
      label: 'Weak Areas',
      value: String(this.recommendations().length),
      icon: 'warning',
      color: 'destructive',
    },
    {
      label: 'Team',
      value: this.auth.teamName() ?? '—',
      icon: 'groups',
      color: 'secondary',
    },
  ]);

  teamAnalysis = computed<TeamAnalysis>(() => {
    const recs = this.recommendations();
    if (recs.length === 0) {
      return {
        strengths: 'Loading team analysis...',
        improvements: '',
        recommendation: '',
      };
    }
    const weakAreas = recs.map(r => r.weakArea).join(', ');
    const analyses = recs.map(r => r.analysis).filter(Boolean).join(' ');
    const drills = recs.flatMap(r => r.recommendedDrills ?? []).map(d => d.title).slice(0, 3).join(', ');

    return {
      strengths: analyses || 'Analysis based on recent game data.',
      improvements: `Weak areas detected: ${weakAreas}.`,
      recommendation: drills ? `Recommended drills: ${drills}.` : 'No specific drills recommended yet.',
    };
  });

  ngOnInit(): void {
    this.loadPlayers();
    this.loadRecommendations();
    this.loadRecentGames();
  }

  private loadRecentGames(): void {
    this.http.get<RecentTeamGame[]>(`${environment.apiUrl}/api/team-stats/recent`).subscribe({
      next: (games) => this.recentGames.set(games),
      error: () => this.recentGames.set([]),
    });
  }

  private loadPlayers(): void {
    this.http.get<unknown[]>(`${environment.apiUrl}/api/players`).subscribe({
      next: (players) => this.playerCount.set(players.length),
      error: () => {},
    });
  }

  private loadRecommendations(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<RecommendationDTO[]>(`${environment.apiUrl}/api/recommendations`).subscribe({
      next: (data) => {
        this.recommendations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.error ?? 'Failed to load recommendations.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  onExpandedChange(expanded: boolean) {
    this.sidebarState.isExpanded = expanded;
  }
}
