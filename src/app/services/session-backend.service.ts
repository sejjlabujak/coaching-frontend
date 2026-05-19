import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface SessionDTO {
  id: number;
  title: string;
  date: string;
  time?: string;
}

export interface TrainingDrillDTO {
  id?: number;
  title: string;
  duration?: number;
  orderIndex?: number;
}

export interface SessionDetailDTO {
  id?: number;
  title: string;
  date: string;
  duration?: number;
  intensity?: string;
  focus?: string;
  ageGroup?: string;
  drills?: TrainingDrillDTO[];
}

@Injectable({ providedIn: 'root' })
export class SessionBackendService {
  private baseUrl: string;

  constructor(private http: HttpClient, private env: EnvironmentService) {
    this.baseUrl = this.env.getEndpoint('/sessions');
  }

  getSessions(month?: number, year?: number): Observable<SessionDTO[]> {
    let params = new HttpParams();
    if (month !== undefined) params = params.set('month', month);
    if (year !== undefined) params = params.set('year', year);
    return this.http.get<SessionDTO[]>(this.baseUrl, { params });
  }

  getSessionById(id: number): Observable<SessionDetailDTO> {
    return this.http.get<SessionDetailDTO>(`${this.baseUrl}/${id}`);
  }

  createSession(session: SessionDetailDTO): Observable<any> {
    return this.http.post(this.baseUrl, session);
  }

  reuseSession(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reuse`, {});
  }
}
