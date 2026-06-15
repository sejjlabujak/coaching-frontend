import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Player, GameStat, PerformanceMetric } from '../models/player.model';

export interface BackendPlayer {
  playerID: number;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  birthCity: string | null;
  nationality: string | null;
  ageGroup: string | null;
  images: { imageID: number; url: string }[];
  injuries: BackendInjury[];
}

export interface BackendInjury {
  id: number;
  description: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  active?: boolean; // Jackson may serialize boolean `isActive` field as `active`
  playerId?: number;
  playerName?: string;
}

export interface PlayerStatsDTO {
  gameId: number;
  date: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  result: string | null;
  opponent: string | null;
  firstName: string | null;
  familyName: string | null;
  shirtNumber: number | null;
  starter: boolean | null;
  minutesPlayed: number | null;
  points: number | null;
  fieldGoalsMade: number | null;
  fieldGoalsAttempted: number | null;
  fieldGoalsPercentage: number | null;
  threePointersMade: number | null;
  threePointersAttempted: number | null;
  threePointersPercentage: number | null;
  freeThrowsMade: number | null;
  freeThrowsAttempted: number | null;
  freeThrowsPercentage: number | null;
  reboundsTotal: number | null;
  reboundsOffensive: number | null;
  reboundsDefensive: number | null;
  assists: number | null;
  turnovers: number | null;
  steals: number | null;
  blocks: number | null;
  foulsPersonal: number | null;
  plusMinusPoints: number | null;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/players`;

  getPlayers(): Observable<BackendPlayer[]> {
    return this.http.get<BackendPlayer[]>(this.baseUrl);
  }

  getPlayerStats(playerId: number, opponent?: string): Observable<PlayerStatsDTO[]> {
    let url = `${this.baseUrl}/${playerId}/stats`;
    if (opponent) url += `?opponent=${encodeURIComponent(opponent)}`;
    return this.http.get<PlayerStatsDTO[]>(url);
  }

  getInjuries(playerId: number): Observable<BackendInjury[]> {
    return this.http.get<BackendInjury[]>(`${this.baseUrl}/${playerId}/injuries`);
  }

  createInjury(playerId: number, dto: Partial<BackendInjury>): Observable<BackendInjury> {
    return this.http.post<BackendInjury>(`${this.baseUrl}/${playerId}/injuries`, dto);
  }

  updateInjury(injuryId: number, dto: Partial<BackendInjury>): Observable<BackendInjury> {
    return this.http.put<BackendInjury>(`${environment.apiUrl}/api/injuries/${injuryId}`, dto);
  }

  deleteInjury(injuryId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/injuries/${injuryId}`);
  }

  mapPlayer(p: BackendPlayer): Player {
    const hasActiveInjury = p.injuries?.some((i) => i.isActive ?? i.active) ?? false;
    const age = p.birthDate
      ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined;
    return {
      id: String(p.playerID),
      name: `${p.firstName} ${p.lastName}`,
      position: p.position ?? 'Unknown',
      status: hasActiveInjury ? 'injured' : 'active',
      performance: 75,
      selection: (p.ageGroup as Player['selection']) ?? 'Senior',
      imageUrl: p.images?.[0]?.url ?? undefined,
      age,
    };
  }

  mapStat(s: PlayerStatsDTO): GameStat {
    const n = (v: number | null) => v ?? 0;
    const fgm = n(s.fieldGoalsMade);
    const fga = n(s.fieldGoalsAttempted);
    const ftm = n(s.freeThrowsMade);
    const fta = n(s.freeThrowsAttempted);
    const pts = n(s.points);
    const rb = n(s.reboundsTotal);
    const ast = n(s.assists);
    const stl = n(s.steals);
    const blk = n(s.blocks);
    const to = n(s.turnovers);
    const eff = pts + rb + ast + stl + blk - (fga - fgm) - (fta - ftm) - to;
    const gameLabel = s.opponent
      ? `vs ${s.opponent}${s.date ? ' ' + s.date : ''}`
      : s.date ?? `Game ${s.gameId}`;
    return {
      game: gameLabel,
      fg: fgm,
      pct: n(s.fieldGoalsPercentage),
      twoP: n(s.threePointersAttempted) > 0
        ? Math.round(((fgm - n(s.threePointersMade)) / Math.max(fga - n(s.threePointersAttempted), 1)) * 100)
        : fga > 0 ? Math.round((fgm / fga) * 100) : 0,
      threeP: n(s.threePointersPercentage),
      pts,
      as: ast,
      rb,
      orb: n(s.reboundsOffensive),
      drb: n(s.reboundsDefensive),
      ft: n(s.freeThrowsPercentage),
      fo: n(s.foulsPersonal),
      eff,
      to,
      stl,
      blk,
    };
  }

  radarData(gameStats: GameStat[]): PerformanceMetric[] {
    if (!gameStats.length) return [];
    const totalAssists = gameStats.reduce((sum, g) => sum + g.as, 0);
    const totalTurnovers = gameStats.reduce((sum, g) => sum + g.to, 0);
    const avgFG = gameStats.reduce((sum, g) => sum + g.fg, 0) / gameStats.length;
    const totalOff = gameStats.reduce((sum, g) => sum + g.fo + g.orb + g.pts, 0);
    const totalDef = gameStats.reduce((sum, g) => sum + g.stl + g.blk, 0);
    const totalReb = gameStats.reduce((sum, g) => sum + g.orb + g.drb, 0);
    return [
      {
        stat: 'Playmaking',
        value: Math.min(100, Math.round((totalAssists / Math.max(totalTurnovers, 1)) * 20)),
      },
      { stat: 'Shooting', value: Math.round(avgFG) },
      {
        stat: 'Off. Aggression',
        value: Math.min(100, Math.round((totalOff / (gameStats.length * 35)) * 100)),
      },
      {
        stat: 'Def. Aggression',
        value: Math.min(100, Math.round((totalDef / (gameStats.length * 5)) * 100)),
      },
      {
        stat: 'Rebounding',
        value: Math.min(100, Math.round((totalReb / (gameStats.length * 10)) * 100)),
      },
    ];
  }
}
