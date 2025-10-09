import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private totalRequests = 0;
  private excludedEndpoints = [
    '/notifications',
    '/auth/refresh-token',
    '/socket.io/'
  ];

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading indicator for excluded endpoints
    if (this.isExcludedEndpoint(request.url)) {
      return next.handle(request);
    }

    this.totalRequests++;
    this.loadingService.setLoading(true);

    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            this.decreaseRequests();
          }
        },
        error: () => {
          this.decreaseRequests();
        },
        finalize: () => {
          // Finalize is called when the observable completes or errors out
        }
      })
    );
  }

  private decreaseRequests() {
    this.totalRequests--;
    if (this.totalRequests === 0) {
      this.loadingService.setLoading(false);
    }
  }

  private isExcludedEndpoint(url: string): boolean {
    return this.excludedEndpoints.some(endpoint => url.includes(endpoint));
  }
}
