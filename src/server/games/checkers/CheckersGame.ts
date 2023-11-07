import BaseGameModel, {
  BaseGameModelInterface,
  PlayerData,
} from "@/server/games/base/BaseGameModel";
import Piece from "@/server/games/checkers/CheckersPiece";
import CheckersPlayer, {
  CheckersPlayerInterface,
} from "@/server/games/checkers/CheckersPlayer";
import { repository } from "@/server/games/checkers/CheckersRepository";
import {
  canStrikeOtherOpponentPiece,
  determineGameOver,
  validateMove,
} from "@/server/games/checkers/utils";
import { deleteGameAndReturnToLobby } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import {
  Cell,
  CellCollection,
  MoveMode,
  OriginTargetPayload,
  Piece as PieceInterface,
  PiecesDirection,
  PlayableCells,
} from "@/shared/types/socket-communication/games/game-types";

const COLUMNS = 8;
const ROWS = 8;
const PLAYER_PIECES = 12;

export interface CheckersGameInterface
  extends BaseGameModelInterface<CheckersPlayerInterface> {
  cells: CellCollection;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;
  playableCells: PlayableCells;
}

export interface GameDataInterface {
  players: CheckersPlayerInterface[];
  cells: CellCollection;
  currentPlayerIndex: number;
  selfPlayerIndex: number;
  gameOverMessage: string | null;
}

export default class CheckersGame extends BaseGameModel<
  CheckersGameInterface,
  CheckersPlayer
> {
  cells: CellCollection;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;
  playableCells: PlayableCells;

  constructor(key: string, players: PlayerData[]) {
    super(key, players);
    this.cells = [];
    this.currentPlayerIndex = 0;
    this.gameOver = null;
    this.playableCells = [];
    this.initializeGame();
  }

  destroyGame() {
    repository.delete(this);
  }

  rebuildImplementation(data: CheckersGameInterface): void {
    this.id = data.id;
    this.gameStarted = data.gameStarted;
    const players: CheckersPlayer[] = [];
    for (const player of data.players) {
      const checkersPlayer = new CheckersPlayer();
      checkersPlayer.rebuildImplementation(player);
      players.push(checkersPlayer);
    }
    this.players = players;
    this.cells = this.buildCells(data.cells);
    this.gameToBeDeleted = null;
    this.currentPlayerIndex = data.currentPlayerIndex;
    this.gameOver = data.gameOver;
    this.playableCells = data.playableCells;
    this.gameStarted = data.gameStarted;
    this.deleteTimeoutReference = null;
  }

  buildCells(cells: CellCollection) {
    for (const data of cells) {
      for (const cell of data) {
        if (cell.playerPiece) {
          const piece = new Piece();
          piece.rebuildImplementation(cell.playerPiece);
          cell.playerPiece = piece;
        }
      }
    }
    return cells;
  }

  createState() {
    const players = this.players.map((player) => {
      const playerData: CheckersPlayerInterface = {
        id: player.id,
        name: player.name,
        ready: player.ready,
        connected: player.connected,
        direction: player.direction,
        pieceThatHasStrikedPosition: player.pieceThatHasStrikedPosition,
      };
      return playerData;
    });
    return {
      id: this.id,
      gameToBeDeleted: this.gameToBeDeleted,
      cells: this.cells,
      currentPlayerIndex: this.currentPlayerIndex,
      gameOver: this.gameOver,
      playableCells: this.playableCells,
      gameStarted: this.gameStarted,
      players,
      deleteTimeoutReference: null,
    };
  }

  initializePlayers(players: PlayerData[]): void {
    const gamePlayers: CheckersPlayer[] = [];
    for (const player of players) {
      gamePlayers.push(new CheckersPlayer(player.id, player.name));
    }
    this.players = gamePlayers;
  }

  initializeGame() {
    const player1 = this.players[0];
    const player2 = this.players[1];
    if (!player1 || !player2) {
      return;
    }
    player1.setDirection(PiecesDirection.UP);
    player2.setDirection(PiecesDirection.DOWN);
    this.cells = this.generateCells();
    this.playableCells = this.determinePlayableCells();
    this.placePieces(0, this.cells, this.playableCells);
    this.placePieces(1, this.cells, this.playableCells);
  }

  generateCells(): CellCollection {
    let index = 1;
    const cellCollection: CellCollection = [];
    for (let row = 0; row < ROWS; row++) {
      const cellCollectionRow: Array<Cell> = [];
      for (let column = 0; column < COLUMNS; column++) {
        const cell: Cell = {
          index,
          column,
          row,
          playerPiece: null,
        };
        cellCollectionRow.push(cell);
        index++;
      }
      cellCollection.push(cellCollectionRow);
    }
    return cellCollection;
  }

  determinePlayableCells(): PlayableCells {
    const playableCells: PlayableCells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        let playable = false;
        if (row % 2 !== 0) {
          playable = column % 2 !== 0;
        } else {
          playable = column % 2 === 0;
        }

        if (playable) {
          playableCells.push({
            row,
            column,
          });
        }
      }
    }
    return playableCells;
  }

  generatePiece(index: number, playerIndex: number): Piece {
    return new Piece(index, playerIndex);
  }

  placePieces(
    playerIndex: number,
    collection: CellCollection,
    playableCells: PlayableCells
  ): void {
    if (playerIndex === 1) {
      collection[6][6].playerPiece = this.generatePiece(0, playerIndex);
      // for (let i = 0; i < PLAYER_PIECES; i++) {
      //   const playableCell = playableCells[i];
      //   collection[playableCell.row][playableCell.column].playerPiece =
      //     this.generatePiece(i, playerIndex);
      // }
    } else {
      collection[7][7].playerPiece = this.generatePiece(0, playerIndex);
      // let endIndex = playableCells.length - 1;
      // for (let i = PLAYER_PIECES - 1; i >= 0; i--) {
      //   const playableCell = playableCells[endIndex - i];
      //   collection[playableCell.row][playableCell.column].playerPiece =
      //     this.generatePiece(i, playerIndex);
      // }
    }
  }

  startGame(): void {}

  getPlayerIndexViaSocket(socket: SocketServerSide): number {
    const sessionId = socket?.data?.sessionId ?? null;
    if (!sessionId) {
      return -1;
    }
    const selfPlayerIndex = this.players.findIndex(
      (player) => player.id === sessionId
    );
    return selfPlayerIndex;
  }

  movePiece(
    socket: SocketServerSide,
    originTargetPayload: OriginTargetPayload
  ) {
    const playerIndex = this.getPlayerIndexViaSocket(socket);
    if (playerIndex !== this.currentPlayerIndex) {
      socket.emit("GenericResponseError", { error: "It's not your turn." });
      return;
    }

    const { row, column } = originTargetPayload.origin;
    const cell = this.cells?.[row]?.[column];

    if (!cell) {
      socket.emit("GenericResponseError", { error: "Could not find cell" });
      return;
    } else if (!cell.playerPiece) {
      socket.emit("GenericResponseError", {
        error: "No piece on the selected cell",
      });
      return;
    }

    let validationResult: {
      removePieces: Array<{ row: number; column: number }>;
    };
    try {
      validationResult = this.movePieceValidation(
        originTargetPayload,
        cell.playerPiece
      );
    } catch (e) {
      if (e instanceof Error) {
        socket.emit("GenericResponseError", {
          error: e.message,
        });
      }
      return;
    }
    const { removePieces } = validationResult;
    this.movePieceAction(originTargetPayload, removePieces);
    this.sendGameState();
  }

  movePieceValidation(
    originTargetPayload: OriginTargetPayload,
    piece: PieceInterface
  ): {
    removePieces: Array<{ row: number; column: number }>;
  } {
    const { error, valid, removePieces } = validateMove(
      originTargetPayload,
      this.players,
      piece.playerIndex,
      this.currentPlayerIndex,
      this.cells
    );

    if (!valid) {
      throw new Error(error);
    }
    return {
      removePieces,
    };
  }

  movePieceAction(
    originTargetPayload: OriginTargetPayload,
    removePieces: Array<{ row: number; column: number }>
  ): void {
    if (this.gameOver) {
      return;
    }
    const player = this.players[this.currentPlayerIndex];
    const originRow = originTargetPayload.origin.row;
    const originColumn = originTargetPayload.origin.column;
    const originCell = this.cells[originRow][originColumn];
    const piece = originCell?.playerPiece;
    if (!piece) {
      return;
    }
    let dontSetNextTurn = false;
    if (removePieces.length > 0) {
      const pieceToRemove = removePieces[0];
      this.cells[pieceToRemove.row][pieceToRemove.column].playerPiece = null;
      originCell.playerPiece = piece;
      this.cells[originRow][originColumn] = originCell;
      dontSetNextTurn = canStrikeOtherOpponentPiece(
        originTargetPayload.target,
        this.currentPlayerIndex,
        this.cells,
        player.direction
      );
      this.players[this.currentPlayerIndex].pieceThatHasStrikedPosition = {
        row: originTargetPayload.target.row,
        column: originTargetPayload.target.column,
      };
      if (piece.moveMode !== MoveMode.KING) {
        piece.moveMode = MoveMode.ALREADY_STRIKED;
      }
    }

    const targetRow = originTargetPayload.target.row;
    const targetColumn = originTargetPayload.target.column;
    const targetCell = this.cells[targetRow][targetColumn];
    if (
      (player.direction === PiecesDirection.DOWN && targetRow === ROWS - 1) ||
      (player.direction === PiecesDirection.UP && targetRow === 0)
    ) {
      piece.moveMode = MoveMode.KING;
      this.players[this.currentPlayerIndex].pieceThatHasStrikedPosition = null;
    }
    targetCell.playerPiece = { ...piece };
    originCell.playerPiece = null;

    if (dontSetNextTurn) {
      return;
    }

    if (piece.moveMode !== MoveMode.KING) {
      targetCell.playerPiece.moveMode = MoveMode.REGULAR;
      this.cells[targetRow][targetColumn] = targetCell;
      this.players[this.currentPlayerIndex].pieceThatHasStrikedPosition = null;
    }

    const lastPlayerIndex = this.currentPlayerIndex;
    let nextPlayerIndex = this.currentPlayerIndex + 1;
    const endIndex = this.players.length - 1;
    if (nextPlayerIndex > endIndex) {
      nextPlayerIndex = 0;
    }
    this.currentPlayerIndex = nextPlayerIndex;
    const gameOver = determineGameOver(
      this.cells,
      this.currentPlayerIndex,
      this.players[this.currentPlayerIndex]
    );
    if (gameOver) {
      this.gameOver = {
        playerThatWonIndex: lastPlayerIndex,
        returnToLobbyTime: 5,
      };
      const interval = setInterval(() => {
        if (!this.gameOver) {
          return;
        }
        if (this.gameOver.returnToLobbyTime > 0) {
          this.sendGameState();
          this.gameOver.returnToLobbyTime -= 1;
          return;
        }
        this.sendGameState();
        clearInterval(interval);
        deleteGameAndReturnToLobby(this.id);
      }, 1000);
    }
  }

  createGameOverMessage = (
    playerIndexWhoWon: number,
    mainPlayerIndex: number,
    secondsLeftToReset: number
  ): string => {
    const winningPlayer = this.players[playerIndexWhoWon];
    const player = this.players[mainPlayerIndex];
    const winMessage =
      winningPlayer.id === player.id
        ? "You won!"
        : `Player: '${winningPlayer.name}' has won!`;
    return `${winMessage} \n\n You will be returned to the loby in ${secondsLeftToReset} seconds.`;
  };

  sendGameStatePayload(socket: SocketServerSide): void {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    if (selfPlayerIndex === -1) {
      return;
    }
    let gameOverMessage: string | null = null;
    if (this.gameOver) {
      gameOverMessage = this.createGameOverMessage(
        this.gameOver.playerThatWonIndex,
        selfPlayerIndex,
        this.gameOver.returnToLobbyTime
      );
    }
    socket.emit("CheckersGameStateUpdateResponse", {
      gameToBeDeleted: this.gameToBeDeleted,
      gameData: {
        players: this.players,
        cells: this.getCells(this.sendCellsMirrored(selfPlayerIndex)),
        currentPlayerIndex: this.currentPlayerIndex,
        selfPlayerIndex,
        gameOverMessage,
      },
    });
  }

  sendCellsMirrored(playerIndex: number) {
    return playerIndex === 1;
  }

  getCells(mirrored = false): CellCollection {
    if (mirrored) {
      return this.getCellsMirrored();
    }
    return this.cells;
  }

  getCellsMirrored(): CellCollection {
    const boardRows: CellCollection = [];
    for (let rowIndex = this.cells.length - 1; rowIndex >= 0; rowIndex--) {
      const columns = this.cells[rowIndex];
      const boardColumns: Array<Cell> = [];
      for (
        let columnIndex = columns.length - 1;
        columnIndex >= 0;
        columnIndex--
      ) {
        const cell = columns[columnIndex];
        boardColumns.push(cell);
      }
      boardRows.push(boardColumns);
    }
    return boardRows;
  }
}
