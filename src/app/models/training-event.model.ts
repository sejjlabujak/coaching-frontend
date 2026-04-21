export type IntensityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type TrainingFocus =
  | 'Shooting'
  | 'Defense'
  | 'Offense'
  | 'Conditioning'
  | 'Recovery'
  | 'Rebounding'
  | 'Team Building';
export type TrainingColor = 'red' | 'navy';

export type AgeSelection = 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Senior';

export interface TrainingDrill {
  id: number;
  name: string;
}

export interface TrainingEvent {
  id: number;
  date: Date;
  title: string;
  color: TrainingColor;
  duration?: number; // in minutes
  intensity?: IntensityLevel;
  focus?: string;
  drills?: TrainingDrill[];
  ageGroup?: AgeSelection;
}

export interface CreateTrainingFormData {
  date: Date | null;
  duration: number;
  focus: TrainingFocus;
  intensity: IntensityLevel;
  ageGroup: AgeSelection;
}

export interface EmptySlotData {
  date: Date;
}

export interface EventDetailData {
  event: TrainingEvent;
}

export interface SelectTrainingData {
  targetDate: Date;
}
