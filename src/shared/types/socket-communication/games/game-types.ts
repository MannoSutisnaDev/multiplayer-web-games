export type Direction = {
  rowDirection: number;
  columnDirection: number;
};

export type Directions = {
  leftUp: Direction;
  rightUp: Direction;
  leftDown: Direction;
  rightDown: Direction;
};

export enum PiecesDirection {
  UP = "up",
  DOWN = "down",
}

export enum MoveMode {
  REGULAR = "regular",
  ALREADY_STRIKED = "alreadyStriked",
  KING = "king",
}

export interface Player {
  direction: PiecesDirection;
  pieceThatHasStriked: { row: number; column: number } | null;
  connected: boolean;
}

export interface Cell {
  index: number;
  column: number;
  row: number;
  playerPiece: Piece | null;
}

export interface Piece {
  index: number;
  playerIndex: number;
  moveMode: MoveMode;
}

export interface GamePosition {
  row: number;
  column: number;
}

export interface OriginTargetPayload {
  origin: GamePosition;
  target: GamePosition;
}

export type CellCollection = Array<Array<Cell>>;

export type PlayableCells = Array<{ row: number; column: number }>;

export enum GameState {
  Playing = "playing",
  Paused = "paused",
}

export interface PlayerPayload {
  sessionID: string;
  userID: string;
  username: string;
}

export const COLUMNS = 8;
export const ROWS = 8;
export const PLAYER_PIECES = 12;
