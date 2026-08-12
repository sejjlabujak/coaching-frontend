import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Play } from '../../models/play.model';

@Component({
  selector: 'app-play-card',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './play-card.html',
  styleUrl: './play-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayCardComponent {
  @Input() play!: Play;
  @Input() active = false;

  @Output() select = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<string>();

  onSelect(): void {
    this.select.emit(this.play.id);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.play.id);
  }
}
