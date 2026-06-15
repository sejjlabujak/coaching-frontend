export type IntensityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type TrainingFocus =
  | 'Shooting'
  | 'Defense'
  | 'Offense'
  | 'Conditioning'
  | 'Recovery'
  | 'Rebounding'
  | 'Team Building';
export type AgeSelection = 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Senior';

export interface TrainingDrill {
  id: number;
  drillId?: number;
  name: string;
  duration?: number;
}

export interface TrainingEvent {
  id: number;
  date: Date;
  title: string;
  duration?: number; // in minutes
  startTime?: string; // "HH:mm"
  intensity?: IntensityLevel;
  focus?: string;
  drills?: TrainingDrill[];
  ageGroup?: AgeSelection;
  note?: string;
  readOnly?: boolean;
}

export interface CreateTrainingFormData {
  date: Date | null;
  startTime: string;
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
