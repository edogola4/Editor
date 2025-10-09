import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { Observable, Subject, timer, EMPTY } from 'rxjs';
import { retryWhen, tap, delayWhen, switchAll, catchError, filter } from 'rxjs/operators';

export interface FileEvent {
  type: 'create' | 'update' | 'delete' | 'move' | 'rename' | 'content-update';
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileSocketService {
  private socket$: WebSocketSubject<FileEvent>;
  private messagesSubject$ = new Subject<Observable<FileEvent>>();
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e; }));
  private RECONNECT_INTERVAL = 5000;
  private RETRY_COUNT = 5;
  private connectionUrl: string;

  constructor() {
    this.connectionUrl = this.getWebSocketUrl();
    this.connect();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = environment.wsUrl || window.location.host;
    return `${protocol}${host}/ws/files`;
  }

  private connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(
        retryWhen(errors => {
          return errors.pipe(
            tap(err => console.error('WebSocket error:', err)),
            delayWhen(() => timer(this.RECONNECT_INTERVAL)),
            tap(() => console.log('Retrying WebSocket connection...'))
          );
        }),
        catchError(error => {
          console.error('WebSocket connection error:', error);
          return EMPTY;
        })
      );
      this.messagesSubject$.next(messages);
    }
  }

  private getNewWebSocket(): WebSocketSubject<FileEvent> {
    return webSocket<FileEvent>({
      url: this.connectionUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
          // Subscribe to file changes for the current workspace
          this.send({ type: 'subscribe', data: { workspaceId: 'current' } });
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.socket$ = null;
          this.connect();
        }
      }
    });
  }

  send(message: any): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected');
    }
  }

  onFileCreated(): Observable<FileEvent> {
    return this.messages$.pipe(
      filter(event => event.type === 'create')
    );
  }

  onFileUpdated(): Observable<FileEvent> {
    return this.messages$.pipe(
      filter(event => event.type === 'update' || event.type === 'content-update')
    );
  }

  onFileDeleted(): Observable<FileEvent> {
    return this.messages$.pipe(
      filter(event => event.type === 'delete')
    );
  }

  onFileMoved(): Observable<FileEvent> {
    return this.messages$.pipe(
      filter(event => event.type === 'move' || event.type === 'rename')
    );
  }

  close(): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
  }
}
