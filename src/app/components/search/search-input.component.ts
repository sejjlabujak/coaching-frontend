import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Search...';
  @Input() debounceMs: number = 300;
  @Input() initialValue: string = '';

  @Output() searchChange = new EventEmitter<string>();

  searchControl = new FormControl('');
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.initialValue) {
      this.searchControl.setValue(this.initialValue, { emitEvent: false });
    }

    this.searchControl.valueChanges
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchChange.emit(value ?? '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
