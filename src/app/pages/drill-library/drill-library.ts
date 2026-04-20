import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { DrillCardComponent } from '../../components/drill-card/drill-card';
import { DrillEditFormComponent } from '../../components/drill-form/drill-form';
import { PaginatorComponent } from '../../components/paginator/paginator';
import { Button } from '../../components/button/button';
import { DrillLibraryService } from '../../services/drill-library-service';
import { LibraryDrill } from '../../models/library-drill-model';
import { Drill } from '../../models/drill-model';
import { MatDialog } from '@angular/material/dialog';
import { OcrUploadDialog } from '../../components/dialogs/ocr-upload-dialog/ocr-upload-dialog';

@Component({
  selector: 'app-drill-library',
  standalone: true,
  templateUrl: './drill-library.html',
  styleUrl: './drill-library.css',
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatIconModule,
    SidebarComponent,
    HeaderComponent,
    DrillCardComponent,
    DrillEditFormComponent,
    PaginatorComponent,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillLibraryComponent {
  isSidebarExpanded = true;
  editingDrillId: string | null = null;
  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];
  readonly dialog = inject(MatDialog);

  readonly libraryService = inject(DrillLibraryService);

  get filteredDrills(): LibraryDrill[] {
    return this.libraryService.filteredDrills();
  }

  get pagedDrills(): LibraryDrill[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredDrills.slice(start, start + this.pageSize);
  }

  get totalDrills(): number {
    return this.filteredDrills.length;
  }

  get filters() {
    return this.libraryService.filters();
  }

  get focusOptions() {
    return this.libraryService.focusOptions;
  }
  get intensityOptions() {
    return this.libraryService.intensityOptions;
  }
  get ageGroupOptions() {
    return this.libraryService.ageGroupOptions;
  }

  onExpandedChange(expanded: boolean): void {
    this.isSidebarExpanded = expanded;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private resetPageIndex(): void {
    this.pageIndex = 0;
  }

  private clampPageIndex(): void {
    const lastPageIndex = Math.max(Math.ceil(this.totalDrills / this.pageSize) - 1, 0);
    this.pageIndex = Math.min(this.pageIndex, lastPageIndex);
  }

  onSearchChange(value: string): void {
    this.libraryService.updateFilter('search', value);
    this.resetPageIndex();
  }

  onFocusChange(value: string): void {
    this.libraryService.updateFilter('focus', value as any);
    this.resetPageIndex();
  }

  onIntensityChange(value: string): void {
    this.libraryService.updateFilter('intensity', value as any);
    this.resetPageIndex();
  }

  onAgeGroupChange(value: string): void {
    this.libraryService.updateFilter('ageGroup', value as any);
    this.resetPageIndex();
  }

  onDeleteDrill(drillId: string): void {
    this.libraryService.deleteDrill(drillId);
    if (this.editingDrillId === drillId) {
      this.editingDrillId = null;
    }
    this.clampPageIndex();
  }

  onDurationChanged(event: { drillId: string; duration: number }): void {
    // handled in-place by drill-card
  }

  // Called from drill-card's editDrill output — toggles the inline form
  onEditDrill(drillId: string): void {
    this.editingDrillId = this.editingDrillId === drillId ? null : drillId;
  }

  onSaveEdit(updated: LibraryDrill): void {
    this.libraryService.updateDrill(updated);
    this.editingDrillId = null;
  }

  onCancelEdit(): void {
    this.editingDrillId = null;
  }

  onImportFromPdf(): void {
    this.dialog.open(OcrUploadDialog, {
      maxWidth: '98vw',
      maxHeight: '95vh',
      panelClass: 'pdf-import-panel',
    });
  }

  toDrill(ld: LibraryDrill): Drill {
    return {
      id: ld.id,
      title: ld.title,
      description: ld.description,
      tag: ld.tag,
      equipment: ld.equipment,
      duration: ld.duration,
      level: ld.level,
    };
  }
}
