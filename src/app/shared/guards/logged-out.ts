import { inject } from '@angular/core';
import { Router } from '@angular/router';

export async function loggedOut(): Promise<boolean> {
  if (!localStorage.getItem('access_token')) return true;
  await inject(Router).navigateByUrl('/shows/progress');
  return false;
}
