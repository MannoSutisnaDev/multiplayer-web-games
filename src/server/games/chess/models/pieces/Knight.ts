import BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import { FetchGame, ValidPositionCollection } from "@/server/games/chess/types";
import { setValidKnightMoveCells } from "@/server/games/chess/utils/position-validation";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

export default class Knight extends BasePiece {
  constructor(
    row: number,
    column: number,
    playerIndex: number,
    fetchGame: FetchGame
  ) {
    super(row, column, playerIndex, fetchGame, PIECE_TYPES.KNIGHT);
  }

  setValidPositions(
    validPositionCollection: ValidPositionCollection,
    projectedCells: CellCollection<ChessPiece>
  ): void {
    const game = this.fetchGame();
    const cellCollection = projectedCells ?? game.cells;
    setValidKnightMoveCells(this, validPositionCollection, cellCollection);
  }

  validateMoveSpecific(targetRow: number, targetColumn: number): boolean {
    return true;
  }
}
