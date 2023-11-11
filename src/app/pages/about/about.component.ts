import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-about',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export default class AboutComponent {}
