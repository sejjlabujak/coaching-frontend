import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../../button/button';
import { BackendPlayer, PlayerRequestDTO, PlayerService } from '../../../services/player.service';

export interface PlayerFormDialogData {
  player?: BackendPlayer;
}

interface PlayerFormData {
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: number | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string;
  birthCity: string;
  nationality: string;
  ageGroup: string;
}

@Component({
  selector: 'app-player-form-dialog',
  standalone: true,
  templateUrl: './player-form-dialog.html',
  styleUrl: './player-form-dialog.css',
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerFormDialog {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly dialogRef = inject(MatDialogRef<PlayerFormDialog>);
  readonly data = inject<PlayerFormDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private readonly playerService = inject(PlayerService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isEditMode = !!this.data.player;

  positionOptions = [
    'Point Guard',
    'Shooting Guard',
    'Small Forward',
    'Power Forward',
    'Center',
  ];

  ageGroupOptions = ['U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];

  formData = signal<PlayerFormData>(this.buildInitialFormData());

  selectedFile: File | null = null;
  imagePreviewUrl = signal<string | null>(this.data.player?.images?.[0]?.url ?? null);
  isDragOver = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  private buildInitialFormData(): PlayerFormData {
    const p = this.data.player;
    return {
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      position: p?.position ?? this.positionOptionsDefault(),
      jerseyNumber: p?.jerseyNumber ?? null,
      heightCm: p?.heightCm ?? null,
      weightKg: p?.weightKg ?? null,
      birthDate: p?.birthDate ?? '',
      birthCity: p?.birthCity ?? '',
      nationality: p?.nationality ?? '',
      ageGroup: p?.ageGroup ?? 'Senior',
    };
  }

  private positionOptionsDefault(): string {
    return 'Point Guard';
  }

  onFieldChange<K extends keyof PlayerFormData>(field: K, value: PlayerFormData[K]): void {
    this.formData.update((f) => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.formData();
    return !!(f.firstName.trim() && f.lastName.trim() && f.ageGroup);
  }

  // Image handling
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onBrowseClick(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Invalid file type. Please upload an image.');
      return;
    }
    this.errorMessage.set(null);
    this.selectedFile = file;
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  onRemoveImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl.set(null);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.isFormValid() || this.isSaving()) return;

    const f = this.formData();
    const dto: PlayerRequestDTO = {
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      position: f.position || null,
      jerseyNumber: f.jerseyNumber,
      heightCm: f.heightCm,
      weightKg: f.weightKg,
      birthDate: f.birthDate || null,
      birthCity: f.birthCity || null,
      nationality: f.nationality || null,
      ageGroup: f.ageGroup,
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const save$ = this.isEditMode
      ? this.playerService.updatePlayer(this.data.player!.playerID, dto)
      : this.playerService.createPlayer(dto);

    save$.subscribe({
      next: (savedPlayer) => this.uploadImageIfNeeded(savedPlayer),
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set('Failed to save player: ' + err.message);
        this.cdr.markForCheck();
      },
    });
  }

  private uploadImageIfNeeded(player: BackendPlayer): void {
    if (!this.selectedFile) {
      this.isSaving.set(false);
      this.dialogRef.close({ saved: true, player });
      return;
    }

    this.playerService.uploadPlayerImage(player.playerID, this.selectedFile).subscribe({
      next: (updatedPlayer) => {
        this.isSaving.set(false);
        this.dialogRef.close({ saved: true, player: updatedPlayer });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set('Player saved, but image upload failed: ' + err.message);
        this.cdr.markForCheck();
      },
    });
  }
}
