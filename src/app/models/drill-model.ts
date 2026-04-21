export interface Drill {
  id?: string;
  title: string;
  tag?: string;
  category?: string;
  description?: string;
  equipment?: string[];
  duration?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

