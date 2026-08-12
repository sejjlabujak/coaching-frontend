import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { PlayDiagram } from '../../models/play.model';
import { renderStaticDiagram } from '../../utils/court-renderer';

@Component({
  selector: 'app-play-thumbnail',
  standalone: true,
  templateUrl: './play-thumbnail.html',
  styleUrl: './play-thumbnail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayThumbnailComponent implements OnChanges, AfterViewInit {
  @Input() diagram!: PlayDiagram;

  @ViewChild('canvasEl') canvasElRef!: ElementRef<HTMLCanvasElement>;

  get canvasWidth(): number {
    return this.diagram?.courtType === 'full' ? 620 : 390;
  }

  get canvasHeight(): number {
    return this.diagram?.courtType === 'full' ? 323 : 365;
  }

  ngOnChanges(): void {
    queueMicrotask(() => this.render());
  }

  ngAfterViewInit(): void {
    this.render();
  }

  private render(): void {
    const canvas = this.canvasElRef?.nativeElement;
    if (!canvas || !this.diagram) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = this.canvasWidth;
    const h = this.canvasHeight;
    canvas.width = w;
    canvas.height = h;

    renderStaticDiagram(ctx, this.diagram, w, h);
  }
}
