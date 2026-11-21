import { inject, Injectable } from '@angular/core';
import type { ViewTransitionInfo } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ViewTransitionService {
  private transition?: ViewTransition;

  track(transition: ViewTransition): void {
    this.transition = transition;
  }

  async whenFinished(): Promise<void> {
    await this.transition?.finished.catch(() => undefined);
  }
}

export function trackViewTransitions({ transition }: ViewTransitionInfo): void {
  inject(ViewTransitionService).track(transition);
}
