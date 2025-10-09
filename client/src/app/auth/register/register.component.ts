import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <h2>Create an account</h2>
    
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" required>
        <mat-error *ngIf="registerForm.get('name')?.hasError('required')">Name is required</mat-error>
      </mat-form-field>
      
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required>
        <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
        <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
      </mat-form-field>
      
      <mat-form-field appearance="outline">
        <mat-label>Password</mat-label>
        <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
        <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
          <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
        <mat-hint>At least 8 characters with a number and special character</mat-hint>
        <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
        <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
          Password must be at least 8 characters long and include a number and special character
        </mat-error>
      </mat-form-field>
      
      <mat-form-field appearance="outline">
        <mat-label>Confirm Password</mat-label>
        <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" required>
        <button type="button" mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword">
          <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
        <mat-error *ngIf="registerForm.hasError('mismatch')">Passwords do not match</mat-error>
      </mat-form-field>
      
      <mat-checkbox formControlName="terms" color="primary">
        I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
        <a href="/privacy" target="_blank">Privacy Policy</a>
      </mat-checkbox>
      
      <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || !registerForm.valid">
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span *ngIf="!isLoading">Create Account</span>
      </button>
      
      <div class="divider">
        <span>OR</span>
      </div>
      
      <button mat-stroked-button type="button" (click)="registerWithGithub()" [disabled]="isLoading">
        <img src="assets/github-icon.svg" alt="GitHub" class="provider-icon">
        Sign up with GitHub
      </button>
      
      <div class="auth-footer">
        Already have an account? <a routerLink="/auth/login">Sign in</a>
      </div>
    </form>
  `,
  styles: [`
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: rgba(0, 0, 0, 0.5);
      margin: 8px 0;
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
      margin-top: 8px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .auth-footer a {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }
    
    mat-checkbox {
      margin: 8px 0;
    }
    
    mat-checkbox a {
      color: #3f51b5;
      text-decoration: none;
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
    
    mat-hint {
      font-size: 12px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { name, email, password } = this.registerForm.value;
    
    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.snackBar.open('Registration successful! Please check your email to verify your account.', 'Close', { duration: 5000 });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.error = err.message || 'Registration failed. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  registerWithGithub(): void {
    this.isLoading = true;
    this.authService.loginWithGithub().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'GitHub registration failed. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }
}
