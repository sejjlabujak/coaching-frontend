import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { Button } from '../../components/button/button';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { ProfileService, ProfileDTO } from '../../services/profile.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSidenavModule,
    MatSnackBarModule,
    HeaderComponent,
    SidebarComponent,
    Button,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileComponent implements OnInit {
  private readonly sidebarState = inject(SidebarStateService);
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }

  profile: ProfileDTO | null = null;
  email = '';
  isSaving = false;
  isLoading = true;

  get initials(): string {
    return (this.profile?.username ?? '?')[0].toUpperCase();
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.email = p.email;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onExpandedChange(expanded: boolean): void {
    this.sidebarState.isExpanded = expanded;
  }

  onSubmit(): void {
    if (this.isSaving || !this.email.trim()) return;
    this.isSaving = true;
    this.profileService.updateProfile(this.email.trim()).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Profile updated.', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to update profile.', 'Close', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.markForCheck();
      },
    });
  }

  onChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
