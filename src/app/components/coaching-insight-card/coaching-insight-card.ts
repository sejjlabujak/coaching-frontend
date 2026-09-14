import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '../button/button';
import { CoachingInsight } from '../../models/coaching-insight.model';

@Component({ selector: 'app-coaching-insight-card', standalone: true, imports: [CommonModule, Button], templateUrl: './coaching-insight-card.html', styleUrl: './coaching-insight-card.css' })
export class CoachingInsightCardComponent {
  @Input({ required: true }) insight!: CoachingInsight;
  @Input() rank = 1;
  @Output() viewRecommendation = new EventEmitter<CoachingInsight>();
}
