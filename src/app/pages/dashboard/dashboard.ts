import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LayoutComponent } from '../../components/layout/layout';
import { StatCardComponent } from '../../components/stat-card/stat-card';
import { RecentTeamGamesComponent, RecentTeamGame } from '../../components/recent-team-games/recent-team-games';
import { Button } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { CoachingInsight, InsightPriority } from '../../models/coaching-insight.model';
import { CoachingInsightCardComponent } from '../../components/coaching-insight-card/coaching-insight-card';
import { CoachingInsightDialogComponent } from '../../components/dialogs/coaching-insight-dialog/coaching-insight-dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface RecommendationDTO { weakArea: string; averageStat: string; analysis: string; recommendedDrills: { drillTitle?: string; title?: string }[]; }
type Metric = 'points' | 'fg' | 'three' | 'rebounds' | 'assists' | 'turnovers';
const metricLabels: Record<Metric, string> = { points: 'Points', fg: 'FG%', three: '3P%', rebounds: 'Rebounds', assists: 'Assists', turnovers: 'Turnovers' };

@Component({ selector: 'app-dashboard', standalone: true, templateUrl: './dashboard.html', styleUrl: './dashboard.css', imports: [CommonModule, FormsModule, LayoutComponent, StatCardComponent, RecentTeamGamesComponent, Button, CoachingInsightCardComponent, TranslatePipe] })
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient); readonly auth = inject(AuthService); readonly router = inject(Router); private readonly dialog = inject(MatDialog);
  games = signal<RecentTeamGame[]>([]); recommendations = signal<RecommendationDTO[]>([]); loading = signal(true); error = signal<string | null>(null); selectedMetric: Metric = 'points';
  readonly periodLabel = computed(() => `Last ${this.games().length} game${this.games().length === 1 ? '' : 's'}`);
  readonly metrics = Object.entries(metricLabels) as [Metric, string][];
  readonly metricLabels = metricLabels;
  readonly summary = computed(() => { const games = this.games(); const average = (fn: (g: RecentTeamGame) => number | null | undefined) => games.length ? games.reduce((sum, game) => sum + (fn(game) ?? 0), 0) / games.length : 0; const pct = (value: number) => `${Math.round(value)}%`; return [
    { label: 'POINTS / GAME', value: average(g => g.ourScore).toFixed(1), icon: 'scoreboard', color: 'primary' as const },
    { label: 'FG% · ' + this.periodLabel(), value: pct(average(g => g.fieldGoalsPercentage)), icon: 'sports_basketball', color: 'secondary' as const },
    { label: '3P% · ' + this.periodLabel(), value: pct(average(g => g.threePointersPercentage)), icon: 'change_history', color: 'secondary' as const },
    { label: 'REBOUNDS / GAME', value: average(g => g.reboundsTotal).toFixed(1), icon: 'rebase_edit', color: 'primary' as const },
    { label: 'ASSISTS / GAME', value: average(g => g.assists).toFixed(1), icon: 'group', color: 'primary' as const },
    { label: 'TURNOVERS / GAME', value: average(g => g.turnovers).toFixed(1), icon: 'warning_amber', color: 'destructive' as const },
  ]; });
  readonly strengths = computed(() => { const s = this.summary(); const games = this.games().length; if (!games) return []; const result = []; if (+s[3].value >= 35) result.push({ title: 'Rebounding', detail: `${s[3].value} rebounds per game` }); if (+s[1].value >= 45) result.push({ title: 'Field goal shooting', detail: `${s[1].value} over ${this.periodLabel().toLowerCase()}` }); if (+s[4].value >= 14) result.push({ title: 'Ball movement', detail: `${s[4].value} assists per game` }); return result.slice(0, 2); });
  readonly improvements = computed(() => { const s = this.summary(); const games = this.games().length; if (!games) return []; const result = []; if (+s[5].value >= 15) result.push({ title: 'Turnovers', detail: `${s[5].value} per game` }); if (+s[2].value < 30) result.push({ title: '3-point shooting', detail: `${s[2].value} over ${this.periodLabel().toLowerCase()}` }); if (+s[1].value < 40) result.push({ title: 'Field goal shooting', detail: `${s[1].value} over ${this.periodLabel().toLowerCase()}` }); return result.slice(0, 2); });
  readonly insights = computed<CoachingInsight[]>(() => this.recommendations().map(recommendation => this.toInsight(recommendation)).sort((a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority)));
  readonly chartData = computed(() => { const chronological = [...this.games()].reverse(); const values = chronological.map(game => this.metricValue(game)); const maximum = Math.max(...values, 1); return chronological.map((game, index) => ({ game, value: values[index], x: chronological.length === 1 ? 50 : 5 + index * 90 / (chronological.length - 1), y: 90 - values[index] * 75 / maximum })); });
  readonly chartPath = computed(() => this.chartData().map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '));
  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.error.set(null); this.http.get<RecentTeamGame[]>(`${environment.apiUrl}/api/team-stats/recent`).subscribe({ next: games => { this.games.set(games); this.loading.set(false); }, error: () => { this.error.set("Team statistics couldn't be loaded."); this.loading.set(false); } }); this.http.get<RecommendationDTO[]>(`${environment.apiUrl}/api/recommendations`).subscribe({ next: value => this.recommendations.set(value), error: () => this.recommendations.set([]) }); }
  metricValue(game: RecentTeamGame) { const map: Record<Metric, number> = { points: game.ourScore ?? 0, fg: game.fieldGoalsPercentage ?? 0, three: game.threePointersPercentage ?? 0, rebounds: game.reboundsTotal ?? 0, assists: game.assists ?? 0, turnovers: game.turnovers ?? 0 }; return map[this.selectedMetric]; }
  openInsight(insight: CoachingInsight) { this.dialog.open(CoachingInsightDialogComponent, { width: '650px', maxWidth: '94vw', data: insight }); }
  private toInsight(recommendation: RecommendationDTO): CoachingInsight { const priority = this.priorityFor(recommendation); const focus = this.focusFor(recommendation.weakArea); return { id: recommendation.weakArea.toLowerCase().replace(/[^a-z0-9]+/g, '-'), priority, title: recommendation.weakArea, metric: recommendation.averageStat, explanation: recommendation.analysis, trainingFocus: focus, recommendedDrills: (recommendation.recommendedDrills ?? []).map((drill, index) => ({ drillId: (drill as { drillId?: number }).drillId ?? index, drillTitle: drill.drillTitle ?? drill.title ?? 'Recommended drill', reason: (drill as { reason?: string }).reason ?? '' })) }; }
  private priorityFor(recommendation: RecommendationDTO): InsightPriority { const area = recommendation.weakArea.toLowerCase(); const metric = recommendation.averageStat.toLowerCase(); if (area.includes('turnover') || metric.includes('turnover')) return 'HIGH'; if (area.includes('shoot') || area.includes('rebound') || area.includes('assist')) return 'MEDIUM'; return 'LOW'; }
  private priorityValue(priority: InsightPriority) { return ({ HIGH: 3, MEDIUM: 2, LOW: 1 })[priority]; }
  private focusFor(area: string): string[] { const key = area.toLowerCase(); if (key.includes('turnover') || key.includes('ball')) return ['Ball handling under pressure', 'Passing decisions and spacing']; if (key.includes('shoot') || key.includes('perimeter')) return ['Shooting mechanics', 'Shot selection under pressure']; if (key.includes('rebound')) return ['Boxing out technique', 'Rebounding positioning']; return ['Review the full recommendation and select suitable drills']; }
  importGame() { this.router.navigate(['/statistics-import']); }
}
