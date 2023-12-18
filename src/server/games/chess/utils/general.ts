import type BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import Bishop from "@/server/games/chess/models/pieces/Bishop";
import King from "@/server/games/chess/models/pieces/King";
import Knight from "@/server/games/chess/models/pieces/Knight";
import Pawn from "@/server/games/chess/models/pieces/Pawn";
import Queen from "@/server/games/chess/models/pieces/Queen";
import Rook from "@/server/games/chess/models/pieces/Rook";
import {
  ArithmeticOperator,
  FetchGame,
  ValidPositionCollection,
  ValidPositionType,
} from "@/server/games/chess/types";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";

export const PieceBuilder = (
  type: PIECE_TYPES,
  row: number,
  column: number,
  playerIndex: number,
  fetchGame: FetchGame,
  hasMoved?: boolean
): BasePiece => {
  switch (type) {
    case PIECE_TYPES.BISHOP:
      return new Bishop(row, column, playerIndex, fetchGame);
    case PIECE_TYPES.KING:
      return new King(row, column, playerIndex, fetchGame, hasMoved ?? false);
    case PIECE_TYPES.KNIGHT:
      return new Knight(row, column, playerIndex, fetchGame);
    case PIECE_TYPES.PAWN:
      return new Pawn(row, column, playerIndex, fetchGame, hasMoved ?? false);
    case PIECE_TYPES.QUEEN:
      return new Queen(row, column, playerIndex, fetchGame);
    case PIECE_TYPES.ROOK:
      return new Rook(row, column, playerIndex, fetchGame, hasMoved ?? false);
    default:
      throw Error(`Invalid piece type: '${type}'`);
  }
};

export const applyArithmeticOperator = (
  value: number,
  operator: ArithmeticOperator,
  amount: number = 1
): number => {
  switch (operator) {
    case ArithmeticOperator.Addition:
      value += amount;
      break;
    case ArithmeticOperator.Subtraction:
      value -= amount;
      break;
  }
  return value;
};

export const printValidPositionsCollection = (
  validPositionCollection: ValidPositionCollection
): void => {
  let result = "";
  let indent = "    ";
  result += "[ \n";
  for (const columns of validPositionCollection) {
    result += indent + "[ \n";
    result +=
      indent +
      indent +
      columns
        .map((column) => {
          if (column.isValid === ValidPositionType.INVALID) {
            return "0";
          } else if (column.isValid === ValidPositionType.VALID) {
            return "1";
          } else if (column.isValid === ValidPositionType.OPPONENT_PIECE) {
            return "2";
          } else if (column.isValid === ValidPositionType.OWN_PIECE) {
            return "3";
          } else {
            return "n";
          }
        })
        .join(", ") +
      "\n";
    result += indent + "], \n";
  }
  result += "]";
  console.log(result);
};
