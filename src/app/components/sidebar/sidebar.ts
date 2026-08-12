import { Component, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const COACH_MENU: MenuItem[] = [
  { icon: 'dashboard',         label: 'Dashboard', route: '/dashboard' },
  { icon: 'groups',            label: 'Roster',    route: '/roster' },
  { icon: 'fitness_center',    label: 'Drills',    route: '/drills' },
  { icon: 'sports_basketball', label: 'Playbook',  route: '/playbook' },
  { icon: 'calendar_month',    label: 'Planner',   route: '/planner' },
];

const ADMIN_MENU: MenuItem[] = [
  { icon: 'manage_accounts', label: 'Coaches', route: '/admin' },
];

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private readonly sidebarState = inject(SidebarStateService);
  private readonly auth = inject(AuthService);

  get isExpanded(): boolean {
    return this.sidebarState.isExpanded;
  }

  readonly menuItems = computed<MenuItem[]>(() =>
    this.auth.isAdmin() ? ADMIN_MENU : COACH_MENU
  );

  @Output() expandedChange = new EventEmitter<boolean>();

  toggleSidebar() {
    this.sidebarState.isExpanded = !this.sidebarState.isExpanded;
    this.expandedChange.emit(this.sidebarState.isExpanded);
  }
}
