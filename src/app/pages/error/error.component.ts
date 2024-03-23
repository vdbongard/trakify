import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 't-error',
  standalone: true,
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorComponent {}
