import CheckersPlayer from "@/server/games/checkers/CheckersPlayer";
import {
  Cell,
  CellCollection,
  CheckersPiece,
  Direction,
  Directions,
  MoveMode,
  OriginTargetPayload,
  Piece,
  PiecesDirection,
} from "@/shared/types/socket-communication/games/game-types";

export const validateMove = (
  movePiecePayload: OriginTargetPayload,
  players: Array<CheckersPlayer>,
  piecePlayerIndex: number,
  currentPlayerIndex: number,
  cellCollection: CellCollection<CheckersPiece>
): {
  error?: string;
  valid: boolean;
  removePieces: Array<{ row: number; column: number }>;
} => {
  const removePieces: Array<{ row: number; column: number }> = [];
  if (piecePlayerIndex !== currentPlayerIndex) {
    return {
      error: "This is not your piece.",
      valid: false,
      removePieces,
    };
  }
  const { origin, target } = movePiecePayload;
  if (target.row === origin.row && target.column === origin.column) {
    return {
      valid: false,
      removePieces,
    };
  }
  const player = players[currentPlayerIndex];
  const pieceThatHasStriked = player.pieceThatHasStrikedPosition;
  const targetCell = cellCollection[origin.row][origin.column];
  if (!targetCell.playerPiece) {
    return {
      error: "Invalid piece",
      valid: false,
      removePieces,
    };
  }
  if (
    pieceThatHasStriked !== null &&
    (pieceThatHasStriked.row !== targetCell.row ||
      pieceThatHasStriked.column !== targetCell.column)
  ) {
    return {
      error: "This is not the piece you just striked with.",
      valid: false,
      removePieces,
    };
  }
  const moveMode = targetCell.playerPiece.moveMode;
  if (moveMode === MoveMode.REGULAR || moveMode === MoveMode.KING) {
    const { valid, error } = validateRegularMove(
      movePiecePayload,
      currentPlayerIndex,
      player,
      cellCollection,
      removePieces,
      targetCell.playerPiece
    );
    return {
      valid,
      error,
      removePieces,
    };
  }
  const { valid, error } = validateAlreadyStrikedMove(
    movePiecePayload,
    currentPlayerIndex,
    player,
    cellCollection,
    removePieces,
    targetCell.playerPiece
  );
  return {
    valid,
    error,
    removePieces,
  };
};

const validateRegularMove = (
  movePiecePayload: OriginTargetPayload,
  currentPlayerIndex: number,
  player: CheckersPlayer,
  cellCollection: CellCollection<CheckersPiece>,
  removePieces: Array<{ row: number; column: number }>,
  targetPiece: CheckersPiece
): {
  error?: string;
  valid: boolean;
} => {
  const {
    valid: regularValid,
    error: regularError,
    validSquare: regularValidSquare,
  } = movePieceValidation(
    movePiecePayload,
    player,
    cellCollection,
    targetPiece.moveMode
  );

  if (regularValid) {
    return {
      valid: true,
    };
  }

  const {
    valid: strikeValid,
    error: strikeError,
    validSquare: strikeValidSquare,
  } = strikeOpponentPieceValidation(
    movePiecePayload,
    currentPlayerIndex,
    player,
    targetPiece,
    removePieces,
    cellCollection
  );

  if (strikeValid) {
    return {
      valid: true,
      error: "",
    };
  }

  let error = "";
  if (regularValidSquare) {
    error = regularError;
  } else if (strikeValidSquare) {
    error = strikeError;
  } else {
    error = "That move is not valid.";
  }
  return {
    valid: false,
    error,
  };
};

const validateAlreadyStrikedMove = (
  movePiecePayload: OriginTargetPayload,
  currentPlayerIndex: number,
  player: CheckersPlayer,
  cellCollection: CellCollection<CheckersPiece>,
  removePieces: Array<{ row: number; column: number }>,
  targetPiece: CheckersPiece
): {
  error?: string;
  valid: boolean;
} => {
  const { valid: strikeValid, error: strikeError } =
    strikeOpponentPieceValidation(
      movePiecePayload,
      currentPlayerIndex,
      player,
      targetPiece,
      removePieces,
      cellCollection
    );

  if (strikeValid) {
    return {
      valid: true,
      error: "",
    };
  }

  return {
    error: strikeError,
    valid: false,
  };
};

export const generateValidDirections = (
  direction: PiecesDirection,
  moveMode: MoveMode
): { [k: string]: Direction } => {
  const directions = getRegularDirections();
  const validDirections: { [k: string]: Direction } = {};
  if (moveMode === MoveMode.KING) {
    for (const direction of Object.values(directions)) {
      const movementKey = generateMovementKey(
        direction.rowDirection,
        direction.columnDirection
      );
      validDirections[movementKey] = direction;
    }
    return validDirections;
  }
  let directionKeys: Array<keyof Directions> =
    direction === PiecesDirection.DOWN
      ? ["leftUp", "rightUp"]
      : ["leftDown", "rightDown"];
  for (const directionKey of directionKeys) {
    const direction = directions[directionKey];
    const movementKey = generateMovementKey(
      direction.rowDirection,
      direction.columnDirection
    );
    validDirections[movementKey] = direction;
  }
  return validDirections;
};

export const canStrikeOtherOpponentPiece = (
  origin: { row: number; column: number },
  currentPlayerIndex: number,
  cellCollection: CellCollection<CheckersPiece>,
  direction: PiecesDirection | null
): boolean => {
  if (!direction) {
    return false;
  }
  const validDirections = generateStrikeValidDirections(
    direction,
    MoveMode.ALREADY_STRIKED
  );
  for (const data of Object.values(validDirections)) {
    const { direction, opponentPieceDirection } = data;
    const targetSquareFree =
      cellCollection[origin.row + direction.rowDirection]?.[
        origin.column + direction.columnDirection
      ]?.playerPiece === null;
    const pieceInBetween =
      cellCollection[origin.row + opponentPieceDirection.rowDirection]?.[
        origin.column + opponentPieceDirection.columnDirection
      ]?.playerPiece ?? null;
    const indexToCheck = pieceInBetween?.playerIndex ?? null;
    const opponentPieceInBetween =
      indexToCheck !== null && indexToCheck !== currentPlayerIndex;
    if (targetSquareFree && opponentPieceInBetween) {
      return true;
    }
  }
  return false;
};

const generateStrikeValidDirections = (
  direction: PiecesDirection,
  moveMode: MoveMode
): {
  [k: string]: {
    direction: Direction;
    opponentPieceDirection: Direction;
  };
} => {
  const directions = getRegularDirections();
  const validDirections: {
    [k: string]: {
      direction: Direction;
      opponentPieceDirection: Direction;
    };
  } = {};
  let directionKeys: Array<keyof Directions> = [];
  if (moveMode === MoveMode.ALREADY_STRIKED || moveMode === MoveMode.KING) {
    directionKeys = ["leftUp", "rightUp", "leftDown", "rightDown"];
  } else {
    directionKeys =
      direction === PiecesDirection.DOWN
        ? ["leftUp", "rightUp"]
        : ["leftDown", "rightDown"];
  }
  for (const directionKey of directionKeys) {
    const direction = directions[directionKey];
    const opponentPieceDirection = { ...direction };
    direction.columnDirection *= 2;
    direction.rowDirection *= 2;
    const movementKey = generateMovementKey(
      direction.rowDirection,
      direction.columnDirection
    );
    validDirections[movementKey] = {
      direction,
      opponentPieceDirection,
    };
  }
  return validDirections;
};

export const movePieceValidation = (
  movePiecePayload: OriginTargetPayload,
  player: CheckersPlayer,
  cellCollection: CellCollection<CheckersPiece>,
  moveMode: MoveMode
): {
  valid: boolean;
  error: string;
  validSquare: boolean;
} => {
  if (player.direction === null) {
    return {
      valid: false,
      error: "Invalid move direction for player.",
      validSquare: false,
    };
  }
  const validDirections = generateValidDirections(player.direction, moveMode);
  const payloadMovementKey = getMovementKeyForPayload(movePiecePayload);
  if (!validDirections[payloadMovementKey]) {
    return {
      valid: false,
      error: "That move is not valid.",
      validSquare: false,
    };
  }
  const target = movePiecePayload.target;
  const targetCell = cellCollection[target.row]?.[target.column];
  if (!targetCell) {
    return {
      valid: false,
      error: "A non existing square was selected.",
      validSquare: false,
    };
  }
  const targetCellPiece = targetCell.playerPiece;
  if (targetCellPiece) {
    return {
      valid: false,
      error: "A piece of the opponent is already on that square.",
      validSquare: true,
    };
  }

  return {
    valid: true,
    error: "",
    validSquare: true,
  };
};

export const strikeOpponentPieceValidation = (
  movePiecePayload: OriginTargetPayload,
  currentPlayerIndex: number,
  player: CheckersPlayer,
  targetPiece: CheckersPiece,
  removePieces: Array<{ row: number; column: number }>,
  cellCollection: CellCollection<CheckersPiece>
): {
  valid: boolean;
  error: string;
  validSquare: boolean;
} => {
  if (player.direction === null) {
    return {
      valid: false,
      error: "Invalid move direction for opponent.",
      validSquare: false,
    };
  }
  const validDirections = generateStrikeValidDirections(
    player.direction,
    targetPiece.moveMode
  );
  const payloadMovementKey = getMovementKeyForPayload(movePiecePayload);
  const validDirection = validDirections[payloadMovementKey];
  if (!validDirection) {
    return {
      valid: false,
      error: "That move is not valid.",
      validSquare: false,
    };
  }
  const target = movePiecePayload.target;
  const targetCell = cellCollection[target.row]?.[target.column];
  if (!targetCell) {
    return {
      valid: false,
      error: "A non existing square was selected.",
      validSquare: false,
    };
  }
  const targetCellPiece = cellCollection[target.row][target.column].playerPiece;
  if (targetCellPiece) {
    return {
      valid: false,
      error: "A piece of the opponent is already on that square.",
      validSquare: true,
    };
  }

  if (
    !verifyOpponentPieceInBetween(
      currentPlayerIndex,
      movePiecePayload.origin,
      validDirection.opponentPieceDirection,
      cellCollection,
      removePieces
    )
  ) {
    return {
      valid: false,
      error: "There is no opponent piece in between.",
      validSquare: true,
    };
  }

  return {
    valid: true,
    error: "",
    validSquare: true,
  };
};

const verifyOpponentPieceInBetween = (
  currentPlayerIndex: number,
  origin: { row: number; column: number },
  opponentPieceDirection: Direction,
  cellCollection: CellCollection<CheckersPiece>,
  removePieces: Array<{ row: number; column: number }>
): boolean => {
  const targetRow = origin.row + opponentPieceDirection.rowDirection;
  const targetColumn = origin.column + opponentPieceDirection.columnDirection;
  const cell = cellCollection[targetRow]?.[targetColumn] ?? null;
  if (!cell) {
    return false;
  }
  const cellPlayerIndex = cell.playerPiece?.playerIndex ?? null;
  if (cellPlayerIndex === null) {
    return false;
  }
  if (cellPlayerIndex === currentPlayerIndex) {
    return false;
  }
  removePieces.push({ row: targetRow, column: targetColumn });
  return true;
};

const getMovementKeyForPayload = (movePiecePayload: OriginTargetPayload) => {
  const origin = movePiecePayload.origin;
  const target = movePiecePayload.target;
  const deltaRow = target.row - origin.row;
  const deltaColumn = target.column - origin.column;
  return generateMovementKey(deltaRow, deltaColumn);
};

const generateMovementKey = (row: number, column: number) => {
  return `${row}-${column}`;
};

export const getRegularDirections = (): Directions => {
  const leftUp = {
    rowDirection: 1,
    columnDirection: -1,
  };
  const rightUp = {
    rowDirection: 1,
    columnDirection: 1,
  };
  const leftDown = {
    rowDirection: -1,
    columnDirection: -1,
  };
  const rightDown = {
    rowDirection: -1,
    columnDirection: 1,
  };
  return {
    leftUp,
    rightUp,
    leftDown,
    rightDown,
  };
};

export const determineGameOver = (
  cellCollection: CellCollection<CheckersPiece>,
  playerIndexToCheck: number,
  player: CheckersPlayer
): boolean => {
  const playerPieceCells: Array<Cell<CheckersPiece>> = [];
  for (const rows of Object.values(cellCollection)) {
    for (const column of Object.values(rows)) {
      if (column.playerPiece?.playerIndex === playerIndexToCheck) {
        playerPieceCells.push(column);
      }
    }
  }
  if (playerPieceCells.length === 0) {
    return true;
  }

  for (const playerPieceCell of playerPieceCells) {
    const playerPiece = playerPieceCell.playerPiece;
    if (!playerPiece || player.direction === null) {
      continue;
    }
    const validDirections = generateValidDirections(
      player.direction,
      playerPiece.moveMode
    );
    const regularPayloads = createDirectionPayloads(
      playerPieceCell,
      Object.values(validDirections)
    );
    for (const payload of regularPayloads) {
      const { valid } = movePieceValidation(
        payload,
        player,
        cellCollection,
        playerPiece.moveMode
      );
      if (valid) {
        return false;
      }
    }
    const strikePayloads = createDirectionPayloads(
      playerPieceCell,
      Object.values(validDirections),
      true
    );
    for (const payload of strikePayloads) {
      const removePieces: Array<{ row: number; column: number }> = [];
      const { valid } = strikeOpponentPieceValidation(
        payload,
        playerIndexToCheck,
        player,
        playerPiece,
        removePieces,
        cellCollection
      );
      if (valid) {
        return false;
      }
    }
  }
  return true;
};

const createDirectionPayloads = (
  cell: Cell<CheckersPiece>,
  directions: Array<Direction>,
  strikeValidation: boolean = false
): Array<OriginTargetPayload> => {
  const payloads: Array<OriginTargetPayload> = [];
  for (const direction of directions) {
    let directionRow = direction.rowDirection;
    let directionColumn = direction.columnDirection;
    if (strikeValidation) {
      directionRow *= 2;
      directionColumn *= 2;
    }
    payloads.push({
      origin: {
        row: cell.row,
        column: cell.column,
      },
      target: {
        row: cell.row + directionRow,
        column: cell.column + directionColumn,
      },
    });
  }
  return payloads;
};
