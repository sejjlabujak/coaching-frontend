import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface RecentTeamGame {
  gameId: number;
  date: string;
  opponent: string;
  ourScore: number;
  opponentScore: number;
  result: 'W' | 'L';
  fieldGoalsPercentage: number | null;
  threePointersPercentage: number | null;
  freeThrowsPercentage: number | null;
  turnovers: number | null;
  assists: number | null;
  reboundsTotal: number | null;
}

@Component({
  selector: 'app-recent-team-games',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './recent-team-games.html',
  styleUrl: './recent-team-games.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentTeamGamesComponent {
  @Input() games: RecentTeamGame[] = [];

  get record(): string {
    const w = this.games.filter(g => g.result === 'W').length;
    const l = this.games.length - w;
    return `${w}W - ${l}L`;
  }
}
