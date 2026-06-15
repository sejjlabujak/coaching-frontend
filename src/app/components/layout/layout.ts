import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-shell',
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  standalone: true,
  imports: [MatSidenavModule, HeaderComponent, SidebarComponent],
})
export class LayoutComponent {
  readonly sidebarState = inject(SidebarStateService);

  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }

  onExpandedChange(expanded: boolean): void {
    this.sidebarState.isExpanded = expanded;
  }
}
