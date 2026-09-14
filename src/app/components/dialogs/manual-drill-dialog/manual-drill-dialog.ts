import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DrillEditFormComponent } from '../../drill-form/drill-form';
import { DrillLibraryService } from '../../../services/drill-library.service';
import { LibraryDrill } from '../../../models/library-drill.model';

@Component({ selector: 'app-manual-drill-dialog', standalone: true, imports: [CommonModule, MatDialogModule, DrillEditFormComponent], templateUrl: './manual-drill-dialog.html', styleUrl: './manual-drill-dialog.css' })
export class ManualDrillDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ManualDrillDialogComponent>); private readonly library = inject(DrillLibraryService); saving = false;
  readonly draft: LibraryDrill = { id: '', title: '', description: '', focus: 'Offense', intensity: 'MEDIUM', equipment: [], level: 'Beginner' };
  save(drill: LibraryDrill) { if (!drill.title.trim() || this.saving) return; this.saving = true; const { id, ...payload } = drill; this.library.createDrill(payload).subscribe({ next: () => this.dialogRef.close({ saved: true }), error: () => this.saving = false }); }
}
