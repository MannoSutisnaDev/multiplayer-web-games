import type ChessGame from "@/server/games/chess/ChessGame";
import type BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";

export type FetchGame = () => ChessGame;

export enum ArithmeticOperator {
  Addition = "addition",
  Subtraction = "subtraction",
  None = "none",
}

export type PlayerPiecesCollection = Array<Array<PIECE_TYPES>>;

export const PLAYER_ONE_PIECES: PlayerPiecesCollection = [
  [
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
  ],
  [
    PIECE_TYPES.ROOK,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.QUEEN,
    PIECE_TYPES.KING,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.ROOK,
  ],
];

export const PLAYER_TWO_PIECES: PlayerPiecesCollection = [
  [
    PIECE_TYPES.ROOK,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.QUEEN,
    PIECE_TYPES.KING,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.ROOK,
  ],
  [
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
    PIECE_TYPES.PAWN,
  ],
];

export type ValidPositionCollection = Array<
  Array<{
    isValid: ValidPositionType | string;
    pieces: BasePiece[];
  }>
>;

export enum ValidPositionType {
  INVALID = "invalid",
  VALID = "valid",
  OWN_PIECE = "ownPiece",
  OPPONENT_PIECE = "opponentPiece",
}

export const VALID_MOVES = [
  ValidPositionType.VALID,
  ValidPositionType.OPPONENT_PIECE,
];
