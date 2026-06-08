import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, filter, take } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface OcrJobResponse {
  jobId: string;
  status: string;
}

export interface OcrStatusResponse {
  extractedTitle: string;
  extractedText: string;
  confidence: number;
  category: string;
  level: string;
  intensity: string;
  ageGroup: string;
  duration: string;
  equipment: string;
  status?: string;
}

export interface OcrDrill {
  title: string;
  description: string;
  focus: string;
  intensity: string;
  ageGroup: string | null;
  level: string;
  equipment: string | null;
}

@Injectable({ providedIn: 'root' })
export class OcrBackendService {
  private baseUrl: string;

  constructor(private http: HttpClient, private env: EnvironmentService) {
    this.baseUrl = this.env.getEndpoint('/api/drills');
  }

  uploadFile(file: File): Observable<OcrJobResponse> {
    const formData = new FormData();
    formData.append('drill_document', file);
    return this.http.post<OcrJobResponse>(`${this.baseUrl}/ocr-upload`, formData);
  }

  getStatus(jobId: string): Observable<OcrStatusResponse> {
    return this.http.get<OcrStatusResponse>(`${this.baseUrl}/ocr-status/${jobId}`);
  }

  getDrills(jobId: string): Observable<OcrDrill[]> {
    return this.http.get<OcrDrill[]>(`${this.baseUrl}/ocr-drills/${jobId}`);
  }

  confirmAllDrills(drills: OcrDrill[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/ocr-confirm-all`, drills);
  }

  // Poll status every 10 seconds until done
  pollUntilDone(jobId: string): Observable<OcrStatusResponse> {
    return interval(10000).pipe(
      switchMap(() => this.getStatus(jobId)),
      filter((res) => res.extractedTitle !== undefined && res.status !== 'processing'),
      take(1),
    );
  }
}
