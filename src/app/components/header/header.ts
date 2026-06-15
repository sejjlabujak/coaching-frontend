import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidebarState = inject(SidebarStateService);

  currentDate: Date = new Date();

  get username(): string {
    return this.auth.currentUser()?.username ?? '';
  }

  get role(): string {
    return this.auth.currentUser()?.role ?? '';
  }

  get teamName(): string | null {
    return this.auth.currentUser()?.teamName ?? null;
  }

  goToProfile(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.auth.logout();
  }
}
