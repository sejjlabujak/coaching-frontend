import {
  BallMarker,
  ConeMarker,
  DEFAULT_STEP,
  DrawnPath,
  PlayDiagram,
  PlayerMarker,
  TextLabel,
} from '../models/play.model';

export const PLAYER_RADIUS = 20;
export const BALL_RADIUS = 11;
export const CONE_RADIUS = 12;

// ── Court drawing ──────────────────────────────────────────────────────────

export function drawHalfCourt(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  const laneWidth = w * 0.32;
  const laneHeight = h * 0.404;
  const laneX = (w - laneWidth) / 2;
  const laneY = h - 6 - laneHeight;
  ctx.strokeRect(laneX, laneY, laneWidth, laneHeight);

  ctx.beginPath();
  ctx.arc(w / 2, laneY, w * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  const basketY = h - 6 - h * 0.1117;
  const arcRadius = w * 0.44;
  const cornerX1 = w * 0.06;
  const cornerX2 = w * 0.94;

  ctx.beginPath();
  ctx.moveTo(cornerX1, h - 6);
  const cornerBreakY = basketY - Math.sqrt(Math.max(arcRadius * arcRadius - (w / 2 - cornerX1) ** 2, 0));
  ctx.lineTo(cornerX1, cornerBreakY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cornerX2, h - 6);
  ctx.lineTo(cornerX2, cornerBreakY);
  ctx.stroke();

  const startAngle = Math.atan2(cornerBreakY - basketY, cornerX1 - w / 2);
  const endAngle = Math.atan2(cornerBreakY - basketY, cornerX2 - w / 2);
  ctx.beginPath();
  ctx.arc(w / 2, basketY, arcRadius, endAngle, startAngle, true);
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.arc(w / 2, 6, w * 0.12, 0, Math.PI, false);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(w / 2 - w * 0.045, basketY + 6, w * 0.09, 4);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(w / 2, basketY, 7, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawFullCourt(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.beginPath();
  ctx.moveTo(w / 2, 6);
  ctx.lineTo(w / 2, h - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, h * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  for (const side of [-1, 1] as const) {
    const originX = side === -1 ? 6 : w - 6;
    const dir = side === -1 ? 1 : -1;

    const laneHeight = h * 0.32;
    const laneWidth = w * 0.19;
    const laneY = (h - laneHeight) / 2;
    const laneX = side === -1 ? 6 : w - 6 - laneWidth;
    ctx.strokeRect(laneX, laneY, laneWidth, laneHeight);

    ctx.beginPath();
    ctx.arc(originX + dir * laneWidth, h / 2, h * 0.12, 0, Math.PI * 2);
    ctx.stroke();

    const basketX = originX + dir * (h * 0.1117);
    const arcRadius = h * 0.44;
    const cornerY1 = h * 0.06;
    const cornerY2 = h * 0.94;
    const cornerBreakX = basketX + dir * Math.sqrt(Math.max(arcRadius * arcRadius - (h / 2 - cornerY1) ** 2, 0));

    ctx.beginPath();
    ctx.moveTo(originX, cornerY1);
    ctx.lineTo(cornerBreakX, cornerY1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, cornerY2);
    ctx.lineTo(cornerBreakX, cornerY2);
    ctx.stroke();

    const startAngle = Math.atan2(cornerY1 - h / 2, cornerBreakX - basketX);
    const endAngle = Math.atan2(cornerY2 - h / 2, cornerBreakX - basketX);
    ctx.beginPath();
    if (dir === 1) ctx.arc(basketX, h / 2, arcRadius, startAngle, endAngle, false);
    else ctx.arc(basketX, h / 2, arcRadius, endAngle, startAngle, true);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(basketX, h / 2, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
  }
}

// ── Element drawing ──────────────────────────────────────────────────────────

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerMarker, w: number, h: number): void {
  const x = p.x * w;
  const y = p.y * h;
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = p.side === 'offense' ? '#2563eb' : '#dc2626';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.label, x, y + 1);
}

export function drawBall(ctx: CanvasRenderingContext2D, b: BallMarker, w: number, h: number): void {
  const x = b.x * w;
  const y = b.y * h;
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#7c2d12';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - BALL_RADIUS, y);
  ctx.lineTo(x + BALL_RADIUS, y);
  ctx.moveTo(x, y - BALL_RADIUS);
  ctx.lineTo(x, y + BALL_RADIUS);
  ctx.stroke();
}

export function drawCone(ctx: CanvasRenderingContext2D, c: ConeMarker, w: number, h: number): void {
  const x = c.x * w;
  const y = c.y * h;
  ctx.beginPath();
  ctx.moveTo(x, y - CONE_RADIUS);
  ctx.lineTo(x - CONE_RADIUS, y + CONE_RADIUS);
  ctx.lineTo(x + CONE_RADIUS, y + CONE_RADIUS);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#b45309';
  ctx.stroke();
}

export function drawLabel(ctx: CanvasRenderingContext2D, l: TextLabel, w: number, h: number): void {
  const x = l.x * w;
  const y = l.y * h;
  ctx.font = '600 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(l.text);
  const paddingX = 6;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - metrics.width / 2 - paddingX, y - 11, metrics.width + paddingX * 2, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(l.text, x, y + 1);
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: DrawnPath,
  w: number,
  h: number,
  highlightStep: number | null,
  showBadge = true,
): void {
  const pts = path.points.map((p) => ({ x: p.x * w, y: p.y * h }));
  if (pts.length < 2) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  if (path.tool === 'draw') {
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    return;
  }

  const a = pts[0];
  const b = pts[pts.length - 1];

  if (path.tool === 'screen') {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const perp = angle + Math.PI / 2;
    const barLen = 11;
    ctx.beginPath();
    ctx.moveTo(b.x + Math.cos(perp) * barLen, b.y + Math.sin(perp) * barLen);
    ctx.lineTo(b.x - Math.cos(perp) * barLen, b.y - Math.sin(perp) * barLen);
    ctx.stroke();
  } else if (path.tool === 'pass') {
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#7c3aed';
    ctx.fill();
  } else {
    // arrow / dashed-arrow
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    if (path.tool === 'dashed-arrow') ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const headLen = 13;
    const headAngle = Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - headLen * Math.cos(angle - headAngle), b.y - headLen * Math.sin(angle - headAngle));
    ctx.lineTo(b.x - headLen * Math.cos(angle + headAngle), b.y - headLen * Math.sin(angle + headAngle));
    ctx.closePath();
    ctx.fillStyle = '#2563eb';
    ctx.fill();
  }

  if (showBadge) drawStepBadge(ctx, path, w, h, highlightStep);
}

export function drawStepBadge(
  ctx: CanvasRenderingContext2D,
  path: DrawnPath,
  w: number,
  h: number,
  highlightStep: number | null,
): void {
  const mid = path.points[Math.floor(path.points.length / 2)];
  const x = mid.x * w;
  const y = mid.y * h;
  const step = path.step ?? DEFAULT_STEP;
  const isActive = highlightStep != null && step === highlightStep;
  const radius = isActive ? 11 : 9;

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? '#f59e0b' : '#ffffff';
  ctx.fill();
  ctx.lineWidth = isActive ? 2.5 : 1.5;
  ctx.strokeStyle = isActive ? '#b45309' : '#64748b';
  ctx.stroke();

  ctx.fillStyle = isActive ? '#ffffff' : '#0f172a';
  ctx.font = '700 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(step), x, y + 1);
}

export function drawSelectionOutline(ctx: CanvasRenderingContext2D, path: DrawnPath, w: number, h: number): void {
  const pts = path.points.map((p) => ({ x: p.x * w, y: p.y * h }));
  if (pts.length < 2) return;

  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.setLineDash([2, 6]);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** Draws the full static diagram (court + paths + cones + labels + players + ball) with no interactive overlays. */
export function renderStaticDiagram(
  ctx: CanvasRenderingContext2D,
  diagram: PlayDiagram,
  w: number,
  h: number,
  options: { showBadges?: boolean } = {},
): void {
  ctx.clearRect(0, 0, w, h);

  if (diagram.courtType === 'full') drawFullCourt(ctx, w, h);
  else drawHalfCourt(ctx, w, h);

  const showBadges = options.showBadges ?? false;
  for (const path of diagram.paths) drawPath(ctx, path, w, h, null, showBadges);
  for (const cone of diagram.cones) drawCone(ctx, cone, w, h);
  for (const label of diagram.labels) drawLabel(ctx, label, w, h);
  for (const player of diagram.players) drawPlayer(ctx, player, w, h);
  for (const ball of diagram.balls) drawBall(ctx, ball, w, h);
}
