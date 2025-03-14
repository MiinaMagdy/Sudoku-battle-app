import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SocketService } from './services/socket.service';
import { provideHttpClient } from '@angular/common/http';
import { GameBoardService } from './services/gameboard.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    SocketService,
    provideHttpClient(),
    GameBoardService,
  ],
};
