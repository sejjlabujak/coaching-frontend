import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecommendedDrill {
  drillId: number;
  drillTitle: string;
  reason: string;
}

export interface Recommendation {
  weakArea: string;
  averageStat: string;
  analysis: string;
  recommendedDrills: RecommendedDrill[];
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/recommendations`;

  getRecommendations(): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(this.baseUrl);
  }
}
