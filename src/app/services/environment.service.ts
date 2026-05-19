import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Environment Configuration Service
 * Centralized service for accessing environment-specific configuration
 * Used by all backend services to determine API endpoints
 */
@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    console.log(`🌍 Environment Service initialized - API URL: ${this.apiUrl}`);
  }

  /**
   * Get the base API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Get a specific API endpoint URL
   */
  getEndpoint(path: string): string {
    return `${this.apiUrl}${path}`;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return environment.production;
  }
}

