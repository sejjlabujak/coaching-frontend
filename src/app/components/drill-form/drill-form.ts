import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../button/button';
import { LibraryDrill } from '../../models/library-drill.model';
import { TrainingFocus, IntensityLevel, AgeSelection } from '../../models/training-event.model';

@Component({
  selector: 'drill-edit-form',
  standalone: true,
  templateUrl: './drill-form.html',
  styleUrl: './drill-form.css',
  imports: [CommonModule, FormsModule, MatIconModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillEditFormComponent implements OnInit {
  @Input() drill!: LibraryDrill;
  @Output() save = new EventEmitter<LibraryDrill>();
  @Output() cancel = new EventEmitter<void>();

  formData = signal<LibraryDrill>({} as LibraryDrill);

  focusOptions: TrainingFocus[] = [
    'Shooting',
    'Defense',
    'Offense',
    'Conditioning',
    'Recovery',
    'Rebounding',
    'Team Building',
  ];

  intensityOptions: IntensityLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

  ageGroupOptions: (AgeSelection | 'All ages')[] = [
    'All ages',
    'U10',
    'U12',
    'U14',
    'U16',
    'U18',
    'Senior',
  ];

  levelOptions: ('Beginner' | 'Intermediate' | 'Advanced')[] = [
    'Beginner',
    'Intermediate',
    'Advanced',
  ];

  ngOnInit(): void {
    // Deep copy so edits don't mutate the original until Save
    this.formData.set({ ...this.drill, equipment: [...(this.drill.equipment ?? [])] });
  }

  onFieldChange<K extends keyof LibraryDrill>(field: K, value: LibraryDrill[K]): void {
    this.formData.update((f) => ({ ...f, [field]: value }));
  }

  get equipmentString(): string {
    return (this.formData().equipment ?? []).join(', ');
  }

  onEquipmentChange(value: string): void {
    const equipment = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    this.formData.update((f) => ({ ...f, equipment }));
  }

  onSave(): void {
    this.save.emit(this.formData());
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
