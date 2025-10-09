import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <h2>Sign In</h2>
    
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required>
        <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
        <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
      </mat-form-field>
      
      <mat-form-field appearance="outline">
        <mat-label>Password</mat-label>
        <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
        <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
          <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
        <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
      </mat-form-field>
      
      <div class="form-actions">
        <a routerLink="/auth/forgot-password" class="forgot-password">Forgot password?</a>
      </div>
      
      <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span *ngIf="!isLoading">Sign In</span>
      </button>
      
      <div class="divider">
        <span>OR</span>
      </div>
      
      <button mat-stroked-button type="button" (click)="loginWithGithub()" [disabled]="isLoading">
        <img src="assets/github-icon.svg" alt="GitHub" class="provider-icon">
        Continue with GitHub
      </button>
      
      <div class="auth-footer">
        Don't have an account? <a routerLink="/auth/register">Sign up</a>
      </div>
    </form>
  `,
  styles: [`
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    
    .forgot-password {
      color: #3f51b5;
      text-decoration: none;
      font-size: 14px;
    }
    
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: rgba(0, 0, 0, 0.5);
      margin: 16px 0;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    
    .divider span {
      padding: 0 16px;
    }
    
    .provider-icon {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .auth-footer a {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }
    
    button[mat-raised-button],
    button[mat-stroked-button] {
      height: 44px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    button[mat-stroked-button] {
      border-color: rgba(0, 0, 0, 0.12);
    }
    
    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Check for existing session or token
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { email, password, rememberMe } = this.loginForm.value;
    
    this.authService.login(email, password, rememberMe).subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.snackBar.open('Successfully logged in', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.error = err.message || 'Login failed. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  loginWithGithub(): void {
    this.isLoading = true;
    this.authService.loginWithGithub().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'GitHub login failed. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }
}
