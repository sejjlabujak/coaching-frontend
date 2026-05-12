import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-player-card',
  template: `
    <button
      (click)="onPlayerClick()"
      class="player-card"
    >
      <div class="player-content">
        <div class="player-avatar">
          <mat-icon>person</mat-icon>
        </div>
        <h4 class="player-name">{{ player.name }}</h4>
        <p class="player-position">{{ player.position }}</p>
        <div [class]="'status-badge status-' + player.status">
          {{ player.status === 'active' ? 'Active' : 'Injured' }}
        </div>
      </div>
    </button>
  `,
  styleUrl: './player-card.css',
  imports: [CommonModule, MatIconModule],
  standalone: true,
})
export class PlayerCardComponent {
  @Input() player!: Player;

  onPlayerClick(): void {
    // Will be handled by parent
  }
}

