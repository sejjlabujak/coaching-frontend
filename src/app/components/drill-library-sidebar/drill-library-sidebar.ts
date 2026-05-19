import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../search/search-input.component';
import { DrillCardComponent } from '../drill-card/drill-card';
import { Drill } from '../../models/drill.model';
import { RecommendationService } from '../../services/recoommendation.service';

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

  private searchQuery: string = '';
  private allRecommendations: Drill[] = [];

  private readonly recommendationService = inject(RecommendationService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.recommendationService.getRecommendations().subscribe({
      next: (recs) => {
        // Flatten all recommendedDrills from all weak areas into one list
        this.allRecommendations = recs.flatMap((rec) =>
          rec.recommendedDrills.map((d) => ({
            id: String(d.drillId),
            title: d.drillTitle,
            tag: rec.weakArea,
            description: d.reason,
          })),
        );
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to empty — sidebar just shows nothing
        this.allRecommendations = [];
        this.cdr.markForCheck();
      },
    });
  }

  get filteredRecommendations(): Drill[] {
    if (!this.searchQuery.trim()) return this.allRecommendations;
    const q = this.searchQuery.toLowerCase();
    return this.allRecommendations.filter(
      (d) => d.title.toLowerCase().includes(q) || (d.tag?.toLowerCase().includes(q) ?? false),
    );
  }

  onSearch(query: string): void {
    this.searchQuery = query;
  }

  onDrillAdd(drill: Drill): void {
    this.drillAdded.emit(drill);
  }
}
