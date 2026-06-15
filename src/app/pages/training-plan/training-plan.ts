import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { CalendarComponent } from '../../components/calendar/calendar';
import { HeaderComponent } from '../../components/header/header';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'training-plan',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    CalendarComponent,
    HeaderComponent,
    MatSidenavModule,
  ],
  templateUrl: './training-plan.html',
  styleUrl: './training-plan.css',
})
export class TrainingPlan {
  readonly sidebarState = inject(SidebarStateService);
  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }

  onExpandedChange(expanded: boolean) {
    this.sidebarState.isExpanded = expanded;
  }
}
