import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({ template: '' })
export class BaseComponent implements OnDestroy {
  readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
