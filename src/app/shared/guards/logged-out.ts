import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import * as Paths from '@shared/paths';
import { isPlatformBrowser } from '@angular/common';

export async function loggedOut(): Promise<boolean> {
  if (isPlatformBrowser(inject(PLATFORM_ID)) && !localStorage.getItem('access_token')) return true;
  await inject(Router).navigateByUrl(Paths.showsProgress({}));
  return false;
}
