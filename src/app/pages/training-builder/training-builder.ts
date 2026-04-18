import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { ProgressTrackerComponent } from '../../components/progress-tracker/progress-tracker';
import { DrillCardComponent } from '../../components/drill-card/drill-card';
import { DrillLibrarySidebarComponent } from '../../components/drill-library-sidebar/drill-library-sidebar';
import { Drill } from '../../models/drill.model';
import { Button } from '../../components/button/button';


@Component({
  selector: 'training-builder',
  standalone: true,
  templateUrl: './training-builder.html',
  styleUrl: './training-builder.css',
  imports: [
    CommonModule,
    DragDropModule,
    MatSidenavModule,
    SidebarComponent,
    HeaderComponent,
    ProgressTrackerComponent,
    DrillCardComponent,
    DrillLibrarySidebarComponent,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingBuilderComponent {
  isSidebarExpanded: boolean = false;

  drills: Drill[] = [
    {
      id: '1',
      title: 'Layup Drills',
      level: 'Beginner',
      duration: 20,
      description: 'Practice basic layup techniques from various angles',
      equipment: ['Basketball', 'Cones'],
    },
    {
      id: '2',
      title: 'Three-Point Shooting',
      level: 'Intermediate',
      duration: 25,
      description: 'Advanced perimeter shooting drill focusing on consistency',
      equipment: ['Basketball', 'Rack'],
    },
    {
      id: '3',
      title: 'Defensive Slides',
      level: 'Beginner',
      duration: 15,
      description: 'Lateral movement and defensive stance improvement',
      equipment: ['Cones'],
    },
    {
      id: '4',
      title: 'Pick and Roll',
      level: 'Advanced',
      duration: 15,
      description: 'Offensive execution of pick and roll plays',
      equipment: ['Basketball', 'Cones'],
    },
  ];

  totalDuration: number = 0;
  goal: number = 90;

  constructor() {
    this.calculateTotalDuration();
  }

  get isMaxDuration(): boolean {
    return this.totalDuration >= this.goal;
  }

  onExpandedChange(expanded: boolean): void {
    this.isSidebarExpanded = expanded;
  }

  drop(event: CdkDragDrop<Drill[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  onDrillAdd(drill: Drill): void {
    if (this.isMaxDuration) return;
    // Create a new drill with a unique ID
    const newDrill: Drill = {
      ...drill,
      id: Date.now().toString(),
    };
    this.drills.push(newDrill);
    this.calculateTotalDuration();
  }

  onDeleteDrill(drillId: string): void {
    this.drills = this.drills.filter((drill) => drill.id !== drillId);
    this.calculateTotalDuration();
  }

  onDurationChanged(event: { drillId: string; duration: number }): void {
    const drill = this.drills.find((d) => d.id === event.drillId);
    if (drill) {
      drill.duration = event.duration;
      this.calculateTotalDuration();
    }
  }

  private calculateTotalDuration(): void {
    this.totalDuration = this.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0);
  }
}
