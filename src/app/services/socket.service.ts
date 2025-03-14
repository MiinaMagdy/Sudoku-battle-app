import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import * as EVENTS from '../shared/socket-events';

export interface BattleState {
  status: 'waiting' | 'playing' | 'finished';
  roomId: string;
  playerIds: string[];
  playerNames: { [playerId: string]: string };
  playerProgress: { [playerId: string]: number };
  playerMistakes: { [playerId: string]: number };
  winner?: string;
  gameStart?: number;
  gameEnd?: number;
  board?: number[][];
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private playerId: string = '';
  private battleStateSubject = new BehaviorSubject<BattleState | null>(null);

  constructor() {
    this.socket = io(environment.serverUrl);
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to game server with ID:', this.socket.id);
      this.playerId = this.socket.id!;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      this.updateBattleState({ status: 'finished' });
    });

    // Match and room events
    this.socket.on(EVENTS.MATCH_FOUND, (data) => {
      console.log('Match found:', data);

      // Auto-ready when match is found
      setTimeout(() => {
        console.log('Auto-sending ready signal');
        this.socket.emit(EVENTS.GAME_READY);
      }, 1000);

      this.updateBattleState({
        status: 'waiting',
        roomId: data.roomId,
        playerIds: data.opponents.map((o: any) => o.id),
        playerNames: data.opponents.reduce((acc: any, o: any) => {
          acc[o.id] = o.username;
          return acc;
        }, {}),
        playerProgress: {},
        playerMistakes: {},
      });
    });

    // Ready event listener to track both players' ready state
    this.socket.on(EVENTS.GAME_READY, (data) => {
      console.log('Player ready:', data);
      // We don't need to update battle state here as the game start will happen soon
    });

    // Game events
    this.socket.on(EVENTS.GAME_START, (data) => {
      console.log('Game started:', data);
      // When game starts, explicitly set status to 'playing' and include gameState info
      this.updateBattleState({
        status: 'playing',
        gameStart: Date.now(),
        board: data.gameState?.board,
      });
    });

    this.socket.on(EVENTS.GAME_END, (data) => {
      console.log('Game ended:', data);
      this.updateBattleState({
        status: 'finished',
        winner: data.winner?.id,
        gameEnd: Date.now(),
      });
    });

    // Game updates
    this.socket.on(EVENTS.CELL_UPDATE, (data) => {
      console.log('Cell updated:', data);
      // Update player progress based on the update
      const currentState = this.battleStateSubject.getValue();
      if (currentState) {
        const playerProgress = { ...currentState.playerProgress };
        playerProgress[data.playerId] = data.score;
        this.updateBattleState({
          ...currentState,
          playerProgress,
        });
      }
    });

    // Player state updates
    this.socket.on(EVENTS.PROGRESS_UPDATE, (data) => {
      console.log('Progress update:', data);
      const currentState = this.battleStateSubject.getValue();
      if (currentState && data.playerId !== this.playerId) {
        const playerProgress = { ...currentState.playerProgress };
        playerProgress[data.playerId] = data.progress;
        this.updateBattleState({
          ...currentState,
          playerProgress,
        });
      }
    });

    this.socket.on(EVENTS.MISTAKE_MADE, (data) => {
      console.log('Mistake made:', data);
      const currentState = this.battleStateSubject.getValue();
      if (currentState && data.playerId !== this.playerId) {
        const playerMistakes = { ...currentState.playerMistakes };
        playerMistakes[data.playerId] = data.mistakeCount;
        this.updateBattleState({
          ...currentState,
          playerMistakes,
        });
      }
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private updateBattleState(update: Partial<BattleState>): void {
    const currentState = this.battleStateSubject.getValue();
    this.battleStateSubject.next({
      ...(currentState || {
        status: 'waiting',
        roomId: '',
        playerIds: [],
        playerNames: {},
        playerProgress: {},
        playerMistakes: {},
      }),
      ...update,
    } as BattleState);
  }

  // Public methods for game actions
  public joinBattle(playerName: string, difficulty: string): void {
    this.socket.emit(EVENTS.JOIN_QUEUE, {
      username: playerName,
      difficulty,
    });
  }

  public leaveBattle(): void {
    this.socket.emit(EVENTS.LEAVE_ROOM);
    this.battleStateSubject.next(null);
  }

  public readyUp(): void {
    this.socket.emit(EVENTS.GAME_READY);
  }

  public makeMove(row: number, col: number, value: number): void {
    this.socket.emit(EVENTS.CELL_UPDATE, { row, col, value });
  }

  public updateProgress(progress: number): void {
    const currentState = this.battleStateSubject.getValue();
    if (currentState) {
      // Update local state
      const playerProgress = { ...currentState.playerProgress };
      playerProgress[this.playerId] = progress;
      this.updateBattleState({
        ...currentState,
        playerProgress,
      });

      // Send to server to broadcast to other players
      this.socket.emit(EVENTS.PROGRESS_UPDATE, { progress });
    }
  }

  public reportMistake(): void {
    const currentState = this.battleStateSubject.getValue();
    if (currentState) {
      // Update local state
      const playerMistakes = { ...currentState.playerMistakes };
      playerMistakes[this.playerId] = (playerMistakes[this.playerId] || 0) + 1;
      this.updateBattleState({
        ...currentState,
        playerMistakes,
      });

      // Send to server to broadcast to other players
      this.socket.emit(EVENTS.MISTAKE_MADE);
    }
  }

  public completeGame(): void {
    this.socket.emit(EVENTS.GAME_END, { completed: true });
  }

  public attackOpponent(
    targetId: string,
    attackType: string,
    data?: any
  ): void {
    this.socket.emit(EVENTS.ATTACK_OPPONENT, {
      type: attackType,
      targetId,
      ...data,
    });
  }

  public useDefense(defenseType: string): void {
    this.socket.emit(EVENTS.USE_DEFENSE, { type: defenseType });
  }

  public usePowerup(powerupType: string): void {
    this.socket.emit(EVENTS.USE_POWERUP, { type: powerupType });
  }

  // Getters
  public getBattleState(): Observable<BattleState | null> {
    return this.battleStateSubject.asObservable();
  }

  public getPlayerId(): string | undefined {
    return this.playerId;
  }

  public getCurrentBattleState(): BattleState | null {
    return this.battleStateSubject.getValue();
  }

  // Add a debug method to help troubleshoot state issues
  public logCurrentState(): void {
    const state = this.battleStateSubject.getValue();
    console.log('Current Battle State:', state);
  }
}
