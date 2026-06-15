import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SessionDTO {
  id: number;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  intensity?: string;
  readOnly?: boolean;
}

export interface TrainingDrillDTO {
  id?: number;
  drillId?: number;
  title: string;
  duration?: number;
  orderIndex?: number;
}

export interface SessionDetailDTO {
  id?: number;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  intensity?: string;
  focus?: string;
  ageGroup?: string;
  drills?: TrainingDrillDTO[];
  note?: string;
  readOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionBackendService {
  private readonly baseUrl = `${environment.apiUrl}/api/sessions`;

  constructor(private http: HttpClient) {}

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

  updateSession(id: number, session: SessionDetailDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, session);
  }

  updateNote(id: number, note: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/note`, { note });
  }

  deleteSession(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  reuseSession(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reuse`, {});
  }
}
