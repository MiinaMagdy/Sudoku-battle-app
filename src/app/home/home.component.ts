import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  title = 'Sudoku Battle';
  gameFeatures = [
    {
      title: 'Single Player',
      description: 'Challenge yourself with puzzles of varying difficulty',
      icon: 'person',
    },
    {
      title: 'Multiplayer',
      description: 'Compete in real-time with friends or random opponents',
      icon: 'groups',
    },
    {
      title: 'Daily Challenges',
      description: 'New puzzles every day to keep your skills sharp',
      icon: 'calendar_today',
    },
    {
      title: 'Leaderboards',
      description: 'See how you rank against other players worldwide',
      icon: 'leaderboard',
    },
  ];

  constructor(private router: Router) {}

  navigateToGame(mode: string): void {
    if (mode === 'play') {
      this.router.navigate(['/difficulty']);
    } else if (mode === 'tutorial') {
      // Navigate to tutorial when implemented
      console.log('Tutorial mode selected');
    }
  }
}
