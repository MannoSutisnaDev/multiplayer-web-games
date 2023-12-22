import BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import type Rook from "@/server/games/chess/models/pieces/Rook";
import {
  FetchGame,
  ValidPositionCollection,
  ValidPositionType,
} from "@/server/games/chess/types";
import { printValidPositionsCollection } from "@/server/games/chess/utils/general";
import {
  generateValidPositionCollection,
  setValidDiagonalCells,
  setValidOrthogonalCells,
} from "@/server/games/chess/utils/position-validation";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

const CASTLE_LEFT = "castleLeft";
const CASTLE_RIGHT = "castleRight";

export enum CastleDirection {
  LEFT = "castleLeft",
  RIGHT = "castleRight",
}

const VALID_CASTLES = [CastleDirection.LEFT, CastleDirection.RIGHT];

export default class King extends BasePiece {
  hasMoved: boolean;
  performCastle: {
    row: number;
    column: number;
    columnAdjustment: number;
  } | null;
  constructor(
    row: number,
    column: number,
    playerIndex: number,
    fetchGame: FetchGame,
    hasMoved: boolean
  ) {
    super(row, column, playerIndex, fetchGame, PIECE_TYPES.KING);
    this.hasMoved = hasMoved;
    this.performCastle = null;
  }

  setValidPositions(
    validPositionCollection: ValidPositionCollection,
    projectedCells?: CellCollection<ChessPiece>
  ): void {
    const game = this.fetchGame();
    const cellCollection = projectedCells ?? game.cells;
    setValidDiagonalCells(this, validPositionCollection, cellCollection, false);
    setValidOrthogonalCells(
      this,
      validPositionCollection,
      cellCollection,
      false
    );
  }

  validateMoveSpecific(targetRow: number, targetColumn: number) {
    const game = this.fetchGame();
    const cellCollection = game.cells;
    let validPositionCollection = generateValidPositionCollection(game.cells);
    this.setValidPositions(validPositionCollection);

    const validMovesPreviousPlayer = game.getAllValidMovesForPlayer(
      game.getPreviousPlayerIndex()
    );
    if (
      validMovesPreviousPlayer[targetRow][targetColumn].isValid !==
      ValidPositionType.INVALID
    ) {
      throw new Error(
        `This is not a possible move because it will get you checked.`
      );
    }

    if (!this.hasMoved) {
      if (validPositionCollection[this.row]?.[this.column - 2]) {
        validPositionCollection[this.row][this.column - 2].isValid =
          CASTLE_LEFT;
      }
      if (validPositionCollection[this.row]?.[this.column + 2]) {
        validPositionCollection[this.row][this.column + 2].isValid =
          CASTLE_RIGHT;
      }
    }
    const validMove =
      validPositionCollection[targetRow]?.[targetColumn] ?? null;
    if (!validMove) {
      throw new Error(`Invalid move for king`);
    }
    const direction = validMove.isValid as CastleDirection;
    if (typeof direction !== "string" || !VALID_CASTLES.includes(direction)) {
      return false;
    }
    let possibleRook: BasePiece | null = null;
    let errorMessage = "No rook found";
    let column = 0;
    let columnsEmptyCheck: Array<number> = [];
    let columnAdjustment = 0;
    CastleDirection.LEFT ? 3 : -2;
    if (direction === CastleDirection.LEFT) {
      column = this.column - 4;
      columnsEmptyCheck = [this.column - 3, this.column - 2, this.column - 1];
      possibleRook =
        (cellCollection[this.row][column].playerPiece as BasePiece) ?? null;
      columnAdjustment = 3;
      errorMessage = "No valid rook found for left castle";
    } else if (direction === CastleDirection.RIGHT) {
      column = this.column + 3;
      columnsEmptyCheck = [this.column + 1, this.column + 2];
      possibleRook =
        (cellCollection[this.row][column].playerPiece as BasePiece) ?? null;
      columnAdjustment = -2;
      errorMessage = "No valid rook found for right castle";
    }
    const rook = possibleRook as Rook;
    if (
      !rook ||
      rook.type !== PIECE_TYPES.ROOK ||
      rook.playerIndex !== this.playerIndex ||
      rook.hasMoved
    ) {
      throw new Error(errorMessage);
    }

    for (const column of columnsEmptyCheck) {
      if (cellCollection[this.row][column].playerPiece) {
        throw new Error(
          "There are one or more pieces between the King and the Rook"
        );
      }
    }
    this.performCastle = {
      row: this.row,
      column,
      columnAdjustment,
    };
    return true;
  }
}
