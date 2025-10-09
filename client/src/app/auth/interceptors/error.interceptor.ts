import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        let displayMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          console.error('Client error:', error.error.message);
          displayMessage = 'A client error occurred. Please try again.';
        } else {
          // Server-side error
          console.error(`Server error: ${error.status}`, error.error);
          
          // Handle different HTTP status codes
          switch (error.status) {
            case 0:
              displayMessage = 'Unable to connect to the server. Please check your internet connection.';
              break;
            case 400:
              displayMessage = this.getErrorMessage(error, 'Invalid request');
              break;
            case 401:
              // Handled by auth interceptor
              return throwError(() => error);
            case 403:
              displayMessage = 'You do not have permission to perform this action';
              this.router.navigate(['/forbidden']);
              break;
            case 404:
              displayMessage = 'The requested resource was not found';
              this.router.navigate(['/not-found']);
              break;
            case 422:
              // Validation errors
              displayMessage = this.getValidationErrors(error);
              break;
            case 429:
              displayMessage = 'Too many requests. Please try again later.';
              break;
            case 500:
              displayMessage = 'A server error occurred. Please try again later.';
              break;
            case 503:
              displayMessage = 'Service is currently unavailable. Please try again later.';
              break;
            default:
              displayMessage = 'An unexpected error occurred. Please try again.';
          }
        }

        // Only show error message if it's not an auth or validation request
        if (!this.shouldSkipErrorNotification(request)) {
          this.showError(displayMessage);
        }

        return throwError(() => ({
          message: errorMessage,
          displayMessage,
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  private getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (error.error?.message) {
      return error.error.message;
    }
    return defaultMessage;
  }

  private getValidationErrors(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      const errors = error.error.errors;
      return Object.values(errors)
        .map(messages => (Array.isArray(messages) ? messages.join(' ') : messages))
        .join(' ');
    }
    return error.error?.message || 'Validation failed';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private shouldSkipErrorNotification(request: HttpRequest<any>): boolean {
    // Skip error notifications for these paths
    const skipPaths = [
      '/auth/refresh-token',
      '/auth/logout',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    return skipPaths.some(path => request.url.includes(path));
  }
}
