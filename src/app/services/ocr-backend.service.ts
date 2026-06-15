import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OcrDrill {
  title: string;
  description: string;
  focus: string;
  intensity: string;
  level: string;
  equipment: string | null;
}

@Injectable({ providedIn: 'root' })
export class OcrBackendService {
  private readonly baseUrl = `${environment.apiUrl}/api/drills`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('drill_document', file);
    return this.http.post<any>(`${this.baseUrl}/ocr-upload`, formData);
  }

  confirmAllDrills(drills: OcrDrill[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/ocr-confirm-all`, drills);
  }
}
