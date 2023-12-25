import BaseGameModel from "@/server/games/base/BaseGameModel";
import Piece from "@/server/games/checkers/CheckersPiece";
import CheckersPlayer from "@/server/games/checkers/CheckersPlayer";
import { repository } from "@/server/games/checkers/CheckersRepository";
import {
  canStrikeOtherOpponentPiece,
  determineGameOver,
  validateMove,
} from "@/server/games/checkers/utils";
import {
  CheckersGameDataInterface,
  CheckersGameInterface,
  CheckersPlayerInterface,
  DeleteGameTypes,
  GameStateModifier,
  InterruptingMessage,
  PlayerData,
} from "@/server/games/types";
import { deleteGameAndReturnToLobby } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import {
  Cell,
  CellCollection,
  CheckersPiece,
  COLUMNS,
  MoveMode,
  OriginTargetPayload,
  Piece as PieceInterface,
  PiecesDirection,
  PlayableCells,
  PLAYER_PIECES,
  ROWS,
} from "@/shared/types/socket-communication/games/game-types";

export default class CheckersGame extends BaseGameModel<
  CheckersGameInterface,
  CheckersPlayer,
  CheckersGameDataInterface
> {
  cells: CellCollection<CheckersPiece>;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;
  playableCells: PlayableCells;

  constructor(key: string, players: PlayerData[], spectators: PlayerData[]) {
    super(key, players, spectators);
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
      checkersPlayer.rebuild(player);
      players.push(checkersPlayer);
    }
    this.players = players;
    this.spectators = data.spectators;
    this.cells = this.buildCells(data.cells);
    this.currentPlayerIndex = data.currentPlayerIndex;
    this.gameOver = data.gameOver;
    this.playableCells = this.determinePlayableCells();
    this.gameStarted = data.gameStarted;
  }

  buildCells(cells: CellCollection<CheckersPiece>) {
    for (const data of cells) {
      for (const cell of data) {
        if (cell.playerPiece) {
          const piece = new Piece();
          piece.rebuild(cell.playerPiece);
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
    let deleteTimeoutReference = null;
    if (this.deleteTimeoutReference) {
      deleteTimeoutReference = {
        ...this.deleteTimeoutReference,
        reference: null,
      };
    }
    return {
      id: this.id,
      cells: this.cells,
      currentPlayerIndex: this.currentPlayerIndex,
      gameOver: this.gameOver,
      playableCells: [],
      gameStarted: this.gameStarted,
      players,
      spectators: this.spectators,
      gameStateModifiers: {},
      deleteTimeoutReference,
    };
  }

  initializePlayers(players: PlayerData[]): void {
    const gamePlayers: CheckersPlayer[] = [];
    for (const player of players) {
      gamePlayers.push(new CheckersPlayer(player.id, player.name));
    }
    this.players = gamePlayers;
  }

  initializeDeleteGameTimeoutSpecific(
    deleteGameType: DeleteGameTypes,
    secondsLeft: number
  ) {
    switch (deleteGameType) {
      case DeleteGameTypes.GameOver:
        this.scheduleDeleteGameOver(secondsLeft);
        break;
    }
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

  generateCells(): CellCollection<CheckersPiece> {
    let index = 1;
    const cellCollection: CellCollection<CheckersPiece> = [];
    for (let row = 0; row < ROWS; row++) {
      const cellCollectionRow: Array<Cell<CheckersPiece>> = [];
      for (let column = 0; column < COLUMNS; column++) {
        const cell: Cell<CheckersPiece> = {
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
    collection: CellCollection<CheckersPiece>,
    playableCells: PlayableCells
  ): void {
    if (playerIndex === 1) {
      for (let i = 0; i < PLAYER_PIECES; i++) {
        const playableCell = playableCells[i];
        collection[playableCell.row][playableCell.column].playerPiece =
          this.generatePiece(i, playerIndex);
        break;
      }
    } else {
      let endIndex = playableCells.length - 1;
      for (let i = PLAYER_PIECES - 1; i >= 0; i--) {
        const playableCell = playableCells[endIndex - i];
        collection[playableCell.row][playableCell.column].playerPiece =
          this.generatePiece(i, playerIndex);
        break;
      }
    }
  }

  startGame(): void {}

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
      if (e instanceof Error && e.message) {
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
      if (dontSetNextTurn) {
        this.players[this.currentPlayerIndex].setPieceThatHasStrikedPosition({
          row: originTargetPayload.target.row,
          column: originTargetPayload.target.column,
        });
      } else {
        this.players[this.currentPlayerIndex].setPieceThatHasStrikedPosition(
          null
        );
      }
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
        returnToLobbyTime: 10,
      };
      this.scheduleDeleteGameOver(this.gameOver.returnToLobbyTime);
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

  createGameStateImplementation(
    socket: SocketServerSide
  ): CheckersGameDataInterface {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    const isSpectator = !!this.spectators.filter(
      (spectator) => spectator.id === socket.data.sessionId
    )[0];

    return {
      players: this.players,
      cells: this.getCells(
        this.sendCellsMirrored(isSpectator ? 0 : selfPlayerIndex)
      ),
      currentPlayerIndex: this.currentPlayerIndex,
      interruptingMessage: null,
      spectators: this.spectators,
      selfPlayerIndex: isSpectator ? 0 : selfPlayerIndex,
    };
  }

  sendGameStatePayload(
    socket: SocketServerSide,
    gameData: CheckersGameDataInterface
  ): void {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    if (selfPlayerIndex === -1) {
      return;
    }
    socket.emit("CheckersGameStateUpdateResponse", {
      gameData,
    });
  }

  getGameOverPlayerIndexes(socket: SocketServerSide): {
    playerWhoWonIndex: number;
    playerSelfIndex: number;
  } {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    return {
      playerWhoWonIndex: this.gameOver?.playerThatWonIndex ?? -1,
      playerSelfIndex: selfPlayerIndex,
    };
  }

  createGameOverInterruptingMessage(
    socket: SocketServerSide
  ): InterruptingMessage {
    const { playerWhoWonIndex, playerSelfIndex } =
      this.getGameOverPlayerIndexes(socket);

    const isSpectator = !!this.spectators.filter(
      (spectator) => spectator.id === socket.data.sessionId
    )[0];

    const secondsLeft = this.getSecondsLeftDeleteTimeoutReference();
    const winningPlayer = this.players[playerWhoWonIndex];
    const player = this.players[playerSelfIndex];
    const winMessage =
      !isSpectator && winningPlayer.id === player.id
        ? "You won!"
        : `Player: '${winningPlayer.name}' has won!`;
    const message = `${winMessage} \n\n You will be returned to the loby in ${secondsLeft} seconds.`;
    return {
      title: winMessage,
      message,
    };
  }

  scheduleDeleteGameOver(deleteAfterSeconds: number = 10) {
    const func: GameStateModifier = (socket, gameData) => {
      gameData.interruptingMessage =
        this.createGameOverInterruptingMessage(socket);
    };
    this.scheduleDelete(
      DeleteGameTypes.GameOver,
      func,
      deleteAfterSeconds,
      () => {
        deleteGameAndReturnToLobby(this.id);
      }
    );
  }

  sendCellsMirrored(playerIndex: number) {
    return playerIndex === 1;
  }

  getCells(mirrored = false): CellCollection<CheckersPiece> {
    if (mirrored) {
      return this.getCellsMirrored();
    }
    return this.cells;
  }

  getCellsMirrored(): CellCollection<CheckersPiece> {
    const boardRows: CellCollection<CheckersPiece> = [];
    for (let rowIndex = this.cells.length - 1; rowIndex >= 0; rowIndex--) {
      const columns = this.cells[rowIndex];
      const boardColumns: Array<Cell<CheckersPiece>> = [];
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
