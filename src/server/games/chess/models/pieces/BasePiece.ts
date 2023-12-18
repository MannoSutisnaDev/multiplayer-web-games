import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import {
  FetchGame,
  VALID_MOVES,
  ValidPositionCollection,
  ValidPositionType,
} from "@/server/games/chess/types";
import { generateValidPositionCollection } from "@/server/games/chess/utils/position-validation";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

export default abstract class BasePiece
  implements ChessPiece, RebuildableModelInterface<ChessPiece>
{
  row: number;
  column: number;
  type: PIECE_TYPES;
  fetchGame: FetchGame;
  playerIndex: number;

  targetRow?: number;
  targetColumn?: number;

  constructor(
    row: number,
    column: number,
    playerIndex: number,
    fetchGame: FetchGame,
    type: PIECE_TYPES
  ) {
    this.row = row;
    this.column = column;
    this.playerIndex = playerIndex;
    this.fetchGame = fetchGame;
    this.type = type;
  }

  rebuild(data: ChessPiece) {
    this.type = data.type;
    this.row = data.row;
    this.column = data.column;
    this.playerIndex = data.playerIndex;
  }

  getType() {
    return this.type;
  }

  serialize(): ChessPiece {
    return {
      row: this.row,
      column: this.column,
      type: this.type,
      playerIndex: this.playerIndex,
    };
  }

  validateMove(targetRow: number, targetColumn: number): boolean {
    const game = this.fetchGame();
    const cellCollection = game.cells;
    const validPosition = cellCollection[targetRow]?.[targetColumn] ?? false;
    if (!validPosition) {
      throw new Error("Move is outside of board");
    }

    if (validPosition.playerPiece?.playerIndex === this.playerIndex) {
      throw new Error("Cell already contains player piece");
    }

    const validPositionCollection = generateValidPositionCollection(game.cells);
    this.targetRow = targetRow;
    this.targetColumn = targetColumn;
    this.setValidPositions(validPositionCollection);

    let moveType = validPositionCollection[targetRow]?.[targetColumn] ?? null;

    if (moveType) {
      const convertedMoveType = moveType.isValid as ValidPositionType;
      if (!VALID_MOVES.includes(convertedMoveType)) {
        throw new Error(`Invalid move for ${this.type}`);
      }
    }

    if (!this.validateMoveSpecific(targetRow, targetColumn)) {
      return false;
    }

    return true;
  }

  abstract setValidPositions(
    validPositionCollection: ValidPositionCollection,
    projectedCells?: CellCollection<ChessPiece>
  ): void;

  abstract validateMoveSpecific(
    targetRow: number,
    targetColumn: number
  ): boolean;
}
