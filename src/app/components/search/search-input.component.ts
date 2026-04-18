import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {}

