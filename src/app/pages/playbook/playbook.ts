import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import { CourtCanvasComponent, StepAction } from '../../components/court-canvas/court-canvas';
import { PlayThumbnailComponent } from '../../components/play-thumbnail/play-thumbnail';
import { PlayPropertiesPanelComponent } from '../../components/play-properties-panel/play-properties-panel';
import { PlaybookService } from '../../services/playbook.service';
import { Play, PlayCategory, PlayDiagram } from '../../models/play.model';

const ACTION_TOOL_LABELS: Record<string, string> = {
  arrow: 'Move',
  screen: 'Screen',
  'dashed-arrow': 'Dribble',
  pass: 'Pass',
};

@Component({
  selector: 'app-playbook',
  standalone: true,
  templateUrl: './playbook.html',
  styleUrl: './playbook.css',
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    DragDropModule,
    CourtCanvasComponent,
    PlayThumbnailComponent,
    PlayPropertiesPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaybookComponent implements OnInit {
  readonly playbookService = inject(PlaybookService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly courtCanvas = viewChild(CourtCanvasComponent);

  pendingDeleteId = signal<string | null>(null);
  pendingDeleteStep = signal<number | null>(null);
  isDetailsOpen = signal(false);
  isFullscreen = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      this.playbookService.selectPlay(id);
    });
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  onBack(): void {
    this.router.navigate(['/playbook']);
  }

  onNameChange(name: string): void {
    const play = this.playbookService.selectedPlay();
    if (!play || !name.trim()) return;
    this.playbookService.updatePlay(play.id, { name: name.trim() });
  }

  onToggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        this.snackBar.open('Fullscreen is not available in this browser.', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
      });
    }
  }

  onDiagramChange(diagram: PlayDiagram): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    this.playbookService.updatePlay(play.id, { diagram });
  }

  onPropertiesUpdate(patch: Partial<Play>): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    this.playbookService.updatePlay(play.id, patch);
  }

  onSave(): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    this.snackBar.open(`"${play.name}" saved.`, 'Close', { duration: 2500, panelClass: 'snack-success' });
  }

  onDuplicate(): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    const copy = this.playbookService.duplicatePlay(play.id);
    if (copy) {
      this.snackBar.open(`Duplicated as "${copy.name}".`, 'Close', { duration: 2500, panelClass: 'snack-success' });
      this.router.navigate(['/playbook', copy.id]);
    }
  }

  onExportImage(): void {
    const play = this.playbookService.selectedPlay();
    const canvas = this.courtCanvas();
    if (!play || !canvas) return;
    const dataUrl = canvas.exportPng();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${play.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    this.snackBar.open('Play exported as image.', 'Close', { duration: 2500, panelClass: 'snack-success' });
  }

  onExportPdf(): void {
    const play = this.playbookService.selectedPlay();
    const canvas = this.courtCanvas();
    if (!play || !canvas) return;
    const dataUrl = canvas.exportPng();
    const width = canvas.canvasWidth;
    const height = canvas.canvasHeight;
    const doc = new jsPDF({
      orientation: width >= height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height],
    });
    doc.addImage(dataUrl, 'PNG', 0, 0, width, height);
    doc.save(`${play.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    this.snackBar.open('Play exported as PDF.', 'Close', { duration: 2500, panelClass: 'snack-success' });
  }

  onAnimationMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3500, panelClass: 'snack-error' });
  }

  onShare(): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    const shareUrl = `${location.origin}/playbook/shared/${play.id}`;
    navigator.clipboard?.writeText(shareUrl).then(
      () => this.snackBar.open('Share link copied to clipboard.', 'Close', { duration: 3000, panelClass: 'snack-success' }),
      () => this.snackBar.open('Could not copy share link.', 'Close', { duration: 3000, panelClass: 'snack-error' }),
    );
  }

  onDeleteRequest(): void {
    const play = this.playbookService.selectedPlay();
    if (!play) return;
    this.pendingDeleteId.set(play.id);
  }

  onDeleteCancel(): void {
    this.pendingDeleteId.set(null);
  }

  onDeleteConfirm(): void {
    const id = this.pendingDeleteId();
    if (!id) return;
    const play = this.playbookService.plays().find((p) => p.id === id);
    this.playbookService.deletePlay(id);
    this.pendingDeleteId.set(null);
    this.snackBar.open(`"${play?.name}" deleted.`, 'Close', { duration: 2500, panelClass: 'snack-error' });
    this.router.navigate(['/playbook']);
  }

  onDeleteStepRequest(step: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteStep.set(step);
  }

  onDeleteStepCancel(event: Event): void {
    event.stopPropagation();
    this.pendingDeleteStep.set(null);
  }

  onDeleteStepConfirm(step: number, event: Event): void {
    event.stopPropagation();
    this.courtCanvas()?.deleteStep(step);
    this.pendingDeleteStep.set(null);
  }

  // ── Animate-mode action timeline ──────────────────────────────────────────

  actionsForStep(step: number): StepAction[] {
    return this.courtCanvas()?.buildActionsForStep(step) ?? [];
  }

  describeAction(action: StepAction): string {
    const toolLabel = ACTION_TOOL_LABELS[action.path.tool] ?? action.path.tool;
    if (action.kind === 'ball') return `${toolLabel} — Ball`;
    const player = this.courtCanvas()?.diagram().players.find((p) => p.id === action.markerId);
    return `${toolLabel} — Player ${player?.label ?? '?'}`;
  }

  onActionDropped(event: CdkDragDrop<StepAction[]>, targetStep: number): void {
    if (event.previousContainer === event.container) return;
    const action: StepAction = event.item.data;
    this.courtCanvas()?.reassignActionStep(action.path.id, targetStep);
  }
}
