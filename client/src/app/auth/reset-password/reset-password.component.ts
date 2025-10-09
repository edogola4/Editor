import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  template: `
    <div class="reset-password-container">
      <h2>Create a new password</h2>
      <p class="subtitle">Enter your new password below.</p>
      
      <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
        <input type="hidden" formControlName="token">
        
        <mat-form-field appearance="outline">
          <mat-label>New Password</mat-label>
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
          <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
            <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-hint>At least 8 characters with a number and special character</mat-hint>
          <mat-error *ngIf="resetForm.get('password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="resetForm.get('password')?.hasError('pattern')">
            Password must be at least 8 characters long and include a number and special character
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Confirm New Password</mat-label>
          <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" required>
          <button type="button" mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword">
            <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="resetForm.hasError('mismatch')">Passwords do not match</mat-error>
        </mat-form-field>
        
        <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
          <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
          <span *ngIf="!isLoading">Reset Password</span>
        </button>
        
        <div class="back-to-login">
          <a routerLink="/auth/login">
            <mat-icon>arrow_back</mat-icon> Back to sign in
          </a>
        </div>
      </form>
      
      <div *ngIf="passwordReset" class="success-message">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h3>Password Reset Successful</h3>
        <p>Your password has been successfully reset. You can now sign in with your new password.</p>
        <button mat-raised-button color="primary" (click)="navigateToLogin()">
          Back to Sign In
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
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
      margin: 8px 0 24px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    button[mat-raised-button] {
      height: 44px;
      border-radius: 4px;
      font-weight: 500;
      width: 100%;
    }
    
    mat-spinner {
      margin: 0 auto;
    }
    
    mat-hint {
      font-size: 12px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  passwordReset = false;
  error: string | null = null;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.resetForm = this.fb.group({
      token: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.route.paramMap.subscribe(params => {
      this.token = params.get('token');
      if (this.token) {
        this.resetForm.patchValue({ token: this.token });
      } else {
        this.snackBar.open('Invalid reset token', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { password } = this.resetForm.value;
    
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.passwordReset = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to reset password. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
