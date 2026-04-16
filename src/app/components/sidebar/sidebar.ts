import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Obavezno za [class.is-collapsed]
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  isExpanded = true;

  @Output() expandedChange = new EventEmitter<boolean>();

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.expandedChange.emit(this.isExpanded);
  }

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fitness_center', label: 'Drills', route: '/drills' },
    { icon: 'calendar_month', label: 'Plan', route: '/calendar' },
    { icon: 'groups', label: 'Teams', route: '/teams' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];
}
