import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { AuthProvider, NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui'; // doesn't work with esbuild
import { Router } from '@angular/router';
import * as Paths from '@shared/paths';

@Component({
  selector: 't-login-new',
  standalone: true,
  imports: [CommonModule],
  // imports: [CommonModule, NgxAuthFirebaseUIModule], // doesn't work with esbuild
  templateUrl: './login-new.component.html',
  styleUrls: ['./login-new.component.scss'],
})
export class LoginNewComponent {
  router = inject(Router);
  paths = Paths;
  // authProvider = AuthProvider; // doesn't work with esbuild
}
