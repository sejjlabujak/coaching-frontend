import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Button } from '../../button/button';
import { RecommendationService } from '../../../services/recoommendation.service';

@Component({ selector: 'app-negative-insight-feedback-dialog', standalone: true, imports: [CommonModule, FormsModule, MatDialogModule, Button], templateUrl: './negative-insight-feedback-dialog.html', styleUrl: './negative-insight-feedback-dialog.css' })
export class NegativeInsightFeedbackDialogComponent {
  readonly id = inject<string>(MAT_DIALOG_DATA); readonly ref = inject(MatDialogRef<NegativeInsightFeedbackDialogComponent>); private readonly recommendations = inject(RecommendationService); reason = ''; comment = ''; submitting = false;
  submit() { this.submitting = true; this.recommendations.feedback({ recommendationId: this.id, feedbackType: 'NOT_USEFUL', reason: this.reason || undefined, comment: this.comment || undefined }).subscribe({ next: () => this.ref.close(true), error: () => this.submitting = false }); }
}
