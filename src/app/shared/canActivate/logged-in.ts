import { inject } from '@angular/core';
import { Router } from '@angular/router';
import * as Paths from '@shared/paths';

export async function loggedIn(): Promise<boolean> {
  if (localStorage.getItem('access_token')) return true;
  await inject(Router).navigateByUrl(Paths.login({}));
  return false;
}
