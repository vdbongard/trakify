import { Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 't-error-text',
  imports: [JsonPipe],
  templateUrl: './error-text.component.html',
  styleUrl: './error-text.component.scss',
})
export class ErrorText {
  error = input.required<Error>();
}
