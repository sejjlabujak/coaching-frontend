import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Injury } from '../../models/player.model';
import { Button } from '../button/button';

@Component({
  selector: 'app-injuries-section',
  template: `
    <div class="injuries-container">
      <div class="injuries-header">
        <h4>Injuries History</h4>
        <button-2 type="regular" (click)="onAddNew()" class="add-btn">
          <mat-icon>add</mat-icon>
        </button-2>
      </div>

      <div class="injuries-list">
        <div *ngFor="let injury of injuries" class="injury-item">
          <ng-container *ngIf="editingInjuryId !== injury.id; else editMode">
            <div class="injury-view">
              <div class="injury-status" [class]="'status-' + injury.status.toLowerCase()">
                {{ injury.status }}
              </div>
              <div class="injury-info">
                <strong>{{ injury.name }}</strong> ({{ injury.date }})
                <div *ngIf="injury.recovery" class="recovery-info">
                  Estimated recovery: {{ injury.recovery }}
                </div>
              </div>
              <div class="injury-actions">
                <button (click)="onEdit(injury.id)" class="icon-btn" title="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button (click)="onDelete(injury.id)" class="icon-btn" title="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #editMode>
            <div class="injury-edit">
              <select [(ngModel)]="injury.status" class="edit-field">
                <option value="OUT">OUT</option>
                <option value="HEALED">HEALED</option>
              </select>
              <input
                [(ngModel)]="injury.name"
                placeholder="Injury name"
                class="edit-field"
              />
              <input
                [(ngModel)]="injury.date"
                placeholder="Date (e.g., Dec 2025)"
                class="edit-field"
              />
              <input
                *ngIf="injury.status === 'OUT'"
                [(ngModel)]="injury.recovery"
                placeholder="Recovery time"
                class="edit-field"
              />
              <button-2 type="regular" (click)="onDoneEditing()" class="full-width">
                Done
              </button-2>
            </div>
          </ng-template>
        </div>

        <ng-container *ngIf="isAddingNew">
          <div class="injury-edit new-injury">
            <select [(ngModel)]="newInjury.status" class="edit-field">
              <option value="OUT">OUT</option>
              <option value="HEALED">HEALED</option>
            </select>
            <input
              [(ngModel)]="newInjury.name"
              placeholder="Injury name"
              class="edit-field"
            />
            <input
              [(ngModel)]="newInjury.date"
              placeholder="Date (e.g., Dec 2025)"
              class="edit-field"
            />
            <input
              *ngIf="newInjury.status === 'OUT'"
              [(ngModel)]="newInjury.recovery"
              placeholder="Recovery time"
              class="edit-field"
            />
            <div class="button-group">
              <button-2 type="regular" (click)="onAddInjury()" class="flex-1">
                Add
              </button-2>
              <button-2 type="cancel" (click)="onCancelAdd()" class="flex-1">
                Cancel
              </button-2>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styleUrl: './injuries-section.css',
  imports: [CommonModule, FormsModule, MatIconModule, Button],
  standalone: true,
})
export class InjuriesSectionComponent {
  @Input() injuries: Injury[] = [];
  @Output() injuriesChange = new EventEmitter<Injury[]>();

  editingInjuryId: string | null = null;
  isAddingNew = false;
  newInjury = { status: 'OUT' as 'OUT' | 'HEALED', name: '', date: '', recovery: '' };

  onAddNew(): void {
    this.isAddingNew = true;
  }

  onEdit(injuryId: string): void {
    this.editingInjuryId = injuryId;
  }

  onDoneEditing(): void {
    this.editingInjuryId = null;
  }

  onDelete(injuryId: string): void {
    this.injuries = this.injuries.filter(i => i.id !== injuryId);
    this.injuriesChange.emit(this.injuries);
  }

  onAddInjury(): void {
    if (this.newInjury.name && this.newInjury.date) {
      const injury: Injury = {
        id: Date.now().toString(),
        ...this.newInjury,
      };
      this.injuries = [...this.injuries, injury];
      this.injuriesChange.emit(this.injuries);
      this.newInjury = { status: 'OUT', name: '', date: '', recovery: '' };
      this.isAddingNew = false;
    }
  }

  onCancelAdd(): void {
    this.newInjury = { status: 'OUT', name: '', date: '', recovery: '' };
    this.isAddingNew = false;
  }
}

