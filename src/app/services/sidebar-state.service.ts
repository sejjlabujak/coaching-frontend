import { Injectable, signal, computed } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  /** Desktop: sidebar expanded (200px) vs collapsed (70px) */
  isExpanded = true;

  /** Mobile: sidebar overlay open/closed */
  private _mobileOpen = signal(false);
  readonly mobileOpen = this._mobileOpen.asReadonly();

  private readonly _bp: BreakpointObserver;

  readonly isMobile = computed(() => {
    const s = this._isMobileRaw();
    return s?.matches ?? false;
  });

  private readonly _isMobileRaw;

  constructor(bp: BreakpointObserver) {
    this._bp = bp;
    this._isMobileRaw = toSignal(
      bp.observe('(max-width: 768px)').pipe(map(r => r))
    );
  }

  toggleMobile(): void {
    this._mobileOpen.set(!this._mobileOpen());
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }
}
