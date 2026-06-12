import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  error = signal('');
  loading = signal(false);

  get username(): string {
    return this.auth.currentUser()?.username ?? '';
  }

  onSubmit(): void {
    this.error.set('');

    if (!this.currentPassword) {
      this.error.set('Please enter your current (temporary) password.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.error.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.auth.changePassword(this.username, this.currentPassword, this.newPassword).subscribe((result) => {
      this.loading.set(false);
      if (!result.success) {
        this.error.set(result.error ?? 'Failed to change password.');
        return;
      }
      this.router.navigate(['/dashboard']);
    });
  }
}
