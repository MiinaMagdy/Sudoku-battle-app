import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocketService, BattleState } from '../services/socket.service';
import { Subscription } from 'rxjs';

interface SudokuCell {
  value: number | null;
  isOriginal: boolean;
  isSelected: boolean;
  isValid: boolean;
  notes: boolean[];
}

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss',
})
export class BattleComponent implements OnInit, OnDestroy {
  // Game state
  grid: SudokuCell[][] = [];
  selectedCell: { row: number; col: number } | null = null;
  currentMode: 'number' | 'notes' = 'number';
  difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  playerName: string = '';

  // Battle state
  battleState: BattleState | null = null;
  private battleSubscription: Subscription | null = null;

  // Game progress
  filledCells: number = 0;
  totalCellsToFill: number = 0;
  progress: number = 0;
  mistakes: number = 0;
  maxMistakes: number = 3;

  // Timer
  timer: number = 0;
  timerInterval: any;
  isGameStarted: boolean = false;
  isGamePaused: boolean = false;
  isJoining: boolean = true;

  // Status messages
  statusMessage: string = '';
  showStatusOverlay: boolean = false;

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['difficulty']) {
        this.difficulty = params['difficulty'] as 'easy' | 'medium' | 'hard';
      }
    });

    // Subscribe to battle state updates
    this.battleSubscription = this.socketService
      .getBattleState()
      .subscribe((state) => {
        if (!state) return;

        this.battleState = state;
        this.handleBattleStateUpdate(state);
      });
  }

  ngOnDestroy(): void {
    if (this.battleSubscription) {
      this.battleSubscription.unsubscribe();
    }
    clearInterval(this.timerInterval);
    this.socketService.leaveBattle();
  }

  joinBattle(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = 'Please enter a name';
      return;
    }

    this.socketService.joinBattle(this.playerName, this.difficulty);
    this.isJoining = false;
    this.showStatusMessage('Waiting for opponent...');

    // Don't call readyUp here - it will be automatically called when match is found
  }

  private handleBattleStateUpdate(state: BattleState): void {
    console.log('Battle state update:', state);

    switch (state.status) {
      case 'waiting':
        this.showStatusMessage('Waiting for opponent...');
        break;

      case 'playing':
        if (!this.isGameStarted) {
          // Show a brief "Battle started!" message and then hide the overlay
          this.statusMessage = 'Battle started!';
          setTimeout(() => {
            console.log('Game starting - hiding overlay');
            this.showStatusOverlay = false; // Explicitly hide the overlay
            this.initializeGame();
          }, 1000);
          this.isGameStarted = true; // Mark game as started immediately
        }
        break;

      case 'finished':
        const playerId = this.socketService.getPlayerId();
        if (state.winner === playerId) {
          this.showStatusMessage('You won!', 0, true);
        } else if (state.winner && state.winner !== playerId) {
          this.showStatusMessage('You lost!', 0, true);
        } else {
          this.showStatusMessage('Game ended in a draw!', 0, true);
        }
        this.isGameStarted = false;
        clearInterval(this.timerInterval);
        break;
    }
  }

  private showStatusMessage(
    message: string,
    duration: number = 0,
    isGameOver: boolean = false
  ): void {
    this.statusMessage = message;
    this.showStatusOverlay = true;

    if (duration > 0) {
      setTimeout(() => {
        this.showStatusOverlay = false;
      }, duration);
    }
  }

  initializeGame(): void {
    this.initializeGrid();
    this.generatePuzzle();
    this.isGameStarted = true;
    this.startTimer();
    this.countTotalCellsToFill();
  }

  initializeGrid(): void {
    this.grid = Array(9)
      .fill(null)
      .map(() =>
        Array(9)
          .fill(null)
          .map(() => ({
            value: null,
            isOriginal: false,
            isSelected: false,
            isValid: true,
            notes: Array(9).fill(false),
          }))
      );
  }

  generatePuzzle(): void {
    // Generate puzzle based on difficulty
    let samplePuzzle: number[][] = [];

    switch (this.difficulty) {
      case 'easy':
        // Same as your existing easy puzzle
        samplePuzzle = [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ];
        break;
      case 'medium':
        // Same as your existing medium puzzle
        samplePuzzle = [
          [0, 0, 0, 2, 6, 0, 7, 0, 1],
          [6, 8, 0, 0, 7, 0, 0, 9, 0],
          [1, 9, 0, 0, 0, 4, 5, 0, 0],
          [8, 2, 0, 1, 0, 0, 0, 4, 0],
          [0, 0, 4, 6, 0, 2, 9, 0, 0],
          [0, 5, 0, 0, 0, 3, 0, 2, 8],
          [0, 0, 9, 3, 0, 0, 0, 7, 4],
          [0, 4, 0, 0, 5, 0, 0, 3, 6],
          [7, 0, 3, 0, 1, 8, 0, 0, 0],
        ];
        break;
      case 'hard':
        // Same as your existing hard puzzle
        samplePuzzle = [
          [0, 2, 0, 6, 0, 8, 0, 0, 0],
          [5, 8, 0, 0, 0, 9, 7, 0, 0],
          [0, 0, 0, 0, 4, 0, 0, 0, 0],
          [3, 7, 0, 0, 0, 0, 5, 0, 0],
          [6, 0, 0, 0, 0, 0, 0, 0, 4],
          [0, 0, 8, 0, 0, 0, 0, 1, 3],
          [0, 0, 0, 0, 2, 0, 0, 0, 0],
          [0, 0, 9, 8, 0, 0, 0, 3, 6],
          [0, 0, 0, 3, 0, 6, 0, 9, 0],
        ];
        break;
    }

    // Fill the grid with the sample puzzle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = samplePuzzle[row][col];
        if (value !== 0) {
          this.grid[row][col].value = value;
          this.grid[row][col].isOriginal = true;
        }
      }
    }
  }

  countTotalCellsToFill(): void {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!this.grid[row][col].isOriginal) {
          count++;
        }
      }
    }
    this.totalCellsToFill = count;
  }

  updateGameProgress(): void {
    let filledCount = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (
          !this.grid[row][col].isOriginal &&
          this.grid[row][col].value !== null
        ) {
          filledCount++;
        }
      }
    }
    this.filledCells = filledCount;
    this.progress = Math.floor((filledCount / this.totalCellsToFill) * 100);
    this.socketService.updateProgress(this.progress);
  }

  // Game mechanics methods (similar to your existing code)
  selectCell(row: number, col: number): void {
    if (this.isGamePaused || !this.isGameStarted) return;

    if (this.selectedCell) {
      this.grid[this.selectedCell.row][this.selectedCell.col].isSelected =
        false;
    }

    this.grid[row][col].isSelected = true;
    this.selectedCell = { row, col };
  }

  inputNumber(num: number): void {
    if (!this.selectedCell || !this.isGameStarted || this.isGamePaused) return;

    const { row, col } = this.selectedCell;
    const cell = this.grid[row][col];

    // Can't modify original cells
    if (cell.isOriginal) return;

    if (this.currentMode === 'number') {
      // Set the value or clear if same number is pressed
      const previousValue = cell.value;
      cell.value = cell.value === num ? null : num;

      // Validate after setting value
      const wasValid = this.validateMove(row, col);

      // Track mistakes
      if (!wasValid && cell.value !== null && previousValue !== cell.value) {
        this.mistakes++;
        this.socketService.reportMistake();

        if (this.mistakes >= this.maxMistakes) {
          this.showStatusMessage('Too many mistakes! You lost!', 0, true);
          this.socketService.leaveBattle();
          return;
        }
      }

      // Update both local state and send move to server
      if (wasValid && cell.value !== null) {
        this.socketService.makeMove(row, col, cell.value);
      }

      // Update progress
      this.updateGameProgress();

      // Check if game is completed
      if (this.checkGameCompletion()) {
        this.socketService.completeGame();
      }
    } else {
      // Toggle note
      cell.notes[num - 1] = !cell.notes[num - 1];
    }
  }

  validateMove(row: number, col: number): boolean {
    const value = this.grid[row][col].value;
    if (!value) {
      this.grid[row][col].isValid = true;
      return true;
    }

    // Check row
    for (let i = 0; i < 9; i++) {
      if (i !== col && this.grid[row][i].value === value) {
        this.grid[row][col].isValid = false;
        return false;
      }
    }

    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && this.grid[i][col].value === value) {
        this.grid[row][col].isValid = false;
        return false;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if ((r !== row || c !== col) && this.grid[r][c].value === value) {
          this.grid[row][col].isValid = false;
          return false;
        }
      }
    }

    this.grid[row][col].isValid = true;
    return true;
  }

  toggleMode(): void {
    this.currentMode = this.currentMode === 'number' ? 'notes' : 'number';
  }

  clearCell(): void {
    if (!this.selectedCell || !this.isGameStarted || this.isGamePaused) return;

    const { row, col } = this.selectedCell;
    if (!this.grid[row][col].isOriginal) {
      this.grid[row][col].value = null;
      this.grid[row][col].notes = Array(9).fill(false);
      this.grid[row][col].isValid = true;
      this.updateGameProgress();
    }
  }

  startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
    }, 1000);
  }

  pauseGame(): void {
    this.isGamePaused = true;
    clearInterval(this.timerInterval);
  }

  resumeGame(): void {
    this.isGamePaused = false;
    this.startTimer();
  }

  formatTime(): string {
    const minutes = Math.floor(this.timer / 60);
    const seconds = this.timer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  checkGameCompletion(): boolean {
    // Check if all cells are filled and valid
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = this.grid[row][col];
        if (cell.value === null || !cell.isValid) {
          return false;
        }
      }
    }

    // Game completed
    clearInterval(this.timerInterval);
    return true;
  }

  // Helper method to determine cell background color
  getCellBackgroundClass(row: number, col: number): string {
    const cell = this.grid[row][col];

    if (cell.isSelected) {
      return 'selected-cell';
    }

    if (this.selectedCell) {
      const { row: selectedRow, col: selectedCol } = this.selectedCell;
      const sameBox =
        Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
        Math.floor(col / 3) === Math.floor(selectedCol / 3);
      const sameRow = row === selectedRow;
      const sameCol = col === selectedCol;

      if (sameBox || sameRow || sameCol) {
        return 'highlighted-cell';
      }
    }

    if ((Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0) {
      return 'alternate-cell';
    }

    return '';
  }

  exitBattle(): void {
    if (
      confirm(
        'Are you sure you want to leave this battle? You will forfeit the game.'
      )
    ) {
      this.socketService.leaveBattle();
      this.router.navigate(['/']);
    }
  }

  getOpponentName(): string {
    if (!this.battleState) return 'Waiting...';

    const playerId = this.socketService.getPlayerId();
    const opponentId = this.battleState.playerIds.find((id) => id !== playerId);

    if (!opponentId || !this.battleState.playerNames[opponentId]) {
      return 'Opponent';
    }

    return this.battleState.playerNames[opponentId];
  }

  getOpponentProgress(): number {
    if (!this.battleState) return 0;

    const playerId = this.socketService.getPlayerId();
    const opponentId = this.battleState.playerIds.find((id) => id !== playerId);

    if (!opponentId || !this.battleState.playerProgress[opponentId]) {
      return 0;
    }

    return this.battleState.playerProgress[opponentId];
  }

  getOpponentMistakes(): number {
    if (!this.battleState) return 0;

    const playerId = this.socketService.getPlayerId();
    const opponentId = this.battleState.playerIds.find((id) => id !== playerId);

    if (
      !opponentId ||
      this.battleState.playerMistakes[opponentId] === undefined
    ) {
      return 0;
    }

    return this.battleState.playerMistakes[opponentId];
  }
}
