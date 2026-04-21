

import { Input, Output, EventEmitter, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Drill } from '../../models/drill.model';

@Component({
  selector: 'drill-card',
  standalone: true,
  templateUrl: 'drill-card.html',
  styleUrl: 'drill-card.css',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillCardComponent {
  @Input() drill!: Drill;
  @Input() isSidebarMode: boolean = false;
  @Input() isDragging: boolean = false;
  @Input() isMaxDuration: boolean = false;
  @Input() showEditButton: boolean = true; // ← Hide edit in training builder
  @Input() isSessionMode: boolean = false; // ← If true, delete removes from session, not from DB

  @Output() addDrill = new EventEmitter<Drill>();
  @Output() deleteDrill = new EventEmitter<string>();
  @Output() editDrill = new EventEmitter<string>();
  @Output() durationChanged = new EventEmitter<{ drillId: string; duration: number }>();

  isExpanded = false;

  onAddClick(): void {
    if (this.isMaxDuration) return;
    this.addDrill.emit(this.drill);
  }

  onDeleteClick(): void {
    if (this.drill.id) {
      this.deleteDrill.emit(this.drill.id);
    }
  }

  onEditClick(): void {
    if (this.drill.id) {
      this.editDrill.emit(this.drill.id);
    }
  }

  onToggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  onDurationChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const duration = parseInt(input.value, 10);
    if (!isNaN(duration) && duration >= 0 && this.drill.id) {
      this.drill.duration = duration;
      this.durationChanged.emit({ drillId: this.drill.id, duration });
    }
  }
}
