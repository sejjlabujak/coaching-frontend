import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../button/button';
import { PlayerService } from '../../services/player.service';

interface InjuryRow {
  id: number;
  status: 'OUT' | 'HEALED';
  name: string;
  date: string;
  recovery: string;
}

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

      <div *ngIf="isLoading" class="loading-hint">Loading...</div>

      <div class="injuries-list">
        <div *ngFor="let injury of injuries" class="injury-item">
          <ng-container *ngIf="editingId !== injury.id; else editMode">
            <div class="injury-view">
              <div class="injury-status" [class]="'status-' + injury.status.toLowerCase()">
                {{ injury.status }}
              </div>
              <div class="injury-info">
                <strong>{{ injury.name }}</strong> ({{ injury.date }})
                <div *ngIf="injury.recovery" class="recovery-info">
                  Est. recovery: {{ injury.recovery }} {{ +injury.recovery === 1 ? 'month' : 'months' }}
                </div>
              </div>
              <div class="injury-actions">
                <button (click)="onEdit(injury)" class="icon-btn" title="Edit">
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
              <select [(ngModel)]="editDraft.status" class="edit-field">
                <option value="OUT">OUT</option>
                <option value="HEALED">HEALED</option>
              </select>
              <input [(ngModel)]="editDraft.name" placeholder="Injury name" class="edit-field" />
              <input [(ngModel)]="editDraft.date" placeholder="MM/YYYY" maxlength="7" class="edit-field" />
              <div *ngIf="editDraft.status === 'OUT'" class="recovery-input-group">
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="editDraft.recovery"
                  placeholder="Recovery (months)"
                  class="edit-field"
                />
              </div>
              <button-2 type="regular" (click)="onDoneEditing(injury.id)" class="full-width">
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
            <input [(ngModel)]="newInjury.name" placeholder="Injury type" class="edit-field" />
            <input [(ngModel)]="newInjury.date" placeholder="MM/YYYY" maxlength="7" class="edit-field" />
            <div *ngIf="newInjury.status === 'OUT'" class="recovery-input-group">
              <input
                type="number"
                min="1"
                [(ngModel)]="newInjury.recovery"
                placeholder="Recovery (months)"
                class="edit-field"
              />
            </div>
            <div class="button-group">
              <button-2 type="regular" (click)="onAddInjury()" class="flex-1">Add</button-2>
              <button-2 type="cancel" (click)="onCancelAdd()" class="flex-1">Cancel</button-2>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styleUrl: './injuries-section.css',
  imports: [CommonModule, FormsModule, MatIconModule, Button],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InjuriesSectionComponent implements OnChanges {
  @Input() playerId: number | null = null;
  /** Emits true when player has at least one active injury, false otherwise */
  @Output() hasActiveInjuryChange = new EventEmitter<boolean>();

  private readonly playerService = inject(PlayerService);
  private readonly cdr = inject(ChangeDetectorRef);

  injuries: InjuryRow[] = [];
  isLoading = false;
  editingId: number | null = null;
  editDraft: InjuryRow = this.emptyDraft();
  isAddingNew = false;
  newInjury = { status: 'OUT' as 'OUT' | 'HEALED', name: '', date: '', recovery: '' };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerId'] && this.playerId != null) {
      this.load();
    }
  }

  private load(): void {
    this.isLoading = true;
    this.injuries = [];
    this.playerService.getInjuries(this.playerId!).subscribe({
      next: (list) => {
        this.injuries = list.map(this.toRow);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private toRow(i: { id: number; description: string; startDate: string; endDate: string | null; isActive?: boolean; active?: boolean }): InjuryRow {
    const active = i.isActive ?? i.active ?? true;
    return {
      id: i.id,
      status: active ? 'OUT' : 'HEALED',
      name: i.description,
      date: i.startDate,
      recovery: i.endDate ?? '',
    };
  }

  private emitStatus(): void {
    this.hasActiveInjuryChange.emit(this.injuries.some(i => i.status === 'OUT'));
  }

  onAddNew(): void { this.isAddingNew = true; }
  onCancelAdd(): void {
    this.newInjury = { status: 'OUT', name: '', date: '', recovery: '' };
    this.isAddingNew = false;
  }

  onAddInjury(): void {
    if (!this.newInjury.name || !this.newInjury.date || this.playerId == null) return;
    const dto = {
      description: this.newInjury.name,
      startDate: this.newInjury.date,
      endDate: this.newInjury.status === 'HEALED' ? (this.newInjury.recovery || null) : null,
      isActive: this.newInjury.status === 'OUT',
    };
    this.playerService.createInjury(this.playerId, dto).subscribe({
      next: (created) => {
        this.injuries = [...this.injuries, this.toRow(created)];
        this.newInjury = { status: 'OUT', name: '', date: '', recovery: '' };
        this.isAddingNew = false;
        this.emitStatus();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to add injury', err),
    });
  }

  onEdit(injury: InjuryRow): void {
    this.editingId = injury.id;
    this.editDraft = { ...injury };
  }

  onDoneEditing(injuryId: number): void {
    const dto = {
      description: this.editDraft.name,
      startDate: this.editDraft.date,
      endDate: this.editDraft.status === 'HEALED' ? (this.editDraft.recovery || null) : null,
      isActive: this.editDraft.status === 'OUT',
    };
    this.playerService.updateInjury(injuryId, dto).subscribe({
      next: (updated) => {
        this.injuries = this.injuries.map(i => i.id === injuryId ? this.toRow(updated) : i);
        this.editingId = null;
        this.emitStatus();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to update injury', err),
    });
  }

  onDelete(injuryId: number): void {
    this.playerService.deleteInjury(injuryId).subscribe({
      next: () => {
        this.injuries = this.injuries.filter(i => i.id !== injuryId);
        this.emitStatus();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to delete injury', err),
    });
  }

  private emptyDraft(): InjuryRow {
    return { id: 0, status: 'OUT', name: '', date: '', recovery: '' };
  }
}
