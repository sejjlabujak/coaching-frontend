import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../search/search-input.component';
import { DrillCardComponent } from '../drill-card/drill-card';
import { Drill } from '../../models/drill.model';
import { RecommendationService, Recommendation } from '../../services/recoommendation.service';
import { DrillLibraryService } from '../../services/drill-library.service';

@Component({
  selector: 'drill-library-sidebar',
  standalone: true,
  templateUrl: './drill-library-sidebar.html',
  styleUrl: './drill-library-sidebar.css',
  imports: [CommonModule, SearchInputComponent, DrillCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillLibrarySidebarComponent implements OnInit {
  @Input() isMaxDuration: boolean = false;
  @Output() drillAdded = new EventEmitter<Drill>();

  private searchQuery = '';
  recommendations = signal<Recommendation[]>([]);
  allDrills = signal<Drill[]>([]);
  aiExpanded = signal(true);

  private readonly recommendationService = inject(RecommendationService);
  private readonly libraryService = inject(DrillLibraryService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.recommendationService.getRecommendations().subscribe({
      next: (recs) => {
        this.recommendations.set(recs);
        this.cdr.markForCheck();
      },
      error: () => {
        this.recommendations.set([]);
        this.cdr.markForCheck();
      },
    });

    this.libraryService.loadDrills();
  }

  get filteredDrills(): Drill[] {
    const drills = this.libraryService.filteredDrills().map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      tag: d.tag,
      equipment: d.equipment,
      duration: d.duration,
      level: d.level,
    }));

    if (!this.searchQuery.trim()) return drills;
    const q = this.searchQuery.toLowerCase();
    return drills.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        (d.tag?.toLowerCase().includes(q) ?? false),
    );
  }

  get recommendedDrills(): Drill[] {
    return this.recommendations().flatMap((rec) =>
      rec.recommendedDrills.map((d) => ({
        id: String(d.drillId),
        title: d.drillTitle,
        tag: rec.weakArea,
        description: d.reason,
      })),
    );
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.libraryService.updateFilter('search', query);
  }

  toggleAi(): void {
    this.aiExpanded.update((v) => !v);
  }

  onDrillAdd(drill: Drill): void {
    this.drillAdded.emit(drill);
  }
}
