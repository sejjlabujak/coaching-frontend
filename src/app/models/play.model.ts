export type PlayCategory =
  | 'Offensive Plays'
  | 'Defensive Plays'
  | 'BLOB'
  | 'SLOB'
  | 'Transition'
  | 'Quick Hitters';

export const PLAY_CATEGORIES: PlayCategory[] = [
  'Offensive Plays',
  'Defensive Plays',
  'BLOB',
  'SLOB',
  'Transition',
  'Quick Hitters',
];

export type CourtType = 'half' | 'full';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export const DIFFICULTY_OPTIONS: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export type AgeGroup = 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Senior';
export const AGE_GROUP_OPTIONS: AgeGroup[] = ['U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];

export type DrawTool =
  | 'select'
  | 'draw'
  | 'arrow'
  | 'dashed-arrow'
  | 'screen'
  | 'pass'
  | 'text'
  | 'basketball'
  | 'cone'
  | 'eraser';

export interface Point {
  x: number; // normalized 0-1, relative to court width
  y: number; // normalized 0-1, relative to court height
}

export interface PlayerMarker {
  id: string;
  side: 'offense' | 'defense';
  label: string;
  x: number;
  y: number;
}

export interface BallMarker {
  id: string;
  x: number;
  y: number;
}

export interface ConeMarker {
  id: string;
  x: number;
  y: number;
}

export const DEFAULT_STEP = 1;

export interface DrawnPath {
  id: string;
  tool: 'draw' | 'arrow' | 'dashed-arrow' | 'screen' | 'pass';
  points: Point[];
  /** Sequence phase this movement belongs to (1-based). All actions sharing a step animate together;
   *  the next step doesn't start until every action in this one has finished. Defaults to 1 for legacy paths. */
  step?: number;
  /** Optional per-action override (ms). Falls back to a shared default duration in the animation engine. */
  durationMs?: number;
  /** Optional extra delay (ms) before this action starts within its step, so actions in the same step can be staggered. */
  delayMs?: number;
}

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface PlayDiagram {
  courtType: CourtType;
  players: PlayerMarker[];
  balls: BallMarker[];
  cones: ConeMarker[];
  paths: DrawnPath[];
  labels: TextLabel[];
  /** Explicit ordered list of step numbers that exist for this play, so an empty step can exist
   *  before any arrow is tagged with it. Legacy diagrams without this fall back to deriving steps from paths. */
  steps?: number[];
}

export interface Play {
  id: string;
  name: string;
  category: PlayCategory;
  lastModified: string;
  favorite: boolean;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  ageGroup: AgeGroup;
  duration: number;
  notes: string;
  diagram: PlayDiagram;
}

export function emptyDiagram(courtType: CourtType = 'half'): PlayDiagram {
  return {
    courtType,
    players: [],
    balls: [],
    cones: [],
    paths: [],
    labels: [],
    steps: [1],
  };
}

export function defaultHalfCourtDiagram(): PlayDiagram {
  return {
    courtType: 'half',
    players: [
      { id: 'p1', side: 'offense', label: '1', x: 0.5, y: 0.82 },
      { id: 'p2', side: 'offense', label: '2', x: 0.18, y: 0.62 },
      { id: 'p3', side: 'offense', label: '3', x: 0.82, y: 0.62 },
      { id: 'p4', side: 'offense', label: '4', x: 0.32, y: 0.28 },
      { id: 'p5', side: 'offense', label: '5', x: 0.68, y: 0.28 },
    ],
    balls: [{ id: 'b1', x: 0.5, y: 0.82 }],
    cones: [],
    paths: [],
    labels: [],
    steps: [1],
  };
}
