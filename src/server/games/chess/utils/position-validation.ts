import type BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import {
  ArithmeticOperator,
  ValidPositionCollection,
  ValidPositionType,
} from "@/server/games/chess/types";
import {
  CellCollection,
  ChessPiece,
  PiecesDirection,
} from "@/shared/types/socket-communication/games/game-types";

import { applyArithmeticOperator } from "./general";

export const generateValidPositionCollection = (
  cellCollection: CellCollection<ChessPiece>
): ValidPositionCollection => {
  const validPositionCollection: ValidPositionCollection = [];
  for (const columns of cellCollection) {
    const validCells: Array<{
      isValid: ValidPositionType | string;
      pieces: BasePiece[];
    }> = [];
    for (const column of columns) {
      validCells.push({
        isValid: ValidPositionType.INVALID,
        pieces: [],
      });
    }
    validPositionCollection.push(validCells);
  }
  return validPositionCollection;
};

export const setValidDiagonalCells = (
  piece: BasePiece,
  validPositionCollection: ValidPositionCollection,
  cellCollection: CellCollection<ChessPiece>,
  indefiniteMove: boolean
): ValidPositionCollection => {
  const data: DetermineValidPositionsData = {
    piece,
    playerIndex: piece.playerIndex,
    validPositionCollection,
    cellCollection,
    rowIndex: piece.row,
    columnIndex: piece.column,
    indefiniteMove,
  };

  setUpLeftValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setUpRightValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setDownLeftValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setDownRightValidPositions(data);
  return data.validPositionCollection;
};

export const setValidOrthogonalCells = (
  piece: BasePiece,
  validPositionCollection: ValidPositionCollection,
  cellCollection: CellCollection<ChessPiece>,
  indefiniteMove: boolean
): ValidPositionCollection => {
  const data: DetermineValidPositionsData = {
    piece,
    playerIndex: piece.playerIndex,
    validPositionCollection,
    cellCollection,
    rowIndex: piece.row,
    columnIndex: piece.column,
    indefiniteMove,
  };

  setUpValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setDownValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setLeftValidPositions(data);
  data.rowIndex = piece.row;
  data.columnIndex = piece.column;
  setRightValidPositions(data);
  return data.validPositionCollection;
};

interface DetermineValidPositionsData {
  piece: BasePiece;
  cellCollection: CellCollection<ChessPiece>;
  validPositionCollection: ValidPositionCollection;
  playerIndex: number;
  rowIndex: number;
  columnIndex: number;
  indefiniteMove: boolean;
}

const setValidPosition = ({
  data,
  rowOperator,
  rowAmount,
  columnOperator,
  columnAmount,
}: {
  data: DetermineValidPositionsData;
  rowOperator: ArithmeticOperator;
  rowAmount?: number;
  columnOperator: ArithmeticOperator;
  columnAmount?: number;
}): void => {
  const {
    cellCollection,
    validPositionCollection,
    playerIndex,
    rowIndex,
    columnIndex,
    indefiniteMove,
  } = data;

  const newRowIndex = applyArithmeticOperator(rowIndex, rowOperator, rowAmount);
  const newColumnIndex = applyArithmeticOperator(
    columnIndex,
    columnOperator,
    columnAmount
  );
  const newPosition = cellCollection[newRowIndex]?.[newColumnIndex] ?? null;

  if (!newPosition) {
    return;
  }

  validPositionCollection[newRowIndex][newColumnIndex].isValid =
    ValidPositionType.VALID;
  validPositionCollection[newRowIndex][newColumnIndex].pieces.push(data.piece);
  if (newPosition.playerPiece) {
    if (newPosition.playerPiece.playerIndex === playerIndex) {
      validPositionCollection[newRowIndex][newColumnIndex].isValid =
        ValidPositionType.OWN_PIECE;
    } else {
      validPositionCollection[newRowIndex][newColumnIndex].isValid =
        ValidPositionType.OPPONENT_PIECE;
      validPositionCollection[newRowIndex][newColumnIndex].pieces.push(
        data.piece
      );
    }
    return;
  }

  if (!indefiniteMove) {
    return;
  }

  data.rowIndex = newRowIndex;
  data.columnIndex = newColumnIndex;

  setValidPosition({
    data,
    rowOperator,
    columnOperator,
  });
};

const setUpLeftValidPositions = (data: DetermineValidPositionsData): void => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    columnOperator: ArithmeticOperator.Subtraction,
  });
};

const setUpRightValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    columnOperator: ArithmeticOperator.Addition,
  });
};

const setDownLeftValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    columnOperator: ArithmeticOperator.Subtraction,
  });
};

const setDownRightValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    columnOperator: ArithmeticOperator.Addition,
  });
};

const setUpValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    columnOperator: ArithmeticOperator.None,
  });
};

const setDownValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    columnOperator: ArithmeticOperator.None,
  });
};

const setRightValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.None,
    columnOperator: ArithmeticOperator.Subtraction,
  });
};

const setLeftValidPositions = (data: DetermineValidPositionsData) => {
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.None,
    columnOperator: ArithmeticOperator.Addition,
  });
};

export const setValidPawnMoveCells = (
  piece: BasePiece,
  validPositionCollection: ValidPositionCollection,
  cellCollection: CellCollection<ChessPiece>,
  direction: PiecesDirection | null,
  willStrikeOpponentPiece: boolean,
  firstMove: boolean
): ValidPositionCollection => {
  if (direction === null) {
    throw new Error("Invalid direction");
  }
  const data: DetermineValidPositionsData = {
    piece,
    playerIndex: piece.playerIndex,
    rowIndex: piece.row,
    columnIndex: piece.column,
    validPositionCollection,
    cellCollection,
    indefiniteMove: false,
  };
  if (!willStrikeOpponentPiece) {
    setPawnMoveValidCells(data, direction, firstMove);
  } else {
    setPawnStrikeMoveValidCells(data, direction);
  }
  return validPositionCollection;
};

const setPawnMoveValidCells = (
  data: DetermineValidPositionsData,
  direction: PiecesDirection,
  firstMove: boolean
): ValidPositionCollection => {
  if (direction === PiecesDirection.DOWN) {
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Addition,
      columnOperator: ArithmeticOperator.None,
    });
    if (firstMove) {
      setValidPosition({
        data,
        rowOperator: ArithmeticOperator.Addition,
        rowAmount: 2,
        columnOperator: ArithmeticOperator.None,
      });
    }
  } else {
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Subtraction,
      columnOperator: ArithmeticOperator.None,
    });
    if (firstMove) {
      setValidPosition({
        data,
        rowOperator: ArithmeticOperator.Subtraction,
        rowAmount: 2,
        columnOperator: ArithmeticOperator.None,
      });
    }
  }
  return data.validPositionCollection;
};

const setPawnStrikeMoveValidCells = (
  data: DetermineValidPositionsData,
  direction: PiecesDirection
) => {
  if (direction === PiecesDirection.DOWN) {
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Addition,
      columnOperator: ArithmeticOperator.Addition,
    });
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Addition,
      columnOperator: ArithmeticOperator.Subtraction,
    });
  } else {
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Subtraction,
      columnOperator: ArithmeticOperator.Addition,
    });
    setValidPosition({
      data,
      rowOperator: ArithmeticOperator.Subtraction,
      columnOperator: ArithmeticOperator.Subtraction,
    });
  }
};

export const setValidKnightMoveCells = (
  piece: BasePiece,
  validPositionCollection: ValidPositionCollection,
  cellCollection: CellCollection<ChessPiece>
): ValidPositionCollection => {
  const data: DetermineValidPositionsData = {
    piece,
    playerIndex: piece.playerIndex,
    validPositionCollection,
    cellCollection,
    rowIndex: piece.row,
    columnIndex: piece.column,
    indefiniteMove: false,
  };
  // Top left high
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    rowAmount: 2,
    columnOperator: ArithmeticOperator.Subtraction,
  });

  //Top left low
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    columnOperator: ArithmeticOperator.Subtraction,
    columnAmount: 2,
  });

  //Top Right high
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    rowAmount: 2,
    columnOperator: ArithmeticOperator.Addition,
  });

  //Top Right low
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Subtraction,
    columnOperator: ArithmeticOperator.Addition,
    columnAmount: 2,
  });

  //Bottom left high
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    columnOperator: ArithmeticOperator.Subtraction,
    columnAmount: 2,
  });

  //Bottom left low
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    rowAmount: 2,
    columnOperator: ArithmeticOperator.Subtraction,
  });

  //Bottom right high
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    columnOperator: ArithmeticOperator.Addition,
    columnAmount: 2,
  });

  //Bottom right low
  setValidPosition({
    data,
    rowOperator: ArithmeticOperator.Addition,
    rowAmount: 2,
    columnOperator: ArithmeticOperator.Addition,
  });

  return validPositionCollection;
};
