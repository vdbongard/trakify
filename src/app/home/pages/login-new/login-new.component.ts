import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthProvider, NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';
import { Router } from '@angular/router';
import * as Paths from '@shared/paths';

@Component({
  selector: 't-login-new',
  standalone: true,
  imports: [CommonModule, NgxAuthFirebaseUIModule],
  templateUrl: './login-new.component.html',
  styleUrls: ['./login-new.component.scss'],
})
export class LoginNewComponent {
  router = inject(Router);
  paths = Paths;
  authProvider = AuthProvider;
}
