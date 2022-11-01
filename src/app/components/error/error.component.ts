import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 't-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent {}
