import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GameboardComponent } from './gameboard/gameboard.component';
import { DifficultySelectionComponent } from './difficulty-selection/difficulty-selection.component';
import { BattleComponent } from './battle/battle.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game/:difficulty', component: GameboardComponent },
  { path: 'battle/:difficulty', component: BattleComponent },
  { path: 'difficulty', component: DifficultySelectionComponent },
  { path: '**', redirectTo: '' },
];
