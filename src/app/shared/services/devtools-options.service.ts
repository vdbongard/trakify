import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DevtoolsOptionsService {
  isDebug(): 'auto' | boolean {
    const searchParams = new URLSearchParams(window.location.search);
    const isDebug = searchParams.get('debug') === '1';
    return isDebug ? true : 'auto';
  }
}
