import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAsiNN3wbRTJ-Rk9vzIva8thHEuLVRSFsA',
  authDomain: 'trakify-3fd19.firebaseapp.com',
  projectId: 'trakify-3fd19',
  storageBucket: 'trakify-3fd19.appspot.com',
  messagingSenderId: '418907777625',
  appId: '1:418907777625:web:d4fb236a55ec79f46d9f48',
  measurementId: 'G-TWEGBCZ6B9',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.debug('firebase', app);
console.debug('analytics', analytics);
