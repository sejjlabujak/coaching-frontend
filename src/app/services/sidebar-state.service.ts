import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  /** Persists sidebar open/closed state across route navigations. */
  isExpanded = true;
}
