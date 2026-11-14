import type { QueryErrorNoticeService } from '@services/query-error-notice.service';

/**
 * Reports the first failed refresh of content that is already on screen, in a notice that does not
 * take space in the page.
 *
 * The page passes `null` for a query that has nothing on screen: those keep the inline error,
 * because there is no content below for it to push down.
 */
export function noticeRefreshErrors(
  notice: QueryErrorNoticeService,
  errors: readonly unknown[],
  retry: () => void,
): void {
  const error = errors.find((candidate) => candidate);
  if (error) notice.show(error, retry);
}
