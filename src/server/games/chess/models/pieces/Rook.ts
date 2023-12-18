import BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import { FetchGame, ValidPositionCollection } from "@/server/games/chess/types";
import {
  generateValidPositionCollection,
  setValidOrthogonalCells,
} from "@/server/games/chess/utils/position-validation";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

export default class Rook extends BasePiece {
  hasMoved: boolean;
  constructor(
    row: number,
    column: number,
    playerIndex: number,
    fetchGame: FetchGame,
    hasMoved: boolean
  ) {
    super(row, column, playerIndex, fetchGame, PIECE_TYPES.ROOK);
    this.hasMoved = hasMoved;
  }

  setValidPositions(
    validPositionCollection: ValidPositionCollection,
    projectedCells: CellCollection<ChessPiece>
  ): void {
    const game = this.fetchGame();
    const cellCollection = projectedCells ?? game.cells;
    setValidOrthogonalCells(
      this,
      validPositionCollection,
      cellCollection,
      true
    );
  }

  validateMoveSpecific(targetRow: number, targetColumn: number) {
    const game = this.fetchGame();
    let validPositionCollection = generateValidPositionCollection(game.cells);
    validPositionCollection = setValidOrthogonalCells(
      this,
      validPositionCollection,
      game.cells,
      true
    );
    const validMove =
      validPositionCollection[targetRow]?.[targetColumn] ?? null;
    if (!validMove) {
      throw new Error(`Invalid move for rook`);
    }
    return true;
  }
}
