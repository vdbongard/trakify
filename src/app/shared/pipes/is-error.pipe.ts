import { Pipe, PipeTransform } from '@angular/core';
import { LoadingState } from '@type/enum';

@Pipe({
  name: 'isError',
})
export class IsErrorPipe implements PipeTransform {
  transform(loadingState: LoadingState | null): boolean {
    return loadingState === LoadingState.ERROR;
  }
}
