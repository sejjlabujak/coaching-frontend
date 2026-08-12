import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Play,
  PlayCategory,
  PLAY_CATEGORIES,
  defaultHalfCourtDiagram,
  emptyDiagram,
} from '../models/play.model';

const STORAGE_KEY = 'coaching-app.playbook.plays.v1';

function seedPlays(): Play[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'seed-1',
      name: 'Horns Flare',
      category: 'Offensive Plays',
      lastModified: now,
      favorite: true,
      description: 'High ball screen out of a horns set, flaring the weak-side wing for a catch-and-shoot look.',
      tags: ['ball-screen', 'horns'],
      difficulty: 'Intermediate',
      ageGroup: 'U18',
      duration: 8,
      notes: '',
      diagram: defaultHalfCourtDiagram(),
    },
    {
      id: 'seed-2',
      name: '2-3 Zone Shell',
      category: 'Defensive Plays',
      lastModified: now,
      favorite: false,
      description: 'Base 2-3 zone shell rotation drilling gap responsibilities.',
      tags: ['zone'],
      difficulty: 'Beginner',
      ageGroup: 'U14',
      duration: 10,
      notes: '',
      diagram: emptyDiagram('half'),
    },
    {
      id: 'seed-3',
      name: 'Box Look Away',
      category: 'BLOB',
      lastModified: now,
      favorite: false,
      description: 'Box alignment baseline out-of-bounds set with a look-away back cut.',
      tags: ['blob', 'box'],
      difficulty: 'Intermediate',
      ageGroup: 'U16',
      duration: 6,
      notes: '',
      diagram: emptyDiagram('half'),
    },
    {
      id: 'seed-4',
      name: 'Stack Inbound',
      category: 'SLOB',
      lastModified: now,
      favorite: false,
      description: 'Stack alignment sideline out-of-bounds play for a quick three.',
      tags: ['slob'],
      difficulty: 'Beginner',
      ageGroup: 'U16',
      duration: 5,
      notes: '',
      diagram: emptyDiagram('half'),
    },
    {
      id: 'seed-5',
      name: 'Rim Runner Fastbreak',
      category: 'Transition',
      lastModified: now,
      favorite: true,
      description: 'Three-lane fastbreak with a trailing shooter for early offense.',
      tags: ['transition', 'fastbreak'],
      difficulty: 'Beginner',
      ageGroup: 'Senior',
      duration: 7,
      notes: '',
      diagram: emptyDiagram('full'),
    },
    {
      id: 'seed-6',
      name: 'Elevator Doors',
      category: 'Quick Hitters',
      lastModified: now,
      favorite: false,
      description: 'Elevator screen quick hitter to spring a shooter off the doors.',
      tags: ['quick-hitter', 'elevator'],
      difficulty: 'Advanced',
      ageGroup: 'Senior',
      duration: 4,
      notes: '',
      diagram: emptyDiagram('half'),
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class PlaybookService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly plays = signal<Play[]>(this.loadInitial());
  readonly selectedPlayId = signal<string | null>(null);
  readonly searchTerm = signal<string>('');

  readonly selectedPlay = computed<Play | null>(
    () => this.plays().find((p) => p.id === this.selectedPlayId()) ?? null,
  );

  readonly filteredPlays = computed<Play[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.plays();
    return this.plays().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term)),
    );
  });

  readonly playsByCategory = computed<{ category: PlayCategory; plays: Play[] }[]>(() => {
    const all = this.filteredPlays();
    return PLAY_CATEGORIES.map((category) => ({
      category,
      plays: all.filter((p) => p.category === category),
    }));
  });

  private loadInitial(): Play[] {
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // fall through to seed data
      }
    }
    return seedPlays();
  }

  private persist(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plays()));
  }

  selectPlay(id: string | null): void {
    this.selectedPlayId.set(id);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  createPlay(category: PlayCategory = 'Offensive Plays'): Play {
    const newPlay: Play = {
      id: this.generateId(),
      name: 'New Play',
      category,
      lastModified: new Date().toISOString(),
      favorite: false,
      description: '',
      tags: [],
      difficulty: 'Beginner',
      ageGroup: 'U16',
      duration: 5,
      notes: '',
      diagram: defaultHalfCourtDiagram(),
    };
    this.plays.update((list) => [newPlay, ...list]);
    this.persist();
    this.selectPlay(newPlay.id);
    return newPlay;
  }

  updatePlay(id: string, patch: Partial<Play>): void {
    this.plays.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...patch, lastModified: new Date().toISOString() } : p)),
    );
    this.persist();
  }

  duplicatePlay(id: string): Play | null {
    const source = this.plays().find((p) => p.id === id);
    if (!source) return null;
    const copy: Play = {
      ...source,
      id: this.generateId(),
      name: `${source.name} (Copy)`,
      favorite: false,
      lastModified: new Date().toISOString(),
      diagram: JSON.parse(JSON.stringify(source.diagram)),
    };
    this.plays.update((list) => [copy, ...list]);
    this.persist();
    this.selectPlay(copy.id);
    return copy;
  }

  deletePlay(id: string): void {
    this.plays.update((list) => list.filter((p) => p.id !== id));
    if (this.selectedPlayId() === id) this.selectedPlayId.set(null);
    this.persist();
  }

  toggleFavorite(id: string): void {
    this.plays.update((list) =>
      list.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
    );
    this.persist();
  }

  private generateId(): string {
    if (this.isBrowser && 'randomUUID' in crypto) return crypto.randomUUID();
    return `play-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
