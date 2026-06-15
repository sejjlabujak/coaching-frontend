import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
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
import { SearchInputComponent } from '../../components/search/search-input.component';
import { Button } from '../../components/button/button';
import { DrillLibraryService } from '../../services/drill-library.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { LibraryDrill } from '../../models/library-drill.model';
import { Drill } from '../../models/drill.model';
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
    SearchInputComponent,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillLibraryComponent implements OnInit {
  readonly sidebarState = inject(SidebarStateService);
  get isSidebarExpanded(): boolean { return this.sidebarState.isExpanded; }
  editingDrillId: string | null = null;
  pendingDeleteId: string | null = null;
  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  readonly dialog = inject(MatDialog);
  readonly libraryService = inject(DrillLibraryService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.libraryService.loadDrills();
  }

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

  onExpandedChange(expanded: boolean): void {
    this.sidebarState.isExpanded = expanded;
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

  onDeleteDrill(drillId: string): void {
    this.pendingDeleteId = drillId;
    this.cdr.markForCheck();
  }

  onDeleteConfirm(): void {
    if (!this.pendingDeleteId) return;
    const id = this.pendingDeleteId;
    this.pendingDeleteId = null;
    this.libraryService.deleteDrill(id);
    if (this.editingDrillId === id) this.editingDrillId = null;
    this.clampPageIndex();
    this.cdr.markForCheck();
  }

  onDeleteCancel(): void {
    this.pendingDeleteId = null;
    this.cdr.markForCheck();
  }

  onDurationChanged(event: { drillId: string; duration: number }): void {}

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
    const ref = this.dialog.open(OcrUploadDialog, {
      maxWidth: '98vw',
      maxHeight: '95vh',
      panelClass: 'pdf-import-panel',
    });
    // Reload drills from backend after OCR import
    ref.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.libraryService.loadDrills();
        this.cdr.markForCheck();
      }
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
