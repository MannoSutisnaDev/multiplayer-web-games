import BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import { FetchGame, ValidPositionCollection } from "@/server/games/chess/types";
import { setValidPawnMoveCells } from "@/server/games/chess/utils/position-validation";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
  PiecesDirection,
} from "@/shared/types/socket-communication/games/game-types";

export default class Pawn extends BasePiece {
  hasMoved: boolean;
  hasReachedEndOfBoard: boolean;
  constructor(
    row: number,
    column: number,
    playerIndex: number,
    fetchGame: FetchGame,
    hasMoved: boolean
  ) {
    super(row, column, playerIndex, fetchGame, PIECE_TYPES.PAWN);
    this.hasMoved = hasMoved;
    this.hasReachedEndOfBoard = false;
  }

  setValidPositions(
    validPositionCollection: ValidPositionCollection,
    projectedCells?: CellCollection<ChessPiece>
  ): void {
    const game = this.fetchGame();
    const player = game.players[this.playerIndex];
    const targetRow = this.targetRow ?? this.row;
    const targetColumn = this.targetColumn ?? this.column;
    const opponentPiece = game.cells[targetRow][targetColumn].playerPiece;
    const willStrikeOpponentPiece = !!(
      opponentPiece && opponentPiece.playerIndex !== this.playerIndex
    );
    const firstMove = !this.hasMoved;
    const cellCollection = projectedCells ?? game.cells;
    validPositionCollection = setValidPawnMoveCells(
      this,
      validPositionCollection,
      cellCollection,
      player.direction,
      willStrikeOpponentPiece,
      firstMove
    );
  }

  validateMoveSpecific(targetRow: number, targetColumn: number): boolean {
    const game = this.fetchGame();
    const player = game.players[this.playerIndex];
    if (
      player.direction === PiecesDirection.DOWN &&
      targetRow === game.cells.length - 1
    ) {
      this.hasReachedEndOfBoard = true;
    } else if (player.direction === PiecesDirection.UP && targetRow === 0) {
      this.hasReachedEndOfBoard = true;
    }
    return true;
  }

  setHasMoved(hasMoved: boolean) {
    this.hasMoved = hasMoved;
  }
}
