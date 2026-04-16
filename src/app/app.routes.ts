import { Routes } from '@angular/router';
import { TrainingPlan } from './pages/training-plan/training-plan';
import { AppComponent } from './app';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'planner',
    component: TrainingPlan,
  },
];
