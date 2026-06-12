import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface ProfileDTO {
  username: string;
  email: string;
  role: string;
  teamName: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);
  private readonly baseUrl = this.env.getEndpoint('/api/profile');

  getProfile(): Observable<ProfileDTO> {
    return this.http.get<ProfileDTO>(this.baseUrl);
  }

  updateProfile(email: string): Observable<any> {
    return this.http.put(this.baseUrl, { email });
  }
}
