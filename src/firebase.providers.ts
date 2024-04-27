import { type EnvironmentProviders, importProvidersFrom, type Provider } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { firebaseConfig } from './firebase';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';

import './firebase';

const firebaseProviders: (Provider | EnvironmentProviders)[] = [
  importProvidersFrom([
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]),
  ScreenTrackingService,
  UserTrackingService,
];

export { firebaseProviders };
