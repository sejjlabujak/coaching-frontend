import { Routes } from '@angular/router';
import { TrainingPlan } from './pages/training-plan/training-plan';
import { AppComponent } from './app';
import { TrainingBuilderComponent } from './pages/training-builder/training-builder';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'planner',
    component: TrainingPlan,
  },
  {
    path: 'training-builder',
    component: TrainingBuilderComponent,
  },
];
