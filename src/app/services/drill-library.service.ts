import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LibraryDrill, DrillLibraryFilters } from '../models/library-drill.model';
import { TrainingFocus, IntensityLevel, AgeSelection } from '../models/training-event.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DrillLibraryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/drills`;

  private allDrills = signal<LibraryDrill[]>([]);
  isLoading = signal(false);

  filters = signal<DrillLibraryFilters>({
    search: '',
    focus: 'All Focus',
    intensity: 'All Intensity',
    ageGroup: 'All Age Groups',
  });

  filteredDrills = computed(() => {
    const f = this.filters();
    return this.allDrills().filter((drill) => {
      const matchesSearch =
        !f.search ||
        drill.title.toLowerCase().includes(f.search.toLowerCase()) ||
        (drill.description ?? '').toLowerCase().includes(f.search.toLowerCase());

      const matchesFocus = f.focus === 'All Focus' || drill.focus === f.focus;
      const matchesIntensity = f.intensity === 'All Intensity' || drill.intensity === f.intensity;
      const matchesAge = f.ageGroup === 'All Age Groups' || drill.ageGroup === f.ageGroup;

      return matchesSearch && matchesFocus && matchesIntensity && matchesAge;
    });
  });

  // ── Read ───────────────────────────────────────────────────────────────────

  loadDrills(focus?: string, search?: string): void {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (focus && focus !== 'All Focus') params = params.set('focus', focus);
    if (search) params = params.set('search', search);

    this.http.get<BackendDrill[]>(this.baseUrl, { params }).subscribe({
      next: (drills) => {
        this.allDrills.set(drills.map(this.fromBackend));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  createDrill(drill: Omit<LibraryDrill, 'id'>): Observable<{ id: number; status: string }> {
    return this.http.post<{ id: number; status: string }>(this.baseUrl, this.toBackend(drill)).pipe(
      tap((res) => {
        const newDrill: LibraryDrill = { ...drill, id: String(res.id) };
        this.allDrills.update((drills) => [...drills, newDrill]);
      }),
    );
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  updateDrill(updated: LibraryDrill): void {
    this.http
      .put<{ id: number; status: string }>(`${this.baseUrl}/${updated.id}`, this.toBackend(updated))
      .subscribe({
        next: () => {
          this.allDrills.update((drills) =>
            drills.map((d) => (d.id === updated.id ? { ...updated } : d)),
          );
        },
        error: (err) => console.error('Failed to update drill', err),
      });
  }

  // ── Delete (soft) ──────────────────────────────────────────────────────────

  deleteDrill(id: string): void {
    this.http.delete<{ status: string; message: string }>(`${this.baseUrl}/${id}`).subscribe({
      next: () => {
        this.allDrills.update((drills) => drills.filter((d) => d.id !== id));
      },
      error: (err) => console.error('Failed to delete drill', err),
    });
  }

  // ── Local helpers ──────────────────────────────────────────────────────────

  addDrill(drill: LibraryDrill): void {
    this.allDrills.update((drills) => [...drills, drill]);
  }

  updateFilter<K extends keyof DrillLibraryFilters>(key: K, value: DrillLibraryFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  getDrillById(id: string): LibraryDrill | undefined {
    return this.allDrills().find((d) => d.id === id);
  }

  // ── Mapping ────────────────────────────────────────────────────────────────

  private fromBackend = (d: BackendDrill): LibraryDrill => ({
    id: String(d.id),
    title: d.title,
    description: d.description ?? '',
    focus: this.mapFocus(d.focus),
    intensity: (d.intensity ?? 'MEDIUM') as IntensityLevel,
    ageGroup: (d.ageGroup ?? 'U16') as AgeSelection,
    tag: d.tag ?? undefined,
    equipment: d.equipment ? d.equipment.split(',').map((s) => s.trim()) : [],
    duration: d.duration ?? undefined,
    level: (d.level as LibraryDrill['level']) ?? 'Beginner',
  });

  private toBackend(d: Partial<LibraryDrill>): BackendDrillPayload {
    return {
      title: d.title ?? '',
      description: d.description ?? '',
      focus: d.focus ? d.focus.toUpperCase().replace(' ', '_') : null,
      intensity: d.intensity ?? null,
      ageGroup: d.ageGroup ?? null,
      tag: d.tag ?? null,
      equipment: d.equipment?.join(', ') ?? null,
      duration: d.duration ?? null,
      level: d.level ?? null,
    };
  }

  /** Map backend ENUM string to frontend TrainingFocus display string */
  private mapFocus(raw: string | null): TrainingFocus {
    const map: Record<string, TrainingFocus> = {
      SHOOTING: 'Shooting',
      DEFENSE: 'Defense',
      OFFENSE: 'Offense',
      CONDITIONING: 'Conditioning',
      RECOVERY: 'Recovery',
      REBOUNDING: 'Rebounding',
      TEAM_BUILDING: 'Team Building',
    };
    return map[raw ?? ''] ?? 'Offense';
  }

  // ── Filter option lists ────────────────────────────────────────────────────

  focusOptions: (TrainingFocus | 'All Focus')[] = [
    'All Focus',
    'Shooting',
    'Defense',
    'Offense',
    'Conditioning',
    'Recovery',
    'Rebounding',
    'Team Building',
  ];

  intensityOptions: (IntensityLevel | 'All Intensity')[] = [
    'All Intensity',
    'LOW',
    'MEDIUM',
    'HIGH',
  ];

  ageGroupOptions: (AgeSelection | 'All Age Groups')[] = [
    'All Age Groups',
    'U10',
    'U12',
    'U14',
    'U16',
    'U18',
    'Senior',
  ];
}

// ── Backend DTOs ─────────────────────────────────────────────────────────────

interface BackendDrill {
  id: number;
  title: string;
  description: string | null;
  focus: string | null;
  intensity: string | null;
  ageGroup: string | null;
  tag: string | null;
  duration: number | null;
  level: string | null;
  equipment: string | null;
}

interface BackendDrillPayload {
  title: string;
  description: string | null;
  focus: string | null;
  intensity: string | null;
  ageGroup: string | null;
  tag: string | null;
  equipment: string | null;
  duration: number | null;
  level: string | null;
}
