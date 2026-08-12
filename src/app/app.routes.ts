import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { ChangePasswordComponent } from './pages/change-password/change-password';
import { AdminComponent } from './pages/admin/admin';
import { TrainingPlan } from './pages/training-plan/training-plan';
import { TrainingBuilderComponent } from './pages/training-builder/training-builder';
import { DrillLibraryComponent } from './pages/drill-library/drill-library';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { PlayerRosterComponent } from './pages/player-roster/player-roster';
import { EditProfileComponent } from './pages/edit-profile/edit-profile';
import { PlaybookComponent } from './pages/playbook/playbook';
import { PlaybookListComponent } from './pages/playbook-list/playbook-list';
import { authGuard } from './guards/auth.guard';
import { adminGuard, coachGuard } from './guards/role.guard';

export const routes: Routes = [
  // Public
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },

  // Admin
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },

  // Coach
  { path: 'dashboard',        component: DashboardComponent,      canActivate: [authGuard, coachGuard] },
  { path: 'roster',           component: PlayerRosterComponent,   canActivate: [authGuard, coachGuard] },
  { path: 'drills',           component: DrillLibraryComponent,   canActivate: [authGuard, coachGuard] },
  { path: 'playbook',         component: PlaybookListComponent,   canActivate: [authGuard, coachGuard] },
  { path: 'playbook/:id',     component: PlaybookComponent,       canActivate: [authGuard, coachGuard] },
  { path: 'planner',          component: TrainingPlan,            canActivate: [authGuard, coachGuard] },
  { path: 'training-builder', component: TrainingBuilderComponent, canActivate: [authGuard, coachGuard] },
  { path: 'settings',         component: EditProfileComponent,    canActivate: [authGuard, coachGuard] },

  // Fallback
  { path: '',   redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
