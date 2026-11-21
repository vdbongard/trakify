import type { Page } from '@playwright/test';

export const STILL_TRANSITION_NAME = 'episode-still';

interface RecordedNames {
  old: string[][];
  new: string[][];
}

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

export async function stretchStillTransition(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      ::view-transition-group(root),
      ::view-transition-group(${STILL_TRANSITION_NAME}),
      ::view-transition-old(${STILL_TRANSITION_NAME}),
      ::view-transition-new(${STILL_TRANSITION_NAME}) { animation-duration: 5s !important; }
    `,
  });
}

export function recordedNames(page: Page): Promise<RecordedNames> {
  return page.evaluate(() => {
    const recorded = (window as unknown as { recorded: RecordedNames }).recorded;
    return {
      old: recorded.old.filter((names) => names.length > 0),
      new: recorded.new.filter((names) => names.length > 0),
    };
  });
}
