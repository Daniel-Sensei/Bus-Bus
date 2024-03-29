// Esempio di implementazione client WebSocket in Angular
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    this.socket$ = webSocket('ws://localhost:8080/websocket'); // Assumi che il backend sia in ascolto su questo URL WebSocket
  }

  connect(): WebSocketSubject<any> {
    return this.socket$;
  }
}
