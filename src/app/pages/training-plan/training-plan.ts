import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { CalendarComponent } from '../../components/calendar/calendar';
import { HeaderComponent } from '../../components/header/header'; // UVOZIŠ HEADER
import { MatSidenavModule } from '@angular/material/sidenav';
import { ModalComponent} from "../../components/modal/modal";
@Component({
  selector: 'training-plan',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    CalendarComponent,
    HeaderComponent,
    MatSidenavModule,
    ModalComponent,
  ],
  templateUrl: './training-plan.html',
  styleUrl: './training-plan.css',
})
export class TrainingPlan {
  isSidebarExpanded = true;

  onExpandedChange(expanded: boolean) {
    this.isSidebarExpanded = expanded;
  }
}
