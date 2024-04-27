import type { Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd, type Router } from '@angular/router';

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
