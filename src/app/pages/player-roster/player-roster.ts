import { Component } from '@angular/core';
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
})
export class PlayerRosterComponent {
  isSidebarExpanded = true;
  selectedPlayer: Player | null = null;

  // Filters
  statusFilter: 'all' | 'active' | 'injured' = 'all';
  positionFilter: string = 'All Positions';
  selectionFilter: string = 'All Selections';
  selectedSeason: string = '2025-2026';
  selectedVsTeam: string = 'All Teams';

  // Injuries
  injuries: Injury[] = [
    {
      id: '1',
      status: 'OUT',
      name: 'Minor Ankle Sprain',
      date: 'Dec 2025',
      recovery: '2 weeks',
    },
    {
      id: '2',
      status: 'HEALED',
      name: 'Knee Contusion',
      date: 'Oct 2025',
    },
  ];

  players: Player[] = [
    {
      id: '1',
      name: 'Marcus Johnson',
      position: 'Point Guard',
      status: 'active',
      performance: 85,
      selection: 'Senior',
    },
    {
      id: '2',
      name: 'Tyler Williams',
      position: 'Shooting Guard',
      status: 'active',
      performance: 78,
      selection: 'Senior',
    },
    {
      id: '3',
      name: 'James Anderson',
      position: 'Small Forward',
      status: 'injured',
      performance: 72,
      selection: 'U18',
    },
    {
      id: '4',
      name: 'David Miller',
      position: 'Power Forward',
      status: 'active',
      performance: 88,
      selection: 'Senior',
    },
    {
      id: '5',
      name: 'Chris Davis',
      position: 'Center',
      status: 'active',
      performance: 82,
      selection: 'U18',
    },
    {
      id: '6',
      name: 'Alex Thompson',
      position: 'Point Guard',
      status: 'active',
      performance: 75,
      selection: 'U16',
    },
    {
      id: '7',
      name: 'Ryan Martinez',
      position: 'Shooting Guard',
      status: 'active',
      performance: 80,
      selection: 'U18',
    },
    {
      id: '8',
      name: 'Kevin Brown',
      position: 'Small Forward',
      status: 'injured',
      performance: 68,
      selection: 'U16',
    },
    {
      id: '9',
      name: 'Brandon Lee',
      position: 'Power Forward',
      status: 'active',
      performance: 84,
      selection: 'Senior',
    },
    {
      id: '10',
      name: 'Jordan White',
      position: 'Center',
      status: 'active',
      performance: 79,
      selection: 'U14',
    },
  ];

  gameStats: GameStat[] = [
    {
      game: 'vs Lakers',
      fg: 48,
      pct: 48,
      twoP: 52,
      threeP: 38,
      pts: 24,
      as: 6,
      rb: 5,
      orb: 2,
      drb: 3,
      ft: 85,
      fo: 3,
      eff: 22,
      to: 3,
      stl: 2,
      blk: 1,
    },
    {
      game: 'vs Warriors',
      fg: 52,
      pct: 52,
      twoP: 58,
      threeP: 42,
      pts: 28,
      as: 8,
      rb: 6,
      orb: 1,
      drb: 5,
      ft: 90,
      fo: 2,
      eff: 26,
      to: 2,
      stl: 3,
      blk: 0,
    },
    {
      game: 'vs Celtics',
      fg: 45,
      pct: 45,
      twoP: 48,
      threeP: 35,
      pts: 20,
      as: 5,
      rb: 4,
      orb: 1,
      drb: 3,
      ft: 80,
      fo: 4,
      eff: 18,
      to: 4,
      stl: 1,
      blk: 2,
    },
    {
      game: 'vs Heat',
      fg: 50,
      pct: 50,
      twoP: 55,
      threeP: 40,
      pts: 26,
      as: 7,
      rb: 5,
      orb: 2,
      drb: 3,
      ft: 88,
      fo: 1,
      eff: 24,
      to: 2,
      stl: 2,
      blk: 1,
    },
  ];

  get filteredPlayers(): Player[] {
    return this.players.filter((player) => {
      if (this.statusFilter !== 'all' && player.status !== this.statusFilter) {
        return false;
      }
      if (
        this.positionFilter !== 'All Positions' &&
        player.position !== this.positionFilter
      ) {
        return false;
      }
      if (
        this.selectionFilter !== 'All Selections' &&
        player.selection !== this.selectionFilter
      ) {
        return false;
      }
      return true;
    });
  }

  get radarData(): PerformanceMetric[] {
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

