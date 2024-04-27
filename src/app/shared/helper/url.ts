import type { Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, type Router } from '@angular/router';
import { filter, map } from 'rxjs';

export function getUrl(router: Router): Signal<string> {
  return toSignal(
    router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      takeUntilDestroyed(),
    ),
    { initialValue: '' },
  );
}
