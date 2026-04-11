import { inject } from '@angular/core';
import { Router } from '@angular/router';

export async function loggedIn(): Promise<boolean> {
  if (localStorage.getItem('access_token')) return true;
  await inject(Router).navigateByUrl('/login');
  return false;
}
