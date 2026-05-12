import { Routes } from '@angular/router';
import { TrainingPlan } from './pages/training-plan/training-plan';
import { AppComponent } from './app';
import { TrainingBuilderComponent } from './pages/training-builder/training-builder';
import { DrillLibraryComponent } from './pages/drill-library/drill-library';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { PlayerRosterComponent } from './pages/player-roster/player-roster';
import { EditProfileComponent } from './pages/edit-profile/edit-profile';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'roster',
    component: PlayerRosterComponent,
  },
  {
    path: 'settings',
    component: EditProfileComponent,
  },
  {
    path: 'planner',
    component: TrainingPlan,
  },
  {
    path: 'training-builder',
    component: TrainingBuilderComponent,
  },
  {
  path: 'drills',
  component: DrillLibraryComponent,
  },
];
