import { QueryParamsHandling } from '@angular/router';

export interface Link {
  name: string;
  url: string;
  icon?: string;
  queryParamsHandling?: QueryParamsHandling;
}
