import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'button-2',
  templateUrl: 'button.html',
  styleUrl: 'button.css',
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
})
export class Button {

}
