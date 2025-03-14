// Connection events
export const CONNECTION = 'connection';
export const DISCONNECT = 'disconnect';
export const RECONNECT = 'reconnect';

// Room management
export const JOIN_QUEUE = 'join_queue';
export const LEAVE_QUEUE = 'leave_queue';
export const MATCH_FOUND = 'match_found';
export const JOIN_ROOM = 'join_room';
export const LEAVE_ROOM = 'leave_room';

// Game lifecycle
export const GAME_START = 'game_start';
export const GAME_PAUSE = 'game_pause';
export const GAME_RESUME = 'game_resume';
export const GAME_END = 'game_end';
export const GAME_READY = 'game_ready'; // Added this constant

// Game state
export const BOARD_UPDATE = 'board_update';
export const CELL_UPDATE = 'cell_update';
export const TIMER_UPDATE = 'timer_update';

// Player state updates
export const PROGRESS_UPDATE = 'progress_update';
export const MISTAKE_MADE = 'mistake_made';

// Battle mechanics
export const ATTACK_OPPONENT = 'attack_opponent';
export const RECEIVE_ATTACK = 'receive_attack';
export const USE_DEFENSE = 'use_defense';
export const USE_POWERUP = 'use_powerup';

// Game results
export const VICTORY = 'victory';
export const DEFEAT = 'defeat';
export const DRAW = 'draw';
