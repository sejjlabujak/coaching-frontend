import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  showPassword = false;
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    if (!this.username.trim() || !this.password) {
      this.error.set('Please enter your username and password.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username.trim(), this.password).subscribe((result) => {
      this.loading.set(false);

      if (!result.success) {
        this.error.set(result.error ?? 'Login failed.');
        return;
      }

      const user = this.auth.currentUser()!;
      if (user.mustChangePassword && user.role === 'COACH') {
        this.router.navigate(['/change-password']);
      } else if (user.role === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
