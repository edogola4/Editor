import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Check for role-based access if needed
          const requiredRoles = route.data['roles'] as Array<string>;
          if (requiredRoles && requiredRoles.length > 0) {
            const user = this.authService.getCurrentUser();
            const hasRole = requiredRoles.some(role => user?.roles?.includes(role));
            if (!hasRole) {
              return this.router.createUrlTree(['/unauthorized']);
            }
          }
          return true;
        } else {
          // Store the attempted URL for redirecting after login
          this.authService.redirectUrl = state.url;
          return this.router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
      }),
      catchError(() => {
        this.authService.redirectUrl = state.url;
        return of(this.router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        }));
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Redirect to home or dashboard if already authenticated
          return this.router.createUrlTree(['/']);
        }
        return true;
      }),
      catchError(() => of(true)) // Allow access to auth pages even if there's an error
    );
  }
}
