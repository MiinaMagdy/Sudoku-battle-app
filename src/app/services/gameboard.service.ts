import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cell {
  value: number;
  isInitial: boolean;
  originalValue: number;
}

@Injectable({
  providedIn: 'root',
})
export class GameBoardService {
  constructor(private http: HttpClient) {}

  getSudokuBoard(difficulty: string): Observable<Cell[][]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { difficulty: difficulty };
    const apiUrl = environment.serverUrl + '/api/single';
    return this.http.post<any>(apiUrl, body, { headers: headers });
  }
}
