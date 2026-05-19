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
import { Player, Injury, GameStat, PerformanceMetric } from '../../models/player.model';
import { PlayerService, BackendPlayer } from '../../services/player.service';

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
  isSidebarExpanded = true;
  selectedPlayer: Player | null = null;

  statusFilter: 'all' | 'active' | 'injured' = 'all';
  positionFilter: string = 'All Positions';
  selectionFilter: string = 'All Selections';
  selectedSeason: string = '2025-2026';
  selectedVsTeam: string = 'All Teams';

  injuries: Injury[] = [];
  players: Player[] = [];

  // Hardcoded game stats — wire to backend IndividualPerformance if needed later
  gameStats: GameStat[] = [];

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
    const hasActiveInjury = p.injuries?.some((i) => i.active) ?? false;
    return {
      id: String(p.playerID),
      name: `${p.firstName} ${p.lastName}`,
      position: p.position ?? 'Unknown',
      status: hasActiveInjury ? 'injured' : 'active',
      performance: 75, // placeholder — no performance score from backend yet
      selection: (p.ageGroup as Player['selection']) ?? 'Senior',
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
    this.isSidebarExpanded = expanded;
  }
  onPlayerSelect(player: Player): void {
    this.selectedPlayer = player;
  }
  closeModal(): void {
    this.selectedPlayer = null;
  }
  onInjuriesChange(injuries: Injury[]): void {
    this.injuries = injuries;
  }
}
