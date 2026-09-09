import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        const data = res.data || res;
        const user = data.user;
        if (user && user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user && user.role === 'directeur') {
          this.router.navigate(['/directeur/dashboard']);
        } else if (user && user.role === 'professeur') {
          this.router.navigate(['/professeur/dashboard']);
        } else if (user && (user.role === 'candidat' || user.role === 'doctorant')) {
          this.router.navigate(['/candidat/mes-candidatures']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Email ou mot de passe incorrect.';
        console.error('Erreur de connexion', err);
      }
    });
  }
}
