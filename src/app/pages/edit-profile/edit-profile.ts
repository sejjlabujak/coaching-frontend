import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { Button } from '../../components/button/button';
import { ProfileData } from '../../models/profile.model';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent,
    Button,
  ],
  standalone: true,
})
export class EditProfileComponent {
  isSidebarExpanded = true;

  profileData: ProfileData = {
    name: 'Coach Johnson',
    email: 'coach.johnson@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Head Coach',
    team: 'U18 Basketball Team',
    location: 'Los Angeles, CA',
    bio: 'Experienced basketball coach with 10+ years in youth development. Passionate about building strong teams and developing individual skills.',
  };

  get initials(): string {
    return this.profileData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  constructor(private router: Router) {}

  onExpandedChange(expanded: boolean): void {
    this.isSidebarExpanded = expanded;
  }

  onBack(): void {
    this.router.navigate(['/']);
  }

  onSubmit(): void {
    alert('Profile updated successfully!');
    this.router.navigate(['/']);
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  onChangePassword(): void {
    console.log('Change password clicked');
    // TODO: Navigate to change password page
  }

  onNotificationPreferences(): void {
    console.log('Notification preferences clicked');
    // TODO: Navigate to notification preferences
  }

  onDeleteAccount(): void {
    console.log('Delete account clicked');
    // TODO: Implement delete account with confirmation
  }
}

