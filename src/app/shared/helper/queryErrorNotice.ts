import type { QueryErrorNoticeService } from '@services/query-error-notice.service';

export function noticeRefreshErrors(
  notice: QueryErrorNoticeService,
  errors: readonly unknown[],
  retry: () => void,
): void {
  const error = errors.find((candidate) => candidate);
  if (error) notice.show(error, retry);
}
