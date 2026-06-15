import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../../components/calendar/calendar';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
  selector: 'training-plan',
  standalone: true,
  imports: [CommonModule, CalendarComponent, LayoutComponent],
  templateUrl: './training-plan.html',
  styleUrl: './training-plan.css',
})
export class TrainingPlan {}
