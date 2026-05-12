export interface Player {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'injured';
  performance: number;
  selection: 'U14' | 'U16' | 'U18' | 'Senior';
}

export interface Injury {
  id: string;
  status: 'OUT' | 'HEALED';
  name: string;
  date: string;
  recovery?: string;
}

export interface GameStat {
  game: string;
  fg: number;
  pct: number;
  twoP: number;
  threeP: number;
  pts: number;
  as: number;
  rb: number;
  orb: number;
  drb: number;
  ft: number;
  fo: number;
  eff: number;
  to: number;
  stl: number;
  blk: number;
}

export interface PerformanceMetric {
  stat: string;
  value: number;
}

