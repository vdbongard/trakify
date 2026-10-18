import { inject, Injectable } from '@angular/core';
import type { ViewTransitionInfo } from '@angular/router';

/**
 * The view transition the router ran last.
 *
 * Artwork named for a morph has to carry its name while the browser captures the views of the
 * navigation that morphs it, and be rid of it again before the next navigation captures them: a
 * name left on an element is carried into every later transition, where the browser then animates
 * that artwork over the page arriving. A view that names artwork up front, before the navigation it
 * morphs out of — the Show page coming back from an Episode — has no other way of knowing when that
 * morph is over: the router runs the transition, and only it is handed the handle to it.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewTransitionService {
  private transition?: ViewTransition;

  /** Records the transition the router started for the navigation in flight. */
  track(transition: ViewTransition): void {
    this.transition = transition;
  }

  /**
   * Resolves once that transition has finished, or straight away when the router ran none: a
   * browser without the API, or a navigation without a transition, has no morph to name for either.
   */
  async whenFinished(): Promise<void> {
    await this.transition?.finished.catch(() => undefined);
  }
}

/**
 * Router option handing every transition the router starts to {@link ViewTransitionService}. Runs in
 * an injection context of the router — the only place both the transition and a service are in hand.
 */
export function trackViewTransitions({ transition }: ViewTransitionInfo): void {
  inject(ViewTransitionService).track(transition);
}
