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
export interface RecommendationFeedback { recommendationId: string; feedbackType: 'USEFUL' | 'NOT_USEFUL'; reason?: string; comment?: string; }

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/recommendations`;

  getRecommendations(): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(this.baseUrl);
  }
  feedback(payload: RecommendationFeedback): Observable<void> { return this.http.post<void>(`${this.baseUrl}/feedback`, payload); }
  track(recommendationId: string, eventType: 'VIEWED' | 'DRILL_SELECTED' | 'DRILLS_ADDED'): Observable<void> { return this.http.post<void>(`${this.baseUrl}/events`, { recommendationId, eventType }); }
}
