import type { Page } from '@playwright/test';

/** The name the Episode still carries in a view transition, on both sides of a navigation to the
 *  Episode page. Must match `EPISODE_STILL_TRANSITION_NAME`. */
export const STILL_TRANSITION_NAME = 'episode-still';

/** The view transition names captured on each side of a transition. */
interface RecordedNames {
  old: string[][];
  new: string[][];
}

/**
 * Records the view transition names of every transition the router starts: the old view's before
 * the update, the new view's after it — still before the browser takes its snapshot of the new view,
 * which is the moment a name has to be on the element.
 */
export async function recordTransitionNames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const names = (): string[] =>
      Array.from(document.querySelectorAll('*'))
        .map((element) => (element as HTMLElement).style.getPropertyValue('view-transition-name'))
        .filter((name) => name !== '');

    const recorded: { old: string[][]; new: string[][] } = { old: [], new: [] };
    (window as unknown as { recorded: typeof recorded }).recorded = recorded;

    const documentWithTransitions = document as unknown as {
      startViewTransition: (callback: () => void | Promise<void>) => unknown;
    };
    const startViewTransition = documentWithTransitions.startViewTransition.bind(document);
    documentWithTransitions.startViewTransition = (callback): unknown => {
      recorded.old.push(names());
      return startViewTransition(async () => {
        await callback();
        recorded.new.push(names());
      });
    };
  });
}

/** The names recorded by {@link recordTransitionNames}, without the empty captures. */
export function recordedNames(page: Page): Promise<RecordedNames> {
  return page.evaluate(() => {
    const recorded = (window as unknown as { recorded: RecordedNames }).recorded;
    return {
      old: recorded.old.filter((names) => names.length > 0),
      new: recorded.new.filter((names) => names.length > 0),
    };
  });
}
