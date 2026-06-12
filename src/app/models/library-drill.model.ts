import { IntensityLevel, TrainingFocus } from './training-event.model';

export interface LibraryDrill {
  id: string;
  title: string;
  description: string;
  focus: TrainingFocus;
  intensity: IntensityLevel;
  tag?: string;
  equipment?: string[];
  duration?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface DrillLibraryFilters {
  search: string;
  focus: TrainingFocus | 'All Focus';
  intensity: IntensityLevel | 'All Intensity';
}
