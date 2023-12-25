import {
  Cell as CellInterface,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

import BasePiece from "./pieces/BasePiece";

export default class ChessCell implements CellInterface<ChessPiece> {
  index: number;
  row: number;
  column: number;
  playerPiece: ChessPiece | null;

  constructor(index: number, row: number, column: number) {
    this.index = index;
    this.row = row;
    this.column = column;
    this.playerPiece = null;
  }

  setPiece(piece: BasePiece | null) {
    this.playerPiece = piece;
  }
}
