export type InsightPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RecommendedDrill {
  drillId: number;
  drillTitle: string;
  reason: string;
}

export interface CoachingInsight {
  id: string;
  priority: InsightPriority;
  title: string;
  metric: string;
  explanation: string;
  trainingFocus: string[];
  recommendedDrills: RecommendedDrill[];
}
