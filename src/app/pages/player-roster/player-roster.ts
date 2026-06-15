import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { PlayerCardComponent } from '../../components/player-card/player-card';
import { InjuriesSectionComponent } from '../../components/injuries-section/injuries-section';
import { PlayerPerformanceChartComponent } from '../../components/player-performance-chart/player-performance-chart';
import { Button } from '../../components/button/button';
import { Player, GameStat, PerformanceMetric } from '../../models/player.model';
import { PlayerService, BackendPlayer, PlayerStatsDTO } from '../../services/player.service';

import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-player-roster',
  templateUrl: './player-roster.html',
  styleUrl: './player-roster.css',
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatIconModule,
    HeaderComponent,
    SidebarComponent,
    PlayerCardComponent,
    InjuriesSectionComponent,
    PlayerPerformanceChartComponent,
    Button,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerRosterComponent implements OnInit {
  readonly sidebarState = inject(SidebarStateService);
  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }
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
        this.players = backendPlayers.map(this.mapPlayer);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load players', err),
    });
  }

  private mapPlayer(p: BackendPlayer): Player {
    const hasActiveInjury = p.injuries?.some((i) => i.isActive ?? i.active) ?? false;
    const age = p.birthDate
      ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined;
    return {
      id: String(p.playerID),
      name: `${p.firstName} ${p.lastName}`,
      position: p.position ?? 'Unknown',
      status: hasActiveInjury ? 'injured' : 'active',
      performance: 75,
      selection: (p.ageGroup as Player['selection']) ?? 'Senior',
      imageUrl: p.images?.[0]?.url ?? undefined,
      age,
    };
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
    if (!this.gameStats.length) return [];
    const totalAssists = this.gameStats.reduce((sum, g) => sum + g.as, 0);
    const totalTurnovers = this.gameStats.reduce((sum, g) => sum + g.to, 0);
    const avgFG = this.gameStats.reduce((sum, g) => sum + g.fg, 0) / this.gameStats.length;
    const totalOff = this.gameStats.reduce((sum, g) => sum + g.fo + g.orb + g.pts, 0);
    const totalDef = this.gameStats.reduce((sum, g) => sum + g.stl + g.blk, 0);
    const totalReb = this.gameStats.reduce((sum, g) => sum + g.orb + g.drb, 0);
    return [
      {
        stat: 'Playmaking',
        value: Math.min(100, Math.round((totalAssists / Math.max(totalTurnovers, 1)) * 20)),
      },
      { stat: 'Shooting', value: Math.round(avgFG) },
      {
        stat: 'Off. Aggression',
        value: Math.min(100, Math.round((totalOff / (this.gameStats.length * 35)) * 100)),
      },
      {
        stat: 'Def. Aggression',
        value: Math.min(100, Math.round((totalDef / (this.gameStats.length * 5)) * 100)),
      },
      {
        stat: 'Rebounding',
        value: Math.min(100, Math.round((totalReb / (this.gameStats.length * 10)) * 100)),
      },
    ];
  }

  onExpandedChange(expanded: boolean): void {
    this.sidebarState.isExpanded = expanded;
  }
  onPlayerSelect(player: Player): void {
    this.selectedPlayer = player;
    this.gameStats = [];
    this.isLoadingStats = true;
    this.playerService.getPlayerStats(Number(player.id)).subscribe({
      next: (stats) => {
        this.rawStats = stats;
        this.gameStats = stats.map(this.mapStat);
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

  private mapStat(s: PlayerStatsDTO): GameStat {
    const n = (v: number | null) => v ?? 0;
    const fgm = n(s.fieldGoalsMade);
    const fga = n(s.fieldGoalsAttempted);
    const ftm = n(s.freeThrowsMade);
    const fta = n(s.freeThrowsAttempted);
    const pts = n(s.points);
    const rb = n(s.reboundsTotal);
    const ast = n(s.assists);
    const stl = n(s.steals);
    const blk = n(s.blocks);
    const to = n(s.turnovers);
    const eff = pts + rb + ast + stl + blk - (fga - fgm) - (fta - ftm) - to;
    const gameLabel = s.opponent
      ? `vs ${s.opponent}${s.date ? ' ' + s.date : ''}`
      : s.date ?? `Game ${s.gameId}`;
    return {
      game: gameLabel,
      fg: fgm,
      pct: n(s.fieldGoalsPercentage),
      twoP: n(s.threePointersAttempted) > 0
        ? Math.round(((fgm - n(s.threePointersMade)) / Math.max(fga - n(s.threePointersAttempted), 1)) * 100)
        : fga > 0 ? Math.round((fgm / fga) * 100) : 0,
      threeP: n(s.threePointersPercentage),
      pts,
      as: ast,
      rb,
      orb: n(s.reboundsOffensive),
      drb: n(s.reboundsDefensive),
      ft: n(s.freeThrowsPercentage),
      fo: n(s.foulsPersonal),
      eff,
      to,
      stl,
      blk,
    };
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
