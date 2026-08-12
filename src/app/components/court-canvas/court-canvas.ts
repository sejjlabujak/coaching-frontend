import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CourtType,
  DEFAULT_STEP,
  DrawTool,
  DrawnPath,
  Play,
  PlayDiagram,
  Point,
  emptyDiagram,
} from '../../models/play.model';
import {
  BALL_RADIUS,
  CONE_RADIUS,
  PLAYER_RADIUS,
  drawBall,
  drawCone,
  drawFullCourt,
  drawHalfCourt,
  drawLabel,
  drawPath,
  drawPlayer,
  drawSelectionOutline,
} from '../../utils/court-renderer';

interface ToolDef {
  id: DrawTool;
  icon: string;
  label: string;
}

const DRAWING_TOOLS: ToolDef[] = [
  { id: 'select', icon: 'near_me', label: 'Select' },
  { id: 'draw', icon: 'gesture', label: 'Draw' },
  { id: 'arrow', icon: 'trending_flat', label: 'Arrow' },
  { id: 'dashed-arrow', icon: 'timeline', label: 'Dashed Arrow' },
  { id: 'screen', icon: 'block', label: 'Screen' },
  { id: 'pass', icon: 'swap_horiz', label: 'Pass' },
  { id: 'text', icon: 'text_fields', label: 'Text Label' },
  { id: 'basketball', icon: 'sports_basketball', label: 'Basketball' },
  { id: 'cone', icon: 'change_history', label: 'Cone' },
];

const HIT_PADDING = 8;
const PATH_HIT_THRESHOLD = 10;
const MAX_HISTORY = 60;

// Animation rule: solid arrows and screens move the player who drew them;
// dashed arrows and passes move the ball.
const PLAYER_MOVE_TOOLS: DrawnPath['tool'][] = ['arrow', 'screen'];
const BALL_MOVE_TOOLS: DrawnPath['tool'][] = ['dashed-arrow', 'pass'];
const MOVE_MATCH_THRESHOLD = 0.09;
const DEFAULT_ACTION_DURATION_MS = 1400;
const DEFAULT_ACTION_DELAY_MS = 0;
const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface StepAction {
  markerId: string;
  kind: 'player' | 'ball';
  path: DrawnPath;
}

type DragState =
  | { kind: 'player'; id: string }
  | { kind: 'ball'; id: string }
  | { kind: 'cone'; id: string }
  | { kind: 'path'; points: Point[] }
  | null;

@Component({
  selector: 'app-court-canvas',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './court-canvas.html',
  styleUrl: './court-canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourtCanvasComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() play: Play | null = null;
  @Output() diagramChange = new EventEmitter<PlayDiagram>();
  @Output() animationMessage = new EventEmitter<string>();

  @ViewChild('canvasEl') canvasElRef!: ElementRef<HTMLCanvasElement>;

  readonly drawingTools = DRAWING_TOOLS;
  readonly speedOptions = SPEED_OPTIONS;

  activeTool = signal<DrawTool>('select');
  zoom = signal(1);
  canUndo = signal(false);
  canRedo = signal(false);

  diagram = signal<PlayDiagram>(emptyDiagram());

  // ── Step editor ──
  currentStep = signal(1);
  selectedPathId = signal<string | null>(null);

  // ── Playback engine ──
  playbackStatus = signal<PlaybackStatus>('idle');
  playbackSpeed = signal(1);
  resolvedStepCount = signal(0);
  stepProgress = signal(0);

  readonly stepsSequence = computed<number[]>(() => {
    const explicit = this.diagram().steps;
    if (explicit && explicit.length) return [...explicit].sort((a, b) => a - b);

    // Legacy diagrams saved before explicit step lists existed: derive from tagged paths.
    const steps = new Set<number>();
    for (const p of this.diagram().paths) {
      if (p.tool === 'draw') continue;
      steps.add(p.step ?? DEFAULT_STEP);
    }
    if (!steps.size) steps.add(DEFAULT_STEP);
    return Array.from(steps).sort((a, b) => a - b);
  });

  readonly totalSteps = computed(() => this.stepsSequence().length);

  readonly displayStepNumber = computed(() => {
    const total = this.totalSteps();
    if (!total) return 0;
    return Math.min(this.resolvedStepCount() + 1, total);
  });

  get displayedStep(): number {
    const selectedId = this.selectedPathId();
    if (selectedId) {
      const path = this.diagram().paths.find((p) => p.id === selectedId);
      if (path) return path.step ?? DEFAULT_STEP;
    }
    return this.currentStep();
  }

  private currentPlayId: string | null = null;
  private history: PlayDiagram[] = [];
  private historyIndex = -1;
  private dragState: DragState = null;
  private playerCounter = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number | null = null;

  get canvasWidth(): number {
    return this.diagram().courtType === 'full' ? 1240 : 780;
  }

  get canvasHeight(): number {
    return this.diagram().courtType === 'full' ? 645 : 730;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['play']) return;
    const newPlay = this.play;
    if (newPlay?.id !== this.currentPlayId) {
      this.resetPlayback();
      this.selectedPathId.set(null);
      this.currentPlayId = newPlay?.id ?? null;
      const initial = newPlay ? clone(newPlay.diagram) : emptyDiagram();
      this.diagram.set(initial);
      this.history = [clone(initial)];
      this.historyIndex = 0;
      this.playerCounter = initial.players.length;
      this.updateHistoryFlags();
      this.zoom.set(1);
      this.currentStep.set(this.stepsSequence()[0] ?? DEFAULT_STEP);
      queueMicrotask(() => this.redraw());
    }
  }

  ngAfterViewInit(): void {
    this.redraw();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
  }

  // ── Toolbar actions ───────────────────────────────────────────────────────

  selectTool(tool: DrawTool): void {
    this.activeTool.set(tool);
    if (tool !== 'select') this.selectedPathId.set(null);
    this.redraw();
  }

  setEraser(): void {
    this.activeTool.set('eraser');
    this.selectedPathId.set(null);
    this.redraw();
  }

  toggleCourtType(type: CourtType): void {
    if (this.diagram().courtType === type) return;
    const next = { ...clone(this.diagram()), courtType: type };
    this.commit(next);
    queueMicrotask(() => this.redraw());
  }

  zoomIn(): void {
    this.zoom.update((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
  }

  zoomReset(): void {
    this.zoom.set(1);
  }

  undo(): void {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.diagram.set(clone(this.history[this.historyIndex]));
    this.updateHistoryFlags();
    this.emitChange();
    this.redraw();
  }

  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.diagram.set(clone(this.history[this.historyIndex]));
    this.updateHistoryFlags();
    this.emitChange();
    this.redraw();
  }

  clearAll(): void {
    const next = emptyDiagram(this.diagram().courtType);
    this.commit(next);
    this.redraw();
  }

  // ── Pointer handling ──────────────────────────────────────────────────────

  onPointerDown(event: PointerEvent): void {
    if (this.playbackStatus() !== 'idle') return;
    const canvas = this.canvasElRef.nativeElement;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; drag/draw still works without it.
    }
    const pt = this.toNormalized(event);
    const tool = this.activeTool();

    if (tool === 'select') {
      const hit = this.hitTestMarker(pt);
      if (hit) {
        this.dragState = hit;
        this.selectedPathId.set(null);
        return;
      }
      const pathHit = this.hitTestPath(pt);
      this.selectedPathId.set(pathHit?.id ?? null);
      this.redraw();
      return;
    }

    if (tool === 'eraser') {
      this.eraseAt(pt);
      return;
    }

    if (tool === 'text') {
      const text = window.prompt('Label text:');
      if (text && text.trim()) {
        const next = clone(this.diagram());
        next.labels.push({ id: this.genId(), x: pt.x, y: pt.y, text: text.trim() });
        this.commit(next);
        this.redraw();
      }
      return;
    }

    if (tool === 'basketball') {
      if (!this.canEditMarkers()) {
        this.animationMessage.emit('Ball position for later steps comes from a dashed arrow or pass, not direct placement.');
        return;
      }
      const next = clone(this.diagram());
      if (next.balls.length) {
        next.balls[0] = { ...next.balls[0], x: pt.x, y: pt.y };
      } else {
        next.balls.push({ id: this.genId(), x: pt.x, y: pt.y });
      }
      this.commit(next);
      this.redraw();
      return;
    }

    if (tool === 'cone') {
      const next = clone(this.diagram());
      next.cones.push({ id: this.genId(), x: pt.x, y: pt.y });
      this.commit(next);
      this.redraw();
      return;
    }

    if (tool === 'draw' || tool === 'arrow' || tool === 'dashed-arrow' || tool === 'screen' || tool === 'pass') {
      this.dragState = { kind: 'path', points: [pt] };
      return;
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragState) return;
    const pt = this.toNormalized(event);

    if (this.dragState.kind === 'player') {
      const d = clone(this.diagram());
      const marker = d.players.find((p) => p.id === (this.dragState as any).id);
      if (marker) {
        marker.x = pt.x;
        marker.y = pt.y;
        this.diagram.set(d);
        this.redraw();
      }
      return;
    }

    if (this.dragState.kind === 'ball') {
      const d = clone(this.diagram());
      const marker = d.balls.find((b) => b.id === (this.dragState as any).id);
      if (marker) {
        marker.x = pt.x;
        marker.y = pt.y;
        this.diagram.set(d);
        this.redraw();
      }
      return;
    }

    if (this.dragState.kind === 'cone') {
      const d = clone(this.diagram());
      const marker = d.cones.find((c) => c.id === (this.dragState as any).id);
      if (marker) {
        marker.x = pt.x;
        marker.y = pt.y;
        this.diagram.set(d);
        this.redraw();
      }
      return;
    }

    if (this.dragState.kind === 'path') {
      this.dragState.points.push(pt);
      this.redrawWithPreview(this.dragState, this.getStepFrameDiagram(this.currentStep()), this.currentStep());
      return;
    }
  }

  onPointerUp(): void {
    if (!this.dragState) return;

    if (this.dragState.kind === 'path') {
      const tool = this.activeTool();
      const pts = this.dragState.points;
      if (pts.length >= 2) {
        const next = clone(this.diagram());
        const isStraightTool = tool === 'arrow' || tool === 'dashed-arrow' || tool === 'screen' || tool === 'pass';
        const path: DrawnPath = {
          id: this.genId(),
          tool: tool as DrawnPath['tool'],
          points: isStraightTool ? [pts[0], pts[pts.length - 1]] : pts,
          step: tool === 'draw' ? undefined : this.currentStep(),
        };
        next.paths.push(path);
        this.commit(next);
      }
      this.dragState = null;
      this.redraw();
      return;
    }

    // marker drags: commit final position
    this.commit(clone(this.diagram()));
    this.dragState = null;
  }

  exportPng(): string {
    return this.canvasElRef.nativeElement.toDataURL('image/png');
  }

  onAddPlayer(side: 'offense' | 'defense'): void {
    const next = clone(this.diagram());
    this.playerCounter++;
    const label = side === 'offense' ? String(next.players.filter((p) => p.side === 'offense').length + 1) : 'X';
    next.players.push({
      id: this.genId(),
      side,
      label,
      x: 0.5 + (Math.random() - 0.5) * 0.2,
      y: 0.5 + (Math.random() - 0.5) * 0.2,
    });
    this.commit(next);
    this.redraw();
  }

  // ── Step editor ────────────────────────────────────────────────────────────

  /** Marker (player/ball) repositioning is only allowed while editing step 1 (the play's true starting
   *  formation) — later steps show *resolved* positions, and dragging those would silently rewrite the
   *  base formation instead of that step's own movement. Drawing/erasing arrows is unaffected. */
  canEditMarkers(): boolean {
    return this.currentStep() === (this.stepsSequence()[0] ?? DEFAULT_STEP);
  }

  selectStep(stepNum: number): void {
    if (this.playbackStatus() !== 'idle') return;
    this.currentStep.set(stepNum);
    this.selectedPathId.set(null);
    this.redraw();
  }

  addStep(): void {
    const next = clone(this.diagram());
    const existing = this.stepsSequence();
    const newStepNum = existing.length ? Math.max(...existing) + 1 : DEFAULT_STEP;
    next.steps = [...existing, newStepNum].sort((a, b) => a - b);
    this.commit(next);
    this.currentStep.set(newStepNum);
    this.selectedPathId.set(null);
    this.redraw();
  }

  duplicateStep(): void {
    const cur = this.currentStep();
    const next = clone(this.diagram());
    const existing = this.stepsSequence();
    const newStepNum = existing.length ? Math.max(...existing) + 1 : DEFAULT_STEP;
    next.steps = [...existing, newStepNum].sort((a, b) => a - b);

    const copiedPaths = next.paths
      .filter((p) => (p.step ?? DEFAULT_STEP) === cur)
      .map((p) => ({ ...p, id: this.genId(), step: newStepNum }));
    next.paths.push(...copiedPaths);

    this.commit(next);
    this.currentStep.set(newStepNum);
    this.selectedPathId.set(null);
    this.redraw();
  }

  clearCurrentStep(): void {
    const cur = this.currentStep();
    const next = clone(this.diagram());
    next.paths = next.paths.filter((p) => p.tool === 'draw' || (p.step ?? DEFAULT_STEP) !== cur);
    this.commit(next);
    this.selectedPathId.set(null);
    this.redraw();
  }

  deleteStep(stepNum: number): void {
    const existing = this.stepsSequence();
    if (existing.length <= 1) return;

    const next = clone(this.diagram());
    const remaining = existing.filter((s) => s !== stepNum);
    next.steps = remaining;
    next.paths = next.paths.filter((p) => p.tool === 'draw' || (p.step ?? DEFAULT_STEP) !== stepNum);
    this.commit(next);

    if (this.currentStep() === stepNum) this.currentStep.set(remaining[0]);
    this.selectedPathId.set(null);
    this.redraw();
  }

  /** Reassigns an action (arrow/screen/pass) to a different step — used by the Animate-mode drag-and-drop timeline. */
  reassignActionStep(pathId: string, newStep: number): void {
    const next = clone(this.diagram());
    const path = next.paths.find((p) => p.id === pathId);
    if (!path) return;
    path.step = newStep;

    const existing = this.stepsSequence();
    if (!existing.includes(newStep)) next.steps = [...existing, newStep].sort((a, b) => a - b);

    this.commit(next);
    this.redraw();
  }

  /** Builds the diagram to render/thumbnail for a given step: players/ball resolved through the prior
   *  steps (their state entering this step), plus only this step's own arrows overlaid on top. */
  getStepFrameDiagram(stepNum: number): PlayDiagram {
    const base = this.diagram();
    const priorCount = this.stepsSequence().filter((s) => s < stepNum).length;
    const { playerPos, ballPos } = this.computeResolvedPositions(priorCount);

    return {
      ...base,
      players: base.players.map((p) => (playerPos.has(p.id) ? { ...p, ...playerPos.get(p.id)! } : p)),
      balls: base.balls.map((b) => (ballPos.has(b.id) ? { ...b, ...ballPos.get(b.id)! } : b)),
      paths: base.paths.filter((p) => p.tool === 'draw' || (p.step ?? DEFAULT_STEP) === stepNum),
    };
  }

  private hitTestPath(pt: Point): DrawnPath | null {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    for (const path of this.getStepFrameDiagram(this.currentStep()).paths) {
      if (path.tool === 'draw') continue;
      if (pathDistance(path, pt, w, h) <= PATH_HIT_THRESHOLD) return path;
    }
    return null;
  }

  // ── Playback engine ──────────────────────────────────────────────────────

  togglePlayPause(): void {
    if (this.playbackStatus() === 'playing') this.pause();
    else this.playAnimation();
  }

  playAnimation(): void {
    if (this.playbackStatus() === 'playing') return;
    if (!this.totalSteps()) {
      this.animationMessage.emit(
        'Assign a step to at least one arrow, screen, dashed arrow, or pass to animate the play.',
      );
      return;
    }
    if (this.playbackStatus() === 'done') {
      this.resolvedStepCount.set(0);
      this.stepProgress.set(0);
    }
    this.playbackStatus.set('playing');
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  pause(): void {
    if (this.playbackStatus() !== 'playing') return;
    this.cancelFrame();
    this.playbackStatus.set('paused');
  }

  restart(): void {
    this.cancelFrame();
    this.resolvedStepCount.set(0);
    this.stepProgress.set(0);
    this.playbackStatus.set('idle');
    this.redraw();
  }

  nextStep(): void {
    this.cancelFrame();
    const total = this.totalSteps();
    if (!total) return;
    const idx = Math.min(this.resolvedStepCount() + 1, total);
    this.resolvedStepCount.set(idx);
    this.stepProgress.set(0);
    this.playbackStatus.set(idx >= total ? 'done' : 'paused');
    this.renderResolvedUpTo(idx);
  }

  previousStep(): void {
    this.cancelFrame();
    if (!this.totalSteps()) return;
    const idx = Math.max(this.resolvedStepCount() - 1, 0);
    this.resolvedStepCount.set(idx);
    this.stepProgress.set(0);
    this.playbackStatus.set(idx === 0 ? 'idle' : 'paused');
    this.renderResolvedUpTo(idx);
  }

  setSpeed(speed: number): void {
    this.playbackSpeed.set(speed);
  }

  private resetPlayback(): void {
    this.cancelFrame();
    this.resolvedStepCount.set(0);
    this.stepProgress.set(0);
    this.playbackStatus.set('idle');
  }

  private cancelFrame(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick(): void {
    const steps = this.stepsSequence();
    const resolved = this.resolvedStepCount();
    if (resolved >= steps.length) {
      this.playbackStatus.set('done');
      this.animationFrameId = null;
      return;
    }

    const now = performance.now();
    const dt = (now - (this.lastFrameTime ?? now)) * this.playbackSpeed();
    this.lastFrameTime = now;

    const stepNum = steps[resolved];
    const actions = this.buildActionsForStep(stepNum);
    const duration = actions.length ? this.stepDurationMs(actions) || DEFAULT_ACTION_DURATION_MS : 0;

    const nextProgress = duration <= 0 ? 1 : Math.min(1, this.stepProgress() + dt / duration);
    this.stepProgress.set(nextProgress);
    this.renderStepInProgress(resolved, stepNum, actions, nextProgress);

    if (nextProgress >= 1) {
      const newResolved = resolved + 1;
      this.resolvedStepCount.set(newResolved);
      this.stepProgress.set(0);
      if (newResolved >= steps.length) {
        this.playbackStatus.set('done');
        this.animationFrameId = null;
        return;
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  buildActionsForStep(stepNum: number): StepAction[] {
    const d = this.diagram();
    const stepPaths = d.paths.filter((p) => (p.step ?? DEFAULT_STEP) === stepNum);
    const used = new Set<string>();

    const matchClosest = (markerPt: Point, candidates: DrawnPath[]): DrawnPath | null => {
      let best: DrawnPath | null = null;
      let bestDist = MOVE_MATCH_THRESHOLD;
      for (const path of candidates) {
        if (used.has(path.id)) continue;
        const start = path.points[0];
        const dd = Math.hypot(start.x - markerPt.x, start.y - markerPt.y);
        if (dd <= bestDist) {
          bestDist = dd;
          best = path;
        }
      }
      return best;
    };

    const actions: StepAction[] = [];

    const playerPaths = stepPaths.filter((p) => PLAYER_MOVE_TOOLS.includes(p.tool));
    for (const player of d.players) {
      const match = matchClosest(player, playerPaths);
      if (match) {
        used.add(match.id);
        actions.push({ markerId: player.id, kind: 'player', path: match });
      }
    }

    const ballPaths = stepPaths.filter((p) => BALL_MOVE_TOOLS.includes(p.tool));
    for (const ball of d.balls) {
      const match = matchClosest(ball, ballPaths);
      if (match) {
        used.add(match.id);
        actions.push({ markerId: ball.id, kind: 'ball', path: match });
      }
    }

    return actions;
  }

  private stepDurationMs(actions: StepAction[]): number {
    if (!actions.length) return 0;
    return Math.max(
      ...actions.map(
        (a) => (a.path.delayMs ?? DEFAULT_ACTION_DELAY_MS) + (a.path.durationMs ?? DEFAULT_ACTION_DURATION_MS),
      ),
    );
  }

  private computeResolvedPositions(resolvedCount: number): {
    playerPos: Map<string, Point>;
    ballPos: Map<string, Point>;
  } {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const steps = this.stepsSequence();
    const playerPos = new Map<string, Point>();
    const ballPos = new Map<string, Point>();

    for (let i = 0; i < resolvedCount; i++) {
      const actions = this.buildActionsForStep(steps[i]);
      for (const a of actions) {
        const end = pointAtT(a.path.points, 1, w, h);
        if (a.kind === 'player') playerPos.set(a.markerId, end);
        else ballPos.set(a.markerId, end);
      }
    }

    return { playerPos, ballPos };
  }

  private renderResolvedUpTo(resolvedCount: number): void {
    const base = this.diagram();
    const { playerPos, ballPos } = this.computeResolvedPositions(resolvedCount);
    const steps = this.stepsSequence();
    const highlightStep = resolvedCount < steps.length ? steps[resolvedCount] : (steps[steps.length - 1] ?? null);

    const frameDiagram: PlayDiagram = {
      ...base,
      players: base.players.map((p) => (playerPos.has(p.id) ? { ...p, ...playerPos.get(p.id)! } : p)),
      balls: base.balls.map((b) => (ballPos.has(b.id) ? { ...b, ...ballPos.get(b.id)! } : b)),
    };

    this.redrawWithPreview(null, frameDiagram, highlightStep);
  }

  private renderStepInProgress(resolvedIndex: number, stepNum: number, actions: StepAction[], progress: number): void {
    const base = this.diagram();
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const { playerPos, ballPos } = this.computeResolvedPositions(resolvedIndex);

    const stepDuration = this.stepDurationMs(actions) || DEFAULT_ACTION_DURATION_MS;
    const elapsedMs = progress * stepDuration;
    for (const a of actions) {
      const delay = a.path.delayMs ?? DEFAULT_ACTION_DELAY_MS;
      const dur = a.path.durationMs ?? DEFAULT_ACTION_DURATION_MS;
      const localT = clamp01((elapsedMs - delay) / dur);
      const pos = pointAtT(a.path.points, easeInOutCubic(localT), w, h);
      if (a.kind === 'player') playerPos.set(a.markerId, pos);
      else ballPos.set(a.markerId, pos);
    }

    const frameDiagram: PlayDiagram = {
      ...base,
      players: base.players.map((p) => (playerPos.has(p.id) ? { ...p, ...playerPos.get(p.id)! } : p)),
      balls: base.balls.map((b) => (ballPos.has(b.id) ? { ...b, ...ballPos.get(b.id)! } : b)),
    };

    this.redrawWithPreview(null, frameDiagram, stepNum);
  }

  // ── History / commit ──────────────────────────────────────────────────────

  private commit(next: PlayDiagram): void {
    this.diagram.set(next);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(clone(next));
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.historyIndex = this.history.length - 1;
    this.updateHistoryFlags();
    this.emitChange();
  }

  private updateHistoryFlags(): void {
    this.canUndo.set(this.historyIndex > 0);
    this.canRedo.set(this.historyIndex < this.history.length - 1);
  }

  private emitChange(): void {
    this.diagramChange.emit(clone(this.diagram()));
  }

  private genId(): string {
    return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // ── Hit testing ────────────────────────────────────────────────────────────

  private hitTestMarker(pt: Point): DragState {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const d = this.diagram();

    if (this.canEditMarkers()) {
      for (const p of d.players) {
        if (dist(p, pt, w, h) <= PLAYER_RADIUS + HIT_PADDING) return { kind: 'player', id: p.id };
      }
      for (const b of d.balls) {
        if (dist(b, pt, w, h) <= BALL_RADIUS + HIT_PADDING) return { kind: 'ball', id: b.id };
      }
    }
    for (const c of d.cones) {
      if (dist(c, pt, w, h) <= CONE_RADIUS + HIT_PADDING) return { kind: 'cone', id: c.id };
    }
    return null;
  }

  private eraseAt(pt: Point): void {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const next = clone(this.diagram());

    if (this.canEditMarkers()) {
      const playerHit = next.players.find((p) => dist(p, pt, w, h) <= PLAYER_RADIUS + HIT_PADDING);
      if (playerHit) {
        next.players = next.players.filter((p) => p.id !== playerHit.id);
        this.commit(next);
        this.redraw();
        return;
      }

      const ballHit = next.balls.find((b) => dist(b, pt, w, h) <= BALL_RADIUS + HIT_PADDING);
      if (ballHit) {
        next.balls = next.balls.filter((b) => b.id !== ballHit.id);
        this.commit(next);
        this.redraw();
        return;
      }
    }

    const coneHit = next.cones.find((c) => dist(c, pt, w, h) <= CONE_RADIUS + HIT_PADDING);
    if (coneHit) {
      next.cones = next.cones.filter((c) => c.id !== coneHit.id);
      this.commit(next);
      this.redraw();
      return;
    }

    const labelHit = next.labels.find(
      (l) => Math.abs(l.x - pt.x) * w <= 40 && Math.abs(l.y - pt.y) * h <= 14,
    );
    if (labelHit) {
      next.labels = next.labels.filter((l) => l.id !== labelHit.id);
      this.commit(next);
      this.redraw();
      return;
    }

    const visiblePathIds = new Set(this.getStepFrameDiagram(this.currentStep()).paths.map((p) => p.id));
    const pathHit = next.paths.find(
      (path) => visiblePathIds.has(path.id) && pathDistance(path, pt, w, h) <= PATH_HIT_THRESHOLD,
    );
    if (pathHit) {
      next.paths = next.paths.filter((p) => p.id !== pathHit.id);
      if (this.selectedPathId() === pathHit.id) this.selectedPathId.set(null);
      this.commit(next);
      this.redraw();
    }
  }

  // ── Coordinate mapping ──────────────────────────────────────────────────────

  private toNormalized(event: PointerEvent): Point {
    const canvas = this.canvasElRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { x: clamp01(x), y: clamp01(y) };
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  private redraw(): void {
    if (this.playbackStatus() !== 'idle') return; // playback rendering owns the canvas while active
    this.redrawWithPreview(null, this.getStepFrameDiagram(this.currentStep()), this.currentStep());
  }

  private redrawWithPreview(
    preview: { kind: 'path'; points: Point[] } | null,
    diagramOverride?: PlayDiagram,
    highlightStep?: number | null,
  ): void {
    const canvas = this.canvasElRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = this.canvasWidth;
    const h = this.canvasHeight;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    const d = diagramOverride ?? this.diagram();
    const selectedId = this.selectedPathId();

    if (d.courtType === 'full') drawFullCourt(ctx, w, h);
    else drawHalfCourt(ctx, w, h);

    for (const path of d.paths) {
      drawPath(ctx, path, w, h, highlightStep ?? null);
      if (path.id === selectedId) drawSelectionOutline(ctx, path, w, h);
    }
    if (preview && preview.points.length >= 2) {
      drawPath(
        ctx,
        {
          id: 'preview',
          tool: this.activeTool() as DrawnPath['tool'],
          points: previewPoints(preview.points, this.activeTool()),
          step: this.currentStep(),
        },
        w,
        h,
        null,
      );
    }

    for (const cone of d.cones) drawCone(ctx, cone, w, h);
    for (const label of d.labels) drawLabel(ctx, label, w, h);
    for (const player of d.players) drawPlayer(ctx, player, w, h);
    for (const ball of d.balls) drawBall(ctx, ball, w, h);
  }
}

function previewPoints(points: Point[], tool: DrawTool): Point[] {
  const isStraight = tool === 'arrow' || tool === 'dashed-arrow' || tool === 'screen' || tool === 'pass';
  return isStraight ? [points[0], points[points.length - 1]] : points;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Constant-speed interpolation along a (possibly multi-point) path, in pixel space, returned as normalized coords. */
function pointAtT(points: Point[], t: number, w: number, h: number): Point {
  if (points.length === 1) return points[0];

  const px = points.map((p) => ({ x: p.x * w, y: p.y * h }));
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < px.length - 1; i++) {
    const len = Math.hypot(px[i + 1].x - px[i].x, px[i + 1].y - px[i].y);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return points[0];

  let target = t * total;
  for (let i = 0; i < segLens.length; i++) {
    const isLast = i === segLens.length - 1;
    if (target <= segLens[i] || isLast) {
      const segT = segLens[i] === 0 ? 0 : Math.min(1, target / segLens[i]);
      return {
        x: (px[i].x + (px[i + 1].x - px[i].x) * segT) / w,
        y: (px[i].y + (px[i + 1].y - px[i].y) * segT) / h,
      };
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function dist(a: Point, b: Point, w: number, h: number): number {
  const dx = (a.x - b.x) * w;
  const dy = (a.y - b.y) * h;
  return Math.sqrt(dx * dx + dy * dy);
}

function pathDistance(path: DrawnPath, pt: Point, w: number, h: number): number {
  let min = Infinity;
  const px = pt.x * w;
  const py = pt.y * h;
  for (let i = 0; i < path.points.length - 1; i++) {
    const a = { x: path.points[i].x * w, y: path.points[i].y * h };
    const b = { x: path.points[i + 1].x * w, y: path.points[i + 1].y * h };
    min = Math.min(min, distanceToSegment(px, py, a.x, a.y, b.x, b.y));
  }
  return min;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}
