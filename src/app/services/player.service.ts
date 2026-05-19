import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/players';

  getPlayers(): Observable<BackendPlayer[]> {
    return this.http.get<BackendPlayer[]>(this.baseUrl);
  }
}
