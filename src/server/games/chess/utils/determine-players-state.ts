import ChessGame from "@/server/games/chess/ChessGame";
import BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import {
  ValidPositionCollection,
  ValidPositionType,
} from "@/server/games/chess/types";
import { generateValidPositionCollection } from "@/server/games/chess/utils/position-validation";
import {
  PIECE_TYPES,
  PlayerState,
} from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

export const determinePlayerState = (game: ChessGame): PlayerState => {
  const validMovesPreviousPlayer = game.getAllValidMovesForPlayer(
    game.getPreviousPlayerIndex()
  );

  const kingCurrentPlayer = searchPiece(
    game,
    game.currentPlayerIndex,
    PIECE_TYPES.KING
  );

  let state: PlayerState = PlayerState.Regular;

  const { row, column } = kingCurrentPlayer;

  if (
    validMovesPreviousPlayer[row][column].isValid === ValidPositionType.VALID
  ) {
    state = PlayerState.Check;
  }

  if (
    state === PlayerState.Check &&
    determineCheckMate(game, game.currentPlayerIndex)
  ) {
    state = PlayerState.CheckMate;
  }
  return state;
};

export const checkValidMovesForAllPieces = (
  game: ChessGame,
  targetPlayerIndex: number,
  projectedCells?: CellCollection<ChessPiece>
): ValidPositionCollection => {
  const cellCollection = projectedCells ?? game.cells;
  const validPositionCollection =
    generateValidPositionCollection(cellCollection);
  for (const columns of cellCollection) {
    for (const column of columns) {
      if (
        column.playerPiece &&
        column.playerPiece.playerIndex === targetPlayerIndex
      ) {
        const playerPiece = column.playerPiece as BasePiece;
        playerPiece.setValidPositions(validPositionCollection, projectedCells);
      }
    }
  }
  return validPositionCollection;
};

export const searchPiece = (
  game: ChessGame,
  targetPlayerIndex: number,
  type: PIECE_TYPES
): BasePiece => {
  for (const columns of game.cells) {
    for (const column of columns) {
      if (
        column.playerPiece &&
        column.playerPiece.playerIndex === targetPlayerIndex &&
        column.playerPiece.type === type
      ) {
        return column.playerPiece as BasePiece;
      }
    }
  }
  throw new Error(`Could not find target piece: '${type}'`);
};

const getValidMovesCoordinates = (
  validPostionCollection: ValidPositionCollection,
  includeOwnPieces = false
): Array<{
  piece: BasePiece;
  row: number;
  column: number;
}> => {
  const validMoves: Array<{ piece: BasePiece; row: number; column: number }> =
    [];

  let rowIndex = 0;
  let columnIndex = 0;
  const VALID = [ValidPositionType.VALID, ValidPositionType.OPPONENT_PIECE];
  if (includeOwnPieces) {
    VALID.push(ValidPositionType.OWN_PIECE);
  }
  for (const columns of validPostionCollection) {
    for (const column of columns) {
      const moveType = column.isValid as ValidPositionType;
      if (!VALID.includes(moveType)) {
        columnIndex++;
        continue;
      }
      for (const piece of column.pieces) {
        validMoves.push({
          piece,
          row: rowIndex,
          column: columnIndex,
        });
      }
      columnIndex++;
    }
    rowIndex++;
  }
  return validMoves;
};

export const determineCheckedAfterMove = (
  game: ChessGame,
  targetPlayerIndex: number,
  piece: BasePiece,
  targetRow: number,
  targetColumn: number
): boolean => {
  const projectedCells = game.projectMove(piece, targetRow, targetColumn);
  const validMovesPreviousPlayer = game.getAllValidMovesForPlayer(
    game.getPreviousPlayerIndex(piece.playerIndex),
    projectedCells
  );
  const kingCurrentPlayer = searchPiece(
    game,
    targetPlayerIndex,
    PIECE_TYPES.KING
  );
  return (
    validMovesPreviousPlayer[kingCurrentPlayer.row][kingCurrentPlayer.column]
      .isValid === ValidPositionType.VALID
  );
};

export const determineCheckMate = (
  game: ChessGame,
  targetPlayerIndex: number
) => {
  const kingCurrentPlayer = searchPiece(
    game,
    targetPlayerIndex,
    PIECE_TYPES.KING
  );
  const validMovesKingCurrentPlayer = generateValidPositionCollection(
    game.cells
  );
  kingCurrentPlayer.setValidPositions(validMovesKingCurrentPlayer);

  const validMoveCoordinatesKing = getValidMovesCoordinates(
    validMovesKingCurrentPlayer
  );

  const kingCanMove = projectMoveCoordinatesAndDetermineIfInvalid(
    game,
    validMoveCoordinatesKing
  );

  const allValidMovesCurrentPlayer = game.getAllValidMovesForPlayer(
    game.currentPlayerIndex
  );
  const allValidMoveCoordinatesCurrentPlayer = getValidMovesCoordinates(
    allValidMovesCurrentPlayer
  );
  const otherPieceCanDefend = projectMoveCoordinatesAndDetermineIfInvalid(
    game,
    allValidMoveCoordinatesCurrentPlayer,
    kingCurrentPlayer.row,
    kingCurrentPlayer.column
  );
  return !kingCanMove && !otherPieceCanDefend;
};

const projectMoveCoordinatesAndDetermineIfInvalid = (
  game: ChessGame,
  collectionValidMoveCoordinates: Array<{
    piece: BasePiece;
    row: number;
    column: number;
  }>,
  targetRow?: number,
  targetColumn?: number
) => {
  let willCreateInvalid = false;
  for (const validMoveCoordinates of collectionValidMoveCoordinates) {
    const { piece, row, column } = validMoveCoordinates;
    const projectedCells = game.projectMove(piece, row, column);
    targetRow = targetRow ?? row;
    targetColumn = targetColumn ?? column;
    const validMovesPreviousPlayer = game.getAllValidMovesForPlayer(
      game.getPreviousPlayerIndex(),
      projectedCells
    );
    if (
      validMovesPreviousPlayer[targetRow][targetColumn].isValid ===
      ValidPositionType.INVALID
    ) {
      willCreateInvalid = true;
      break;
    }
  }
  return willCreateInvalid;
};
