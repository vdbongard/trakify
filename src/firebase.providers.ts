import { type EnvironmentProviders, type Provider, importProvidersFrom } from '@angular/core';
import {
  ScreenTrackingService,
  UserTrackingService,
  getAnalytics,
  provideAnalytics,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './firebase';

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
