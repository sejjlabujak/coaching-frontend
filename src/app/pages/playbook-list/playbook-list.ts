import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { Button } from '../../components/button/button';
import { SearchInputComponent } from '../../components/search/search-input.component';
import { PlayThumbnailComponent } from '../../components/play-thumbnail/play-thumbnail';
import { PlaybookService } from '../../services/playbook.service';

@Component({
  selector: 'app-playbook-list',
  standalone: true,
  templateUrl: './playbook-list.html',
  styleUrl: './playbook-list.css',
  imports: [
    CommonModule,
    MatIconModule,
    MatSnackBarModule,
    LayoutComponent,
    Button,
    SearchInputComponent,
    PlayThumbnailComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaybookListComponent {
  readonly playbookService = inject(PlaybookService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  pendingDeleteId = signal<string | null>(null);

  onSearchChange(term: string): void {
    this.playbookService.setSearchTerm(term);
  }

  onNewPlay(): void {
    const play = this.playbookService.createPlay();
    this.router.navigate(['/playbook', play.id]);
  }

  onOpenPlay(id: string): void {
    this.router.navigate(['/playbook', id]);
  }

  onEditClick(id: string, event: Event): void {
    event.stopPropagation();
    this.onOpenPlay(id);
  }

  onDeleteRequest(id: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
  }

  onDeleteCancel(event?: Event): void {
    event?.stopPropagation();
    this.pendingDeleteId.set(null);
  }

  onDeleteConfirm(id: string, event: Event): void {
    event.stopPropagation();
    const play = this.playbookService.plays().find((p) => p.id === id);
    this.playbookService.deletePlay(id);
    this.pendingDeleteId.set(null);
    this.snackBar.open(`"${play?.name}" deleted.`, 'Close', { duration: 2500, panelClass: 'snack-error' });
  }
}
