import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LayoutComponent } from '../../components/layout/layout';
import { PlayerCardComponent } from '../../components/player-card/player-card';
import { InjuriesSectionComponent } from '../../components/injuries-section/injuries-section';
import { PlayerPerformanceChartComponent } from '../../components/player-performance-chart/player-performance-chart';
import { Button } from '../../components/button/button';
import { Player, GameStat, PerformanceMetric } from '../../models/player.model';
import { PlayerService, PlayerStatsDTO } from '../../services/player.service';

@Component({
  selector: 'app-player-roster',
  templateUrl: './player-roster.html',
  styleUrl: './player-roster.css',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    LayoutComponent,
    PlayerCardComponent,
    InjuriesSectionComponent,
    PlayerPerformanceChartComponent,
    Button,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerRosterComponent implements OnInit {
  selectedPlayer: Player | null = null;

  statusFilter: 'all' | 'active' | 'injured' = 'all';
  positionFilter: string = 'All Positions';
  selectionFilter: string = 'All Selections';
  selectedSeason: string = '2025-2026';
  selectedVsTeam: string = 'All Teams';

  players: Player[] = [];

  gameStats: GameStat[] = [];
  rawStats: PlayerStatsDTO[] = [];
  isLoadingStats = false;

  private readonly playerService = inject(PlayerService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.playerService.getPlayers().subscribe({
      next: (backendPlayers) => {
        this.players = backendPlayers.map((p) => this.playerService.mapPlayer(p));
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load players', err),
    });
  }

  get filteredPlayers(): Player[] {
    return this.players.filter((player) => {
      if (this.statusFilter !== 'all' && player.status !== this.statusFilter) return false;
      if (this.positionFilter !== 'All Positions' && player.position !== this.positionFilter)
        return false;
      if (this.selectionFilter !== 'All Selections' && player.selection !== this.selectionFilter)
        return false;
      return true;
    });
  }

  get leagueTeams(): string[] {
    const teams = new Set<string>();
    this.rawStats.forEach(s => {
      if (s.opponent) teams.add(s.opponent);
    });
    return Array.from(teams).sort();
  }

  get filteredGameStats(): GameStat[] {
    if (this.selectedVsTeam === 'All Teams') return this.gameStats;
    return this.gameStats.filter(s => s.game.includes(this.selectedVsTeam));
  }

  get radarData(): PerformanceMetric[] {
    return this.playerService.radarData(this.gameStats);
  }

  onPlayerSelect(player: Player): void {
    this.selectedPlayer = player;
    this.gameStats = [];
    this.isLoadingStats = true;
    this.playerService.getPlayerStats(Number(player.id)).subscribe({
      next: (stats) => {
        this.rawStats = stats;
        this.gameStats = stats.map((s) => this.playerService.mapStat(s));
        this.selectedVsTeam = 'All Teams';
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load player stats', err);
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeModal(): void {
    this.selectedPlayer = null;
  }
  onHasActiveInjuryChange(hasActive: boolean): void {
    if (!this.selectedPlayer) return;
    const newStatus: 'active' | 'injured' = hasActive ? 'injured' : 'active';
    this.players = this.players.map(p =>
      p.id === this.selectedPlayer!.id ? { ...p, status: newStatus } : p
    );
    this.selectedPlayer = { ...this.selectedPlayer, status: newStatus };
    this.cdr.markForCheck();
  }
}
