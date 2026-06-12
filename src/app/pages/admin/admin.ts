import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { CoachListItem, TeamOption } from '../../models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSidenavModule, SidebarComponent, HeaderComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly sidebarState = inject(SidebarStateService);

  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }
  onExpandedChange(v: boolean) { this.sidebarState.isExpanded = v; }

  // Add coach modal
  showAddCoachModal = false;
  newUsername = '';
  newPassword = '';
  newEmail = '';
  newTeamName = '';
  showPassword = false;
  formError = signal('');
  formSuccess = signal('');
  loading = signal(false);

  // Edit coach modal
  showEditCoachModal = false;
  editTargetId: number | null = null;
  editUsername = '';
  editEmail = '';
  editTeamName = '';
  editError = signal('');
  editSuccess = signal('');
  editLoading = signal(false);

  teams = signal<TeamOption[]>([]);
  coaches = signal<CoachListItem[]>([]);
  confirmTarget = signal<CoachListItem | null>(null);

  ngOnInit(): void {
    this.loadTeams();
    this.loadCoaches();
  }

  // ── Add coach ──────────────────────────────────────────────────────────────

  openAddCoachDialog(): void {
    this.showAddCoachModal = true;
  }

  closeAddCoachDialog(): void {
    this.showAddCoachModal = false;
    this.newUsername = '';
    this.newPassword = '';
    this.newEmail = '';
    this.newTeamName = '';
    this.showPassword = false;
    this.formError.set('');
    this.formSuccess.set('');
  }

  onCreateCoach(): void {
    this.formError.set('');
    this.formSuccess.set('');

    if (!this.newUsername.trim()) { this.formError.set('Username is required.'); return; }
    if (!this.newEmail.trim()) { this.formError.set('Email is required.'); return; }
    if (this.newPassword.length < 6) { this.formError.set('Password must be at least 6 characters.'); return; }
    if (!this.newTeamName) { this.formError.set('Please select a team.'); return; }

    this.loading.set(true);
    this.http
      .post<{ id: number; username: string; teamName: string }>(
        `${environment.apiUrl}/api/admin/coaches`,
        {
          username: this.newUsername.trim(),
          password: this.newPassword,
          email: this.newEmail.trim(),
          teamName: this.newTeamName,
        },
      )
      .subscribe({
        next: (created) => {
          this.loading.set(false);
          this.formSuccess.set(`Coach "${created.username}" created successfully.`);
          this.newUsername = '';
          this.newPassword = '';
          this.newEmail = '';
          this.newTeamName = '';
          this.loadCoaches();
          setTimeout(() => this.closeAddCoachDialog(), 1500);
        },
        error: (err) => {
          this.loading.set(false);
          this.formError.set(err.error?.error ?? err.message ?? 'Failed to create coach.');
        },
      });
  }

  // ── Edit coach ─────────────────────────────────────────────────────────────

  openEditDialog(coach: CoachListItem): void {
    this.editTargetId = coach.id;
    this.editUsername = coach.username;
    this.editEmail = coach.email;
    this.editTeamName = coach.teamName;
    this.editError.set('');
    this.editSuccess.set('');
    this.showEditCoachModal = true;
  }

  closeEditDialog(): void {
    this.showEditCoachModal = false;
    this.editTargetId = null;
    this.editError.set('');
    this.editSuccess.set('');
  }

  onSaveEdit(): void {
    if (!this.editTargetId) return;
    this.editError.set('');
    this.editSuccess.set('');

    if (!this.editUsername.trim()) { this.editError.set('Username is required.'); return; }
    if (!this.editEmail.trim()) { this.editError.set('Email is required.'); return; }
    if (!this.editTeamName) { this.editError.set('Please select a team.'); return; }

    this.editLoading.set(true);
    this.http
      .patch(`${environment.apiUrl}/api/admin/coaches/${this.editTargetId}`, {
        username: this.editUsername.trim(),
        email: this.editEmail.trim(),
        teamName: this.editTeamName,
      })
      .subscribe({
        next: () => {
          this.editLoading.set(false);
          this.editSuccess.set('Changes saved.');
          this.loadCoaches();
          setTimeout(() => this.closeEditDialog(), 1200);
        },
        error: (err) => {
          this.editLoading.set(false);
          this.editError.set(err.error?.error ?? err.message ?? 'Failed to save changes.');
        },
      });
  }

  // ── Deactivate / activate ──────────────────────────────────────────────────

  openConfirm(coach: CoachListItem): void {
    this.confirmTarget.set(coach);
  }

  cancelConfirm(): void {
    this.confirmTarget.set(null);
  }

  confirmToggle(): void {
    const coach = this.confirmTarget();
    if (!coach) return;
    this.confirmTarget.set(null);

    const action = coach.active ? 'deactivate' : 'activate';
    this.http
      .patch(`${environment.apiUrl}/api/admin/coaches/${coach.id}/${action}`, {})
      .subscribe({
        next: () => this.loadCoaches(),
        error: () => this.loadCoaches(),
      });
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  private loadTeams(): void {
    this.http.get<TeamOption[]>(`${environment.apiUrl}/api/admin/teams`).subscribe({
      next: (list) => this.teams.set(list),
      error: () => this.teams.set([]),
    });
  }

  private loadCoaches(): void {
    this.http.get<CoachListItem[]>(`${environment.apiUrl}/api/admin/coaches`).subscribe({
      next: (list) => this.coaches.set(list),
      error: () => this.coaches.set([]),
    });
  }
}
