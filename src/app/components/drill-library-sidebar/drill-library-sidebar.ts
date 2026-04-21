import { ChangeDetectionStrategy, Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../search/search-input.component';
import { DrillCardComponent } from '../drill-card/drill-card';
import { Drill } from '../../models/drill-model';

@Component({
  selector: 'drill-library-sidebar',
  standalone: true,
  templateUrl: './drill-library-sidebar.html',
  styleUrl: './drill-library-sidebar.css',
  imports: [CommonModule, SearchInputComponent, DrillCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillLibrarySidebarComponent {
  @Input() isMaxDuration: boolean = false;
  @Output() drillAdded = new EventEmitter<Drill>();

  private searchQuery: string = '';

  private readonly allRecommendations: Drill[] = [
    { title: 'Fast Break Finishing', tag: '#Conditioning', level: 'Intermediate', duration: 15 },
    { title: 'Free Throw Practice', tag: '#Shooting', level: 'Beginner', duration: 20 },
    { title: 'Rebounding Boxing Out', tag: '#Defense', level: 'Advanced', duration: 18 },
    { title: 'Pick and Roll', tag: '#Offense', level: 'Intermediate', duration: 20 },
    { title: 'Defensive Slides', tag: '#Defense', level: 'Beginner', duration: 15 },
  ];

  get filteredRecommendations(): Drill[] {
    if (!this.searchQuery.trim()) return this.allRecommendations;
    const q = this.searchQuery.toLowerCase();
    return this.allRecommendations.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.tag?.toLowerCase().includes(q) ?? false)
    );
  }

  onSearch(query: string): void {
    this.searchQuery = query;
  }

  onDrillAdd(drill: Drill): void {
    this.drillAdded.emit(drill);
  }
}
