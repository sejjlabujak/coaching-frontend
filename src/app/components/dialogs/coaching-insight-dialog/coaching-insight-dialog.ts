import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Button } from '../../button/button';
import { CoachingInsight } from '../../../models/coaching-insight.model';
import { RecommendationService } from '../../../services/recoommendation.service';
import { NegativeInsightFeedbackDialogComponent } from '../negative-insight-feedback-dialog/negative-insight-feedback-dialog';

@Component({ selector: 'app-coaching-insight-dialog', standalone: true, imports: [CommonModule, MatDialogModule, MatSnackBarModule, Button], templateUrl: './coaching-insight-dialog.html', styleUrl: './coaching-insight-dialog.css' })
export class CoachingInsightDialogComponent {
  readonly data = inject<CoachingInsight>(MAT_DIALOG_DATA); private readonly ref = inject(MatDialogRef<CoachingInsightDialogComponent>); private readonly dialog = inject(MatDialog); private readonly recommendations = inject(RecommendationService); private readonly snack = inject(MatSnackBar); private readonly router = inject(Router); selected = signal<Set<number>>(new Set());
  constructor() { this.recommendations.track(this.data.id, 'VIEWED').subscribe(); }
  toggle(id: number) { this.selected.update(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); this.recommendations.track(this.data.id, 'DRILL_SELECTED').subscribe(); return next; }); }
  useful() { this.recommendations.feedback({ recommendationId: this.data.id, feedbackType: 'USEFUL' }).subscribe(() => this.snack.open('Thanks for the feedback.', undefined, { duration: 2500, panelClass: 'snack-success' })); }
  notUseful() { this.dialog.open(NegativeInsightFeedbackDialogComponent, { width: '440px', maxWidth: '94vw', data: this.data.id }); }
  continueToTraining() { this.recommendations.track(this.data.id, 'DRILLS_ADDED').subscribe(); this.ref.close(); this.router.navigate(['/planner']); }
  close() { this.ref.close(); }
}
