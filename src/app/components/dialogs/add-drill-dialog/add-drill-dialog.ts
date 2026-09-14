import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../../button/button';

@Component({ selector: 'app-add-drill-dialog', standalone: true, imports: [MatDialogModule, MatIconModule, Button], templateUrl: './add-drill-dialog.html', styleUrl: './add-drill-dialog.css' })
export class AddDrillDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AddDrillDialogComponent>);
}
