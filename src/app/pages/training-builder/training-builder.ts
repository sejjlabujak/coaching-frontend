import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { ProgressTrackerComponent } from '../../components/progress-tracker/progress-tracker';
import { DrillCardComponent } from '../../components/drill-card/drill-card';
import { DrillLibrarySidebarComponent } from '../../components/drill-library-sidebar/drill-library-sidebar';
import { Button } from '../../components/button/button';
import { Drill } from '../../models/drill.model';
import { TrainingEvent } from '../../models/training-event.model';
import { BuilderStateService } from '../../services/builder-state.service';
import { TrainingService } from '../../services/training.service';

@Component({
  selector: 'training-builder',
  standalone: true,
  templateUrl: './training-builder.html',
  styleUrl: './training-builder.css',
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    SidebarComponent,
    HeaderComponent,
    ProgressTrackerComponent,
    DrillCardComponent,
    DrillLibrarySidebarComponent,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingBuilderComponent implements OnInit {
  isSidebarExpanded = false;
  totalDuration = 0;
  goal = 90;
  sessionTitle = '';
  showDatePicker = false;
  manualDate: string = '';

  drills: Drill[] = [];

  private readonly builderState = inject(BuilderStateService);
  private readonly trainingService = inject(TrainingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  get isMaxDuration(): boolean {
    return this.totalDuration >= this.goal;
  }

  get targetDate(): Date | null {
    return this.builderState.targetDate();
  }

  ngOnInit(): void {
    const existing = this.builderState.existingEvent();
    if (existing) {
      // Pre-fill from existing event
      this.sessionTitle = existing.title;
      this.drills = (existing.drills ?? []).map((d, i) => ({
        id: String(i + 1),
        title: d.name,
        duration: Math.floor((existing.duration ?? 60) / (existing.drills?.length ?? 1)),
        level: 'Beginner' as const,
      }));
    } else {
      // Default drills for new session
      this.drills = [
        {
          id: '1',
          title: 'Layup Drills',
          level: 'Beginner',
          duration: 20,
          description: 'Practice basic layup techniques',
          equipment: ['Basketball', 'Cones'],
        },
        {
          id: '2',
          title: 'Three-Point Shooting',
          level: 'Intermediate',
          duration: 25,
          description: 'Advanced perimeter shooting drill',
          equipment: ['Basketball', 'Rack'],
        },
        {
          id: '3',
          title: 'Defensive Slides',
          level: 'Beginner',
          duration: 15,
          description: 'Lateral movement improvement',
          equipment: ['Cones'],
        },
        {
          id: '4',
          title: 'Pick and Roll',
          level: 'Advanced',
          duration: 15,
          description: 'Offensive pick and roll execution',
          equipment: ['Basketball', 'Cones'],
        },
      ];
    }
    this.calculateTotalDuration();
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
    this.drills.push({ ...drill, id: Date.now().toString() });
    this.calculateTotalDuration();
  }

  onDeleteDrill(drillId: string): void {
    this.drills = this.drills.filter((d) => d.id !== drillId);
    this.calculateTotalDuration();
  }

  onDurationChanged(event: { drillId: string; duration: number }): void {
    const drill = this.drills.find((d) => d.id === event.drillId);
    if (drill) {
      drill.duration = event.duration;
      this.calculateTotalDuration();
    }
  }

  saveToCalendar(): void {
    const date = this.builderState.targetDate();

    if (!date) {
      // No date — show inline date picker instead of error
      this.showDatePicker = true;
      this.cdr.markForCheck();
      return;
    }

    this.persistSession(date);
  }

  onManualDateConfirm(): void {
    if (!this.manualDate) return;
    const date = new Date(this.manualDate + 'T00:00:00');
    this.builderState.setDate(date);
    this.showDatePicker = false;
    this.persistSession(date);
  }

  onManualDateCancel(): void {
    this.showDatePicker = false;
    this.cdr.markForCheck();
  }

  private persistSession(date: Date): void {
    const title = this.sessionTitle.trim() || 'Custom Training';
    const existing = this.builderState.existingEvent();

    const newEvent: TrainingEvent = {
      id: existing ? existing.id : this.trainingService.getNextId(),
      date,
      title,
      color: 'red',
      duration: this.totalDuration,
      intensity: 'MEDIUM',
      focus: 'Custom session',
      ageGroup: 'U18',
      drills: this.drills.map((d, i) => ({ id: i + 1, name: d.title })),
    };

    if (existing) {
      this.trainingService.updateEvent(newEvent);
    } else {
      this.trainingService.addEvent(newEvent);
    }

    this.builderState.clear();
    this.snackBar.open(`"${title}" saved to calendar!`, 'Close', { duration: 3000 });
    this.router.navigate(['/planner']);
  }

  private calculateTotalDuration(): void {
    this.totalDuration = this.drills.reduce((sum, d) => sum + (d.duration || 0), 0);
  }
}
