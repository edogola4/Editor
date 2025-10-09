import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="forgot-password-container">
      <h2>Reset your password</h2>
      <p class="subtitle">Enter your email address and we'll send you a link to reset your password.</p>
      
      <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="auth-form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" required>
          <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
        </mat-form-field>
        
        <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
          <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
          <span *ngIf="!isLoading">Send Reset Link</span>
        </button>
        
        <div class="back-to-login">
          <a routerLink="/auth/login">
            <mat-icon>arrow_back</mat-icon> Back to sign in
          </a>
        </div>
      </form>
      
      <div *ngIf="emailSent" class="success-message">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h3>Check your email</h3>
        <p>We've sent a password reset link to <strong>{{ forgotPasswordForm.get('email')?.value }}</strong>.</p>
        <p>Didn't receive the email? <a href="javascript:void(0)" (click)="resendEmail()">Click to resend</a></p>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      max-width: 400px;
      margin: 0 auto;
    }
    
    .subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 24px;
      font-size: 14px;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .back-to-login {
      text-align: center;
      margin-top: 16px;
    }
    
    .back-to-login a {
      display: inline-flex;
      align-items: center;
      color: #3f51b5;
      text-decoration: none;
      font-size: 14px;
    }
    
    .back-to-login mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    
    .success-message {
      text-align: center;
      padding: 24px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-top: 24px;
    }
    
    .success-icon {
      color: #4caf50;
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      margin-bottom: 16px;
    }
    
    .success-message h3 {
      margin: 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .success-message p {
      margin: 8px 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .success-message a {
      color: #3f51b5;
      text-decoration: none;
    }
    
    button[mat-raised-button] {
      height: 44px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const email = this.forgotPasswordForm.get('email')?.value;
    
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.emailSent = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to send reset email. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  resendEmail(): void {
    if (this.forgotPasswordForm.valid) {
      this.onSubmit();
    } else {
      this.snackBar.open('Please enter a valid email address', 'Close', { duration: 3000 });
    }
  }
}
