import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="avatar-container">
          <img [src]="user?.avatarUrl || 'assets/default-avatar.png'" alt="Profile" class="avatar">
          <button mat-icon-button class="edit-avatar" (click)="triggerFileInput()">
            <mat-icon>edit</mat-icon>
            <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none;" accept="image/*">
          </button>
        </div>
        <h2>{{ user?.name || 'User' }}</h2>
        <p class="email">{{ user?.email }}</p>
        <mat-chip-list *ngIf="user?.emailVerified" class="verified-badge">
          <mat-chip color="primary" selected>Verified</mat-chip>
        </mat-chip-list>
        <button mat-stroked-button *ngIf="!user?.emailVerified" (click)="sendVerificationEmail()" class="verify-email">
          Verify Email
        </button>
      </div>
      
      <mat-tab-group dynamicHeight>
        <mat-tab label="Profile">
          <div class="tab-content">
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-error *ngIf="profileForm.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                <mat-error *ngIf="profileForm.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="profileForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Bio</mat-label>
                <textarea matInput formControlName="bio" rows="4"></textarea>
              </mat-form-field>
              
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || !profileForm.dirty">
                  <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                  <span *ngIf="!isLoading">Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="Change Password">
          <div class="tab-content">
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="password-form">
              <mat-form-field appearance="outline">
                <mat-label>Current Password</mat-label>
                <input matInput [type]="hideCurrentPassword ? 'password' : 'text'" formControlName="currentPassword" required>
                <button type="button" mat-icon-button matSuffix (click)="hideCurrentPassword = !hideCurrentPassword">
                  <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">Current password is required</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>New Password</mat-label>
                <input matInput [type]="hideNewPassword ? 'password' : 'text'" formControlName="newPassword" required>
                <button type="button" mat-icon-button matSuffix (click)="hideNewPassword = !hideNewPassword">
                  <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-hint>At least 8 characters with a number and special character</mat-hint>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">New password is required</mat-error>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('pattern')">
                  Password must be at least 8 characters long and include a number and special character
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Confirm New Password</mat-label>
                <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" required>
                <button type="button" mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword">
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.hasError('mismatch')">Passwords do not match</mat-error>
              </mat-form-field>
              
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || !passwordForm.valid">
                  <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                  <span *ngIf="!isLoading">Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="Connected Accounts">
          <div class="tab-content">
            <div class="connected-accounts">
              <div class="account-item">
                <div class="account-info">
                  <img src="assets/email-icon.svg" alt="Email" class="provider-icon">
                  <div>
                    <div class="account-name">Email & Password</div>
                    <div class="account-email">{{ user?.email }}</div>
                  </div>
                </div>
                <mat-slide-toggle [checked]="true" [disabled]="true"></mat-slide-toggle>
              </div>
              
              <div class="account-item">
                <div class="account-info">
                  <img src="assets/github-icon.svg" alt="GitHub" class="provider-icon">
                  <div>
                    <div class="account-name">GitHub</div>
                    <div class="account-email" *ngIf="user?.githubConnected">Connected as {{ user?.githubUsername }}</div>
                    <div class="account-email" *ngIf="!user?.githubConnected">Not connected</div>
                  </div>
                </div>
                <button mat-stroked-button color="primary" (click)="connectGithub()" *ngIf="!user?.githubConnected">
                  Connect
                </button>
                <button mat-stroked-button color="warn" (click)="disconnectGithub()" *ngIf="user?.githubConnected">
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .avatar-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 16px;
    }
    
    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #f5f5f5;
    }
    
    .edit-avatar {
      position: absolute;
      bottom: 0;
      right: 0;
      background-color: #3f51b5;
      color: white;
    }
    
    .edit-avatar:hover {
      background-color: #303f9f;
    }
    
    .email {
      color: rgba(0, 0, 0, 0.6);
      margin: 8px 0 16px;
    }
    
    .verified-badge {
      margin-bottom: 16px;
    }
    
    .verify-email {
      margin-top: 8px;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    .profile-form, .password-form {
      max-width: 500px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-actions {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
    
    .connected-accounts {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .account-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .account-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .provider-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    
    .account-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .account-email {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    mat-spinner {
      margin: 0 auto;
    }
    
    mat-hint {
      font-size: 12px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  isUploading = false;

  @ViewChild('fileInput') fileInput: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          bio: user.bio || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load profile', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { name, email, bio } = this.profileForm.value;

    this.authService.updateProfile({ name, email, bio }).subscribe({
      next: (user) => {
        this.user = user;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        this.profileForm.markAsPristine();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to update profile';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Password updated successfully', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to update password';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.authService.uploadAvatar(file).subscribe({
      next: (user) => {
        this.user = user;
        this.snackBar.open('Profile picture updated', 'Close', { duration: 3000 });
        this.isUploading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to upload image', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isUploading = false;
      }
    });
  }

  sendVerificationEmail(): void {
    this.isLoading = true;
    this.authService.sendVerificationEmail().subscribe({
      next: () => {
        this.snackBar.open('Verification email sent. Please check your inbox.', 'Close', { duration: 5000 });
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to send verification email';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.isLoading = false;
      }
    });
  }

  connectGithub(): void {
    this.authService.connectGithub().subscribe({
      next: (url) => {
        // Redirect to GitHub OAuth URL
        window.location.href = url;
      },
      error: (err) => {
        this.snackBar.open('Failed to connect GitHub account', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }

  disconnectGithub(): void {
    this.authService.disconnectGithub().subscribe({
      next: () => {
        if (this.user) {
          this.user.githubConnected = false;
          this.user.githubUsername = undefined;
        }
        this.snackBar.open('GitHub account disconnected', 'Close', { duration: 3000 });
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to disconnect GitHub account';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }
}
