import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-difficulty-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './difficulty-selection.component.html',
  styleUrl: './difficulty-selection.component.scss',
})
export class DifficultySelectionComponent {
  selectedMode: 'single' | 'battle' = 'single';

  constructor(private router: Router) {}

  selectMode(mode: 'single' | 'battle'): void {
    this.selectedMode = mode;
  }

  selectDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    const route = this.selectedMode === 'single' ? '/game' : '/battle';
    this.router.navigate([route, difficulty]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
