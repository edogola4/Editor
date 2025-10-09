import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../../environments/environment';
import { User, LoginCredentials, RegisterData, AuthResponse, PasswordResetData } from '../models/user.model';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenExpirationTimer: any;

  user$ = this.userSubject.asObservable();
  isAuthenticated$ = this.user$.pipe(map(user => !!user));

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (token && user) {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.refreshToken().subscribe({
          error: () => this.logout()
        });
      } else {
        this.userSubject.next(user);
        this.setAutoLogout(this.getTokenExpiration(token));
      }
    } else {
      this.logout();
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthentication(response)),
      map(response => response.user),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, userData).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, { refreshToken: this.getRefreshToken() }).subscribe();
    this.clearAuthData();
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(data: PasswordResetData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, data).pipe(
      catchError(this.handleError)
    );
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.apiUrl}/profile`, updates).pipe(
      map(response => {
        const user = response.user;
        this.storeUserData(user);
        return user;
      }),
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/change-password`,
      { currentPassword, newPassword }
    ).pipe(
      catchError(this.handleError)
    );
  }

  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<{ user: User }>(`${this.apiUrl}/avatar`, formData).pipe(
      map(response => {
        const user = response.user;
        this.storeUserData(user);
        return user;
      }),
      catchError(this.handleError)
    );
  }

  sendVerificationEmail(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/send-verification`, {}).pipe(
      catchError(this.handleError)
    );
  }

  verifyEmail(token: string): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/verify-email?token=${token}`).pipe(
      tap(response => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          currentUser.emailVerified = true;
          this.storeUserData(currentUser);
        }
      }),
      catchError(this.handleError)
    );
  }

  loginWithGithub(): Observable<void> {
    return new Observable(observer => {
      const width = 600;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const authWindow = window.open(
        `${this.apiUrl}/github`,
        'github-auth',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!authWindow) {
        observer.error(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== new URL(environment.apiUrl).origin) {
          return;
        }

        if (event.data.type === 'AUTH_SUCCESS') {
          this.handleAuthentication(event.data.payload);
          observer.next();
          observer.complete();
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'AUTH_ERROR') {
          observer.error(new Error(event.data.payload.message));
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);

      // Handle window close
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          if (!this.isAuthenticated()) {
            observer.error(new Error('Authentication window was closed'));
          }
        }
      }, 500);
    });
  }

  connectGithub(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/github/connect`).pipe(
      catchError(this.handleError)
    );
  }

  disconnectGithub(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/github/disconnect`).pipe(
      catchError(this.handleError)
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private handleAuthentication(response: AuthResponse): void {
    const { user, accessToken, refreshToken, expiresIn } = response;
    
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this.storeUserData(user);
    
    this.userSubject.next(user);
    this.setAutoLogout(expiresIn * 1000);
  }

  private storeUserData(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private setAutoLogout(expirationDuration: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    }, expirationDuration - 60000); // Refresh 1 minute before expiration
  }

  private getTokenExpiration(token: string): number {
    const decoded = this.jwtHelper.decodeToken(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    return expiresAt - Date.now();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('AuthService error:', error);
    
    const apiError: ApiError = {
      message: 'An error occurred',
      status: error.status,
      errors: {}
    };

    if (error.status === 0) {
      apiError.message = 'Unable to connect to the server. Please check your connection.';
    } else if (error.error) {
      apiError.message = error.error.message || error.message;
      if (error.error.errors) {
        apiError.errors = error.error.errors;
      }
    }

    return throwError(() => apiError);
  }
}
