import { Pipe, PipeTransform } from '@angular/core';
import { LoadingState } from '@type/Enum';

@Pipe({
  name: 'isError',
  standalone: true,
})
export class IsErrorPipe implements PipeTransform {
  transform(loadingState: LoadingState | null): boolean {
    return loadingState === LoadingState.ERROR;
  }
}
