import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameBoardService } from '../services/gameboard.service'; // Adjust the path as necessary

interface SudokuCell {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isValid: boolean;
  notes: boolean[];
}

@Component({
  selector: 'app-gameboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gameboard.component.html',
  styleUrl: './gameboard.component.scss',
})
export class GameboardComponent implements OnInit {
  // 9x9 grid for Sudoku
  grid: SudokuCell[][] = [];
  selectedCell: { row: number; col: number } | null = null;
  currentMode: 'number' | 'notes' = 'number';
  difficulty: 'easy' | 'medium' | 'hard' = 'easy';

  // Timer related properties
  timer: number = 0;
  timerInterval: any;
  isGameStarted: boolean = false;
  isGamePaused: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameBoardService: GameBoardService // Inject the service
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const difficultyParam = params['difficulty'];
      if (
        difficultyParam &&
        ['easy', 'medium', 'hard'].includes(difficultyParam)
      ) {
        this.difficulty = difficultyParam as 'easy' | 'medium' | 'hard';
      }

      this.initializeGrid();
      this.generatePuzzle();
    });
  }

  initializeGrid(): void {
    this.grid = Array(9)
      .fill(null)
      .map(() =>
        Array(9)
          .fill(null)
          .map(() => ({
            value: null,
            isInitial: false,
            isSelected: false,
            isValid: true,
            notes: Array(9).fill(false),
          }))
      );
  }

  generatePuzzle(): void {
    this.gameBoardService
      .getSudokuBoard(this.difficulty)
      .subscribe((samplePuzzle) => {
        // Fill the grid with the sample puzzle
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = samplePuzzle[row][col];
            if (cell.value !== 0) {
              this.grid[row][col].value = cell.value;
              this.grid[row][col].isInitial = cell.isInitial;
            }
          }
        }

        // Start the game timer
        this.startTimer();
        this.isGameStarted = true;
      });
  }

  selectCell(row: number, col: number): void {
    // Deselect previously selected cell
    if (this.selectedCell) {
      this.grid[this.selectedCell.row][this.selectedCell.col].isSelected =
        false;
    }

    // Select new cell
    this.grid[row][col].isSelected = true;
    this.selectedCell = { row, col };
  }

  inputNumber(num: number): void {
    if (!this.selectedCell || this.isGamePaused) return;

    const { row, col } = this.selectedCell;
    const cell = this.grid[row][col];

    // Can't modify original cells
    if (cell.isInitial) return;

    if (this.currentMode === 'number') {
      // Set the value or clear if same number is pressed
      cell.value = cell.value === num ? null : num;
      // Validate after setting value
      this.validateMove(row, col);
      // Check if game is completed
      this.checkGameCompletion();
    } else {
      // Toggle note for this number
      cell.notes[num - 1] = !cell.notes[num - 1];
    }
  }

  validateMove(row: number, col: number): void {
    const value = this.grid[row][col].value;
    if (!value) {
      this.grid[row][col].isValid = true;
      return;
    }

    // Check row
    for (let i = 0; i < 9; i++) {
      if (i !== col && this.grid[row][i].value === value) {
        this.grid[row][col].isValid = false;
        return;
      }
    }

    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && this.grid[i][col].value === value) {
        this.grid[row][col].isValid = false;
        return;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if (r !== row || c !== col) {
          if (this.grid[r][c].value === value) {
            this.grid[row][col].isValid = false;
            return;
          }
        }
      }
    }

    this.grid[row][col].isValid = true;
  }

  toggleMode(): void {
    this.currentMode = this.currentMode === 'number' ? 'notes' : 'number';
  }

  clearCell(): void {
    if (!this.selectedCell || this.isGamePaused) return;

    const { row, col } = this.selectedCell;
    if (!this.grid[row][col].isInitial) {
      this.grid[row][col].value = null;
      this.grid[row][col].notes = Array(9).fill(false);
      this.grid[row][col].isValid = true;
    }
  }

  resetGame(): void {
    // Reset the grid to initial state
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!this.grid[row][col].isInitial) {
          this.grid[row][col].value = null;
          this.grid[row][col].notes = Array(9).fill(false);
          this.grid[row][col].isValid = true;
        }
      }
    }

    // Reset timer
    this.timer = 0;
    this.startTimer();
  }

  pauseGame(): void {
    this.isGamePaused = true;
    clearInterval(this.timerInterval);
  }

  resumeGame(): void {
    this.isGamePaused = false;
    this.startTimer();
  }

  startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
    }, 1000);
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
    this.isGameStarted = false;

    // In a real app, you'd display a success message or modal here
    console.log('Game completed successfully in', this.formatTime());
    return true;
  }

  // Helper method to determine cell background color
  getCellBackgroundClass(row: number, col: number): string {
    const cell = this.grid[row][col];

    if (cell.isSelected) {
      return 'selected-cell';
    }

    // Highlight the 3x3 box, row, and column of the selected cell
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

    // Alternate background for boxes
    if ((Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0) {
      return 'alternate-cell';
    }

    return '';
  }

  goBackToDifficultySelection(): void {
    if (this.isGameStarted && !this.isGamePaused) {
      this.pauseGame();
      if (
        confirm(
          'Are you sure you want to leave the game? Your progress will be lost.'
        )
      ) {
        this.router.navigate(['/difficulty']);
      } else {
        this.resumeGame();
      }
    } else {
      this.router.navigate(['/difficulty']);
    }
  }
}
