import { Injectable, signal, computed } from '@angular/core';
import { LibraryDrill, DrillLibraryFilters } from '../models/library-drill-model';
import { TrainingFocus, IntensityLevel, AgeSelection } from '../models/training-event-model';

@Injectable({ providedIn: 'root' })
export class DrillLibraryService {
  private allDrills = signal<LibraryDrill[]>([
    {
      id: '1',
      title: 'Layup Drill',
      description: 'A basic drill for practicing layups from both sides of the basket.',
      focus: 'Shooting',
      intensity: 'LOW',
      ageGroup: 'U14',
      tag: '#Shooting',
      equipment: ['Basketball'],
      duration: 15,
      level: 'Beginner',
    },
    {
      id: '2',
      title: 'Full Court Press Break',
      description: 'Drill to practice breaking a full court press defense.',
      focus: 'Defense',
      intensity: 'MEDIUM',
      ageGroup: 'U16',
      tag: '#Defense',
      equipment: ['Basketball', 'Cones'],
      duration: 20,
      level: 'Intermediate',
    },
    {
      id: '3',
      title: 'Suicide Sprints',
      description: 'Conditioning drill to improve speed and endurance.',
      focus: 'Conditioning',
      intensity: 'HIGH',
      ageGroup: 'U18',
      tag: '#Conditioning',
      equipment: [],
      duration: 10,
      level: 'Advanced',
    },
    {
      id: '4',
      title: 'Three-Point Shooting',
      description: 'Advanced perimeter shooting drill focusing on consistency from the arc.',
      focus: 'Shooting',
      intensity: 'MEDIUM',
      ageGroup: 'U18',
      tag: '#Shooting',
      equipment: ['Basketball', 'Rack'],
      duration: 25,
      level: 'Intermediate',
    },
    {
      id: '5',
      title: 'Defensive Slides',
      description: 'Lateral movement and defensive stance improvement drill.',
      focus: 'Defense',
      intensity: 'MEDIUM',
      ageGroup: 'U16',
      tag: '#Defense',
      equipment: ['Cones'],
      duration: 15,
      level: 'Beginner',
    },
    {
      id: '6',
      title: 'Pick and Roll Execution',
      description: 'Offensive execution of pick and roll plays with various coverages.',
      focus: 'Offense',
      intensity: 'MEDIUM',
      ageGroup: 'U18',
      tag: '#Offense',
      equipment: ['Basketball', 'Cones'],
      duration: 20,
      level: 'Advanced',
    },
    {
      id: '7',
      title: 'Free Throw Routine',
      description: 'Structured routine to build consistency and mental focus at the line.',
      focus: 'Shooting',
      intensity: 'LOW',
      ageGroup: 'U12',
      tag: '#Shooting',
      equipment: ['Basketball'],
      duration: 10,
      level: 'Beginner',
    },
    {
      id: '8',
      title: 'Rebounding Boxing Out',
      description: 'Teach players to establish position and secure defensive rebounds.',
      focus: 'Rebounding',
      intensity: 'HIGH',
      ageGroup: 'U16',
      tag: '#Rebounding',
      equipment: ['Basketball'],
      duration: 18,
      level: 'Intermediate',
    },
    {
      id: '9',
      title: 'Fast Break Finishing',
      description: 'Transition offense drill focused on finishing in traffic at full speed.',
      focus: 'Conditioning',
      intensity: 'HIGH',
      ageGroup: 'Senior',
      tag: '#Conditioning',
      equipment: ['Basketball', 'Cones'],
      duration: 20,
      level: 'Advanced',
    },
    {
      id: '10',
      title: 'Team Communication Drill',
      description: 'Build chemistry and on-court communication through guided exercises.',
      focus: 'Team Building',
      intensity: 'LOW',
      ageGroup: 'U14',
      tag: '#TeamBuilding',
      equipment: ['Basketball'],
      duration: 25,
      level: 'Beginner',
    },
  ]);

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
        drill.description.toLowerCase().includes(f.search.toLowerCase());

      const matchesFocus = f.focus === 'All Focus' || drill.focus === f.focus;
      const matchesIntensity = f.intensity === 'All Intensity' || drill.intensity === f.intensity;
      const matchesAge = f.ageGroup === 'All Age Groups' || drill.ageGroup === f.ageGroup;

      return matchesSearch && matchesFocus && matchesIntensity && matchesAge;
    });
  });

  updateFilter<K extends keyof DrillLibraryFilters>(key: K, value: DrillLibraryFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  deleteDrill(id: string): void {
    this.allDrills.update((drills) => drills.filter((d) => d.id !== id));
  }

  updateDrill(updated: LibraryDrill): void {
    this.allDrills.update((drills) =>
      drills.map((d) => (d.id === updated.id ? { ...updated } : d)),
    );
  }

  addDrill(drill: LibraryDrill): void {
    this.allDrills.update((drills) => [...drills, drill]);
  }

  getDrillById(id: string): LibraryDrill | undefined {
    return this.allDrills().find((d) => d.id === id);
  }


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
