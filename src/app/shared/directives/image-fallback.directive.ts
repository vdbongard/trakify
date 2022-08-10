import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { LoadingState } from '../../../types/enum';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appImageFallback]',
})
export class ImageFallbackDirective implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  @Input() appImageFallback?: string;

  state = new BehaviorSubject<LoadingState>(LoadingState.LOADING);

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    this.state?.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      if (state === LoadingState.ERROR && this.appImageFallback) {
        this.el.nativeElement.src = this.appImageFallback;
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
