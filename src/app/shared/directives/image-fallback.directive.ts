import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { LoadingState } from '../../../types/enum';

@Directive({
  selector: '[tImageFallback]',
})
export class ImageFallbackDirective implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  @Input() tImageFallback?: string;

  state = new BehaviorSubject<LoadingState>(LoadingState.LOADING);

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    this.state?.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      if (state === LoadingState.ERROR && this.tImageFallback) {
        this.el.nativeElement.src = this.tImageFallback;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('load')
  onLoad(): void {
    this.state?.next(LoadingState.SUCCESS);
  }

  @HostListener('error')
  onError(): void {
    this.state?.next(LoadingState.ERROR);
  }
}
