import { Component, HostBinding, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'button-2',
  templateUrl: 'button.html',
  styleUrl: 'button.css',
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  standalone: true,
})
export class Button {
  @Input() disabled: boolean = false;
  @Input() type: 'regular' | 'cancel' = 'regular';
  @HostBinding('class') get hostClass() {
    return `type-${this.type}`;
  }
}
