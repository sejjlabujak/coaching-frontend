export interface StatCard {
  label: string;
  value: string;
  icon: string; // Material icon name
  color: 'primary' | 'destructive' | 'secondary';
}

export interface PerformanceMetric {
  stat: string;
  value: number;
  fullMark: number;
}

export interface TeamAnalysis {
  strengths: string;
  improvements: string;
  recommendation: string;
}

