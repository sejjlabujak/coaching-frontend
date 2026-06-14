import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}
