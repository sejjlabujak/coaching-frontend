import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../button/button';

@Component({
  selector: 'app-team-analysis',
  template: `
    <div class="analysis-container">
      <div class="analysis-header">
        <mat-icon class="trending-icon">trending_up</mat-icon>
        <h3 class="analysis-title">Team Analysis</h3>
      </div>

      <div class="analysis-content">
        <div class="analysis-section">
          <strong class="section-label">Strengths:</strong>
          <p class="section-text">{{ teamAnalysis.strengths }}</p>
        </div>

        <div class="analysis-section">
          <strong class="section-label">Areas for Improvement:</strong>
          <p class="section-text">{{ teamAnalysis.improvements }}</p>
        </div>

        <div class="analysis-section">
          <strong class="section-label">Recommendation:</strong>
          <p class="section-text">{{ teamAnalysis.recommendation }}</p>
        </div>
      </div>

      <button-2
        (click)="onCreatePlan()"
        type="regular"
        class="create-plan-btn"
      >
        Create Training Plan
      </button-2>
    </div>
  `,
  styleUrl: './team-analysis.css',
  imports: [CommonModule, MatIconModule, Button],
  standalone: true,
})
export class TeamAnalysisComponent {
  @Input() teamAnalysis = {
    strengths: 'The team shows exceptional shooting accuracy (85%) and speed metrics. Defense coordination has improved by 12% over the last month.',
    improvements: 'Assist rates need attention. Consider drills focused on passing and court awareness.',
    recommendation: 'Increase intensity in defensive drills and add dedicated assist training sessions.',
  };

  onCreatePlan(): void {
    console.log('Create Training Plan clicked');
    // TODO: Navigate to training plan creation
  }
}

