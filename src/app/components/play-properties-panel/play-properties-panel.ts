import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  AGE_GROUP_OPTIONS,
  AgeGroup,
  DIFFICULTY_OPTIONS,
  Difficulty,
  PLAY_CATEGORIES,
  Play,
  PlayCategory,
} from '../../models/play.model';

@Component({
  selector: 'app-play-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './play-properties-panel.html',
  styleUrl: './play-properties-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayPropertiesPanelComponent implements OnChanges {
  @Input() play: Play | null = null;
  @Output() playUpdate = new EventEmitter<Partial<Play>>();

  readonly categoryOptions = PLAY_CATEGORIES;
  readonly difficultyOptions = DIFFICULTY_OPTIONS;
  readonly ageGroupOptions = AGE_GROUP_OPTIONS;

  name = '';
  category: PlayCategory = 'Offensive Plays';
  description = '';
  difficulty: Difficulty = 'Beginner';
  ageGroup: AgeGroup = 'U16';
  duration = 5;
  notes = '';
  tags = signal<string[]>([]);
  tagDraft = '';

  private currentPlayId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['play']) return;
    if (this.play?.id !== this.currentPlayId) {
      this.currentPlayId = this.play?.id ?? null;
      this.syncFromPlay();
    }
  }

  private syncFromPlay(): void {
    if (!this.play) return;
    this.name = this.play.name;
    this.category = this.play.category;
    this.description = this.play.description;
    this.difficulty = this.play.difficulty;
    this.ageGroup = this.play.ageGroup;
    this.duration = this.play.duration;
    this.notes = this.play.notes;
    this.tags.set([...this.play.tags]);
  }

  emitField<K extends keyof Play>(field: K, value: Play[K]): void {
    this.playUpdate.emit({ [field]: value } as Partial<Play>);
  }

  onAddTag(): void {
    const value = this.tagDraft.trim();
    if (!value) return;
    if (!this.tags().includes(value)) {
      this.tags.update((t) => [...t, value]);
      this.emitField('tags', this.tags());
    }
    this.tagDraft = '';
  }

  onRemoveTag(tag: string): void {
    this.tags.update((t) => t.filter((x) => x !== tag));
    this.emitField('tags', this.tags());
  }
}
