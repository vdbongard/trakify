import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { getErrorMessage, isErrorLike } from '@helper/error';

@Component({
  selector: 't-error-text',
  imports: [JsonPipe, MatButton],
  templateUrl: './error-text.component.html',
  styleUrl: './error-text.component.scss',
})
export class ErrorText {
  error = input.required<Error>();
  showRetry = input(false, { transform: booleanAttribute });
  retry = output<void>();

  displayMessage = computed(() => {
    const error = this.error();
    return isErrorLike(error) ? getErrorMessage(error) : undefined;
  });
}
