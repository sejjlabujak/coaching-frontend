import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StatisticsImportService {
  private readonly http = inject(HttpClient);
  importCsv(payload: unknown): Observable<{ gameId: number; playersImported: number; status: string }> {
    return this.http.post<{ gameId: number; playersImported: number; status: string }>(`${environment.apiUrl}/api/statistics-import/csv`, payload);
  }
}
