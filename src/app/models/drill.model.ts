export interface Drill {
  id?: string;
  backendId?: number;
  title: string;
  tag?: string;
  category?: string;
  description?: string;
  equipment?: string[];
  duration?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

