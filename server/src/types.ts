export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type SpecialType = 'addLine' | 'clearLine' | 'nuke' | 'randomClear' | 'switchField' | 'clearSpecials' | 'blockBomb' | 'blockQuake' | 'blockGravity';

export type CellType = number;

export type Board = number[][];

export type TeamColor = 'red' | 'blue' | 'green' | 'yellow' | 'none';

export interface PlayerState {
  id: string;
  name: string;
  board: Board;
  score: number;
  level: number;
  lines: number;
  isAlive: boolean;
  specials: SpecialType[];
  team: TeamColor;
}

export interface RoomState {
  id: string;
  name: string;
  players: PlayerState[];
  gameStarted: boolean;
  hostId: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameStarted: boolean;
}

export interface ClientToServerEvents {
  join_room: (data: {roomId: string, playerName: string}, callback: (ok: boolean, err?: string) => void) => void;
  set_team: (team: TeamColor) => void;
  start_game: () => void;
  board_update: (data: {board: Board, score: number, level: number, lines: number}) => void;
  lines_cleared: (data: {count: number, board: Board, score: number}) => void;
  use_special: (data: {special: SpecialType, targetId: string | null}) => void;
  player_lost: (data: {board: Board}) => void;
  chat_message: (message: string) => void;
  request_rooms: (callback: (rooms: RoomSummary[]) => void) => void;
}

export interface ServerToClientEvents {
  room_joined: (data: {room: RoomState, playerId: string}) => void;
  rooms_list: (rooms: RoomSummary[]) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (playerId: string) => void;
  game_started: (data: {seed: number, startLevel: number}) => void;
  board_update: (data: {playerId: string, board: Board, score: number, level: number, lines: number}) => void;
  receive_garbage: (lines: number) => void;
  receive_special: (special: SpecialType) => void;
  player_lost: (playerId: string) => void;
  player_team_updated: (data: {playerId: string, team: TeamColor}) => void;
  game_over: (data: {winner: string | null, winnerTeam?: TeamColor}) => void;
  chat_message: (data: {playerName: string, message: string, timestamp: number}) => void;
  error: (message: string) => void;
}
