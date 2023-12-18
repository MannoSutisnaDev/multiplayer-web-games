import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";

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

export interface GamePosition {
  row: number;
  column: number;
}

export interface OriginTargetPayload {
  origin: GamePosition;
  target: GamePosition;
}

export interface BaseCell {
  index: number;
  column: number;
  row: number;
}

export interface Cell<T extends Piece> extends BaseCell {
  playerPiece: T | null;
}

export interface Piece {
  playerIndex: number;
}

export interface ChessPiece extends Piece {
  row: number;
  column: number;
  type: PIECE_TYPES;
}

export interface CheckersPiece extends Piece {
  moveMode: MoveMode;
}

export type CellCollection<T extends Piece> = Array<Array<Cell<T>>>;

export interface BasePlayerModelInterface {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
}

export interface ChessBoardPlayerInterface extends BasePlayerModelInterface {
  direction: PiecesDirection | null;
}

export interface CheckersPlayerInterface extends ChessBoardPlayerInterface {
  pieceThatHasStrikedPosition: GamePosition | null;
}

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
