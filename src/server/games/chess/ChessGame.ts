import BaseGameModel from "@/server/games/base/BaseGameModel";
import { repository } from "@/server/games/chess/ChessRepository";
import Cell from "@/server/games/chess/models/ChessCell";
import ChessPlayer from "@/server/games/chess/models/ChessPlayer";
import type BasePiece from "@/server/games/chess/models/pieces/BasePiece";
import type King from "@/server/games/chess/models/pieces/King";
import type Pawn from "@/server/games/chess/models/pieces/Pawn";
import {
  FetchGame,
  PLAYER_ONE_PIECES,
  PLAYER_TWO_PIECES,
  PlayerPiecesCollection,
  ValidPositionCollection,
} from "@/server/games/chess/types";
import {
  checkValidMovesForAllPieces,
  determineCheckedAfterMove,
  determinePlayerState,
} from "@/server/games/chess/utils/determine-players-state";
import { PieceBuilder } from "@/server/games/chess/utils/general";
import {
  checkScenario1,
  knightQueenScenario,
} from "@/server/games/chess/utils/place-pieces";
import {
  ChessGameDataInterface,
  ChessGameInterface,
  ChessPlayerInterface,
  DeleteGameTypes,
  GameStateModifier,
  InterruptingMessage,
  PlayerData,
} from "@/server/games/types";
import { SocketServerSide } from "@/server/types";
import {
  PIECE_TYPES,
  PlayerState,
} from "@/shared/types/socket-communication/games/chess";
import {
  Cell as CellType,
  CellCollection,
  ChessPiece,
  COLUMNS,
  OriginTargetPayload,
  PiecesDirection,
  ROWS,
} from "@/shared/types/socket-communication/games/game-types";

export default class ChessGame extends BaseGameModel<
  ChessGameInterface,
  ChessPlayer,
  ChessGameDataInterface
> {
  cells: CellCollection<ChessPiece>;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;

  constructor(key: string, players: PlayerData[]) {
    super(key, players);
    this.currentPlayerIndex = 0;
    this.cells = this.createCellCollection();
    this.gameOver = null;
    this.initializeGame();
  }

  initializeGame() {
    const player1 = this.players[0];
    const player2 = this.players[1];
    if (!player1 || !player2) {
      return;
    }
    this.placeAllPieces(this.cells);
    player1.setDirection(PiecesDirection.UP);
    player2.setDirection(PiecesDirection.DOWN);
  }

  createCellCollection(): CellCollection<ChessPiece> {
    const cellCollection: CellCollection<ChessPiece> = [];
    let index = 0;
    for (let row = 0; row < ROWS; row++) {
      const rows: Array<Cell> = [];
      for (let column = 0; column < COLUMNS; column++) {
        rows.push(new Cell(index, row, column));
        index++;
      }
      cellCollection.push(rows);
    }
    return cellCollection;
  }

  placeAllPieces(cellCollection: CellCollection<ChessPiece>) {
    this.placePlayerOnePieces(cellCollection);
    this.placePlayerTwoPieces(cellCollection);
  }

  placePlayerOnePieces(cellCollection: CellCollection<ChessPiece>) {
    this.placePiecsForPlayer(0, 6, cellCollection, PLAYER_ONE_PIECES);
  }

  placePlayerTwoPieces(cellCollection: CellCollection<ChessPiece>) {
    this.placePiecsForPlayer(1, 0, cellCollection, PLAYER_TWO_PIECES);
  }

  placePiecsForPlayer(
    playerIndex: number,
    rowIndex: number,
    cellCollection: CellCollection<ChessPiece>,
    playerPiecesCollection: PlayerPiecesCollection
  ) {
    for (const pieces of playerPiecesCollection) {
      let columnIndex = 0;
      for (const pieceType of pieces) {
        // if (
        //   ![
        //     PIECE_TYPES.KING,
        //     PIECE_TYPES.ROOK,
        //     PIECE_TYPES.QUEEN,
        //     PIECE_TYPES.BISHOP,
        //   ].includes(pieceType)
        // ) {
        //   columnIndex++;
        //   continue;
        // }
        cellCollection[rowIndex][columnIndex].playerPiece = PieceBuilder(
          pieceType,
          rowIndex,
          columnIndex,
          playerIndex,
          this.generateFetchGameFunction()
        );
        columnIndex++;
      }
      rowIndex++;
    }
  }

  destroyGame() {
    repository.delete(this);
  }

  rebuildImplementation(data: ChessGameInterface): void {
    this.id = data.id;
    this.gameStarted = data.gameStarted;
    const players: ChessPlayer[] = [];
    for (const player of data.players) {
      const chessPlayer = new ChessPlayer();
      chessPlayer.rebuild(player);
      players.push(chessPlayer);
    }
    this.players = players;
    this.cells = this.buildCells(data.cells);
    this.currentPlayerIndex = data.currentPlayerIndex;
    this.gameOver = data.gameOver;
    this.gameStarted = data.gameStarted;
  }

  buildCells(cells: CellCollection<ChessPiece>) {
    const newCells: CellCollection<ChessPiece> = [];
    let index = 0;
    for (const data of cells) {
      const newColumnCells: Array<CellType<ChessPiece>> = [];
      for (const cell of data) {
        const newCell = new Cell(index, cell.row, cell.column);
        if (cell.playerPiece) {
          const piece = PieceBuilder(
            cell.playerPiece.type,
            cell.row,
            cell.column,
            cell.playerPiece.playerIndex,
            this.generateFetchGameFunction(),
            true
          );
          piece.rebuild(cell.playerPiece);
          newCell.setPiece(piece);
        }
        newColumnCells.push(newCell);
        index++;
      }
      newCells.push(newColumnCells);
    }
    return newCells;
  }

  createState(): ChessGameInterface {
    const players = this.players.map((player) => {
      const playerData: ChessPlayerInterface = {
        id: player.id,
        name: player.name,
        ready: player.ready,
        connected: player.connected,
        direction: player.direction,
        state: player.state,
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
      gameStarted: this.gameStarted,
      players,
      gameStateModifiers: {},
      deleteTimeoutReference,
    };
  }

  initializePlayers(players: PlayerData[]): void {
    const gamePlayers: ChessPlayer[] = [];
    for (const player of players) {
      gamePlayers.push(new ChessPlayer(player.id, player.name));
    }
    this.players = gamePlayers;
  }

  startGame(): void {}

  createGameStateImplementation(
    socket: SocketServerSide
  ): ChessGameDataInterface {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    return {
      players: this.players,
      cells: this.getCells(this.sendCellsMirrored(selfPlayerIndex)),
      currentPlayerIndex: this.currentPlayerIndex,
      interruptingMessage: null,
      selfPlayerIndex,
    };
  }

  getCells(mirrored = false): CellCollection<ChessPiece> {
    if (mirrored) {
      return this.getCellsMirrored();
    }
    return this.cells;
  }

  sendCellsMirrored(playerIndex: number) {
    return playerIndex === 1;
  }

  getCellsMirrored(): CellCollection<ChessPiece> {
    const boardRows: CellCollection<ChessPiece> = [];
    for (let rowIndex = this.cells.length - 1; rowIndex >= 0; rowIndex--) {
      const columns = this.cells[rowIndex];
      const boardColumns: Array<CellType<ChessPiece>> = [];
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

  sendGameStatePayload(
    socket: SocketServerSide,
    gameData: ChessGameDataInterface
  ): void {
    const selfPlayerIndex = this.getPlayerIndexViaSocket(socket);
    if (selfPlayerIndex === -1) {
      return;
    }
    socket.emit("ChessGameStateUpdateResponse", {
      gameData,
    });
  }

  movePiece(
    socket: SocketServerSide,
    originTargetPayload: OriginTargetPayload
  ) {
    try {
      const playerIndex = this.players.findIndex(
        (gamePlayer) => gamePlayer.id === socket.data.sessionId
      );
      if (playerIndex !== this.currentPlayerIndex) {
        throw new Error("It's not your turn");
      }

      const { row: originRow, column: originColumn } =
        originTargetPayload.origin;
      const cell = this.cells?.[originRow]?.[originColumn];

      if (!cell) {
        throw new Error("Could not find cell");
      } else if (!cell.playerPiece) {
        throw new Error("No piece on the selected cell");
      }

      const piece = cell.playerPiece;
      const player = this.players[playerIndex];

      const { row: targetRow, column: targetColumn } =
        originTargetPayload.target;

      if (targetRow === originRow && targetColumn === originColumn) {
        return;
      }

      const convertedPiece = piece as BasePiece;

      console.log("BEFORE VALIDATE!");

      const validMove = convertedPiece.validateMove(targetRow, targetColumn);
      if (!validMove) {
        throw new Error(
          `This move is not valid for piece: '${convertedPiece.getType()}'`
        );
      }

      console.log({ validMove });

      if (cell.playerPiece.type !== PIECE_TYPES.KING) {
        if (
          determineCheckedAfterMove(
            this,
            this.currentPlayerIndex,
            convertedPiece,
            targetRow,
            targetColumn
          )
        ) {
          throw new Error("This move will get you checked.");
        }
        player.state = PlayerState.Regular;
      }
      this.movePieceAction(originTargetPayload);
      this.sendGameState();
    } catch (e) {
      if (e instanceof Error && e.message) {
        console.error(e);
        socket.emit("GenericResponseError", {
          error: e.message,
        });
      }
    }
  }

  movePieceAction(originTargetPayload: OriginTargetPayload): void {
    if (this.gameOver) {
      return;
    }
    const originRow = originTargetPayload.origin.row;
    const originColumn = originTargetPayload.origin.column;
    const originCell = this.cells[originRow][originColumn];
    const piece = originCell?.playerPiece as BasePiece;

    const targetRow = originTargetPayload.target.row;
    const targetColumn = originTargetPayload.target.column;

    if (!piece) {
      return;
    }

    if (piece.playerIndex !== this.currentPlayerIndex) {
      throw new Error(`This is not your piece`);
    }

    if (piece.type === PIECE_TYPES.KING && (piece as King).performCastle) {
      this.performCastle(
        piece,
        originRow,
        originColumn,
        targetRow,
        targetColumn
      );
    } else {
      this.regularMove(piece, originRow, originColumn, targetRow, targetColumn);
    }

    let nextPlayerIndex = this.currentPlayerIndex + 1;
    const endIndex = this.players.length - 1;
    if (nextPlayerIndex > endIndex) {
      nextPlayerIndex = 0;
    }
    this.currentPlayerIndex = nextPlayerIndex;

    const currentPlayerState = determinePlayerState(
      this,
      this.currentPlayerIndex
    );

    this.players[this.currentPlayerIndex].setState(currentPlayerState);

    if (currentPlayerState !== PlayerState.CheckMate) {
      return;
    }

    this.gameOver = {
      playerThatWonIndex: this.currentPlayerIndex,
      returnToLobbyTime: 60,
    };
    this.scheduleDeleteGameOver(this.gameOver.returnToLobbyTime);
  }

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
    const secondsLeft = this.getSecondsLeftDeleteTimeoutReference();
    const winningPlayer = this.players[playerWhoWonIndex];
    const player = this.players[playerSelfIndex];
    const winMessage =
      winningPlayer.id === player.id
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
    this.scheduleDelete(DeleteGameTypes.GameOver, func, deleteAfterSeconds);
  }

  getAllValidMovesForPlayer(
    playerIndex: number,
    projectedCells?: CellCollection<ChessPiece>,
    excludePieces?: PIECE_TYPES[]
  ): ValidPositionCollection {
    return checkValidMovesForAllPieces(
      this,
      playerIndex,
      projectedCells,
      excludePieces
    );
  }

  getPreviousPlayerIndex(indexToStartFrom?: number): number {
    let newPlayerIndex =
      typeof indexToStartFrom === "number"
        ? indexToStartFrom - 1
        : this.currentPlayerIndex - 1;
    const endIndex = this.players.length - 1;
    if (newPlayerIndex < 0) {
      newPlayerIndex = endIndex;
    }
    return newPlayerIndex;
  }

  generateFetchGameFunction(): FetchGame {
    return () => {
      return this;
    };
  }

  copyCellCollection(): CellCollection<ChessPiece> {
    const cellCollection: CellCollection<ChessPiece> = [];
    let cellIndex = 0;
    for (const columns of this.cells) {
      const arrayCells: Array<Cell> = [];
      for (const column of columns) {
        const cell = new Cell(cellIndex, column.row, column.column);
        const piece = column.playerPiece;
        if (piece) {
          let hasMoved = false;
          if (
            piece.type === PIECE_TYPES.PAWN ||
            piece.type === PIECE_TYPES.ROOK ||
            piece.type === PIECE_TYPES.KING
          ) {
            const convertedPiece = piece as King;
            hasMoved = convertedPiece.hasMoved;
          }
          const newPiece = PieceBuilder(
            piece.type,
            piece.row,
            piece.column,
            piece.playerIndex,
            this.generateFetchGameFunction(),
            hasMoved
          );
          cell.setPiece(newPiece);
        }
        arrayCells.push(cell);
        cellIndex++;
      }
      cellCollection.push(arrayCells);
    }
    return cellCollection;
  }

  projectMove(
    piece: BasePiece,
    targetRow: number,
    targetColumn: number
  ): CellCollection<ChessPiece> {
    const projectedCells = this.copyCellCollection();
    this.regularMove(
      piece,
      piece.row,
      piece.column,
      targetRow,
      targetColumn,
      projectedCells
    );
    return projectedCells;
  }

  regularMove(
    piece: BasePiece,
    originRow: number,
    originColumn: number,
    targetRow: number,
    targetColumn: number,
    projectedCells?: CellCollection<ChessPiece>
  ) {
    const cellCollection = projectedCells ?? this.cells;
    const targetCell = cellCollection[targetRow][targetColumn];
    let type = piece.type;
    if (piece.type === PIECE_TYPES.PAWN) {
      const pawnPiece = piece as Pawn;
      if (pawnPiece.hasReachedEndOfBoard) {
        type = PIECE_TYPES.QUEEN;
      }
    }
    targetCell.playerPiece = PieceBuilder(
      type,
      targetRow,
      targetColumn,
      piece.playerIndex,
      this.generateFetchGameFunction(),
      true
    );
    const originCell = cellCollection[originRow][originColumn];
    originCell.playerPiece = null;
  }

  performCastle(
    piece: BasePiece,
    originRow: number,
    originColumn: number,
    targetRow: number,
    targetColumn: number
  ): void {
    this.regularMove(piece, originRow, originColumn, targetRow, targetColumn);

    const kingPiece = piece as King;

    const castleData = kingPiece.performCastle;
    if (!castleData) {
      return;
    }
    const rook = this.cells[castleData.row][castleData.column].playerPiece;
    if (!rook) {
      return;
    }
    this.regularMove(
      rook as BasePiece,
      castleData.row,
      castleData.column,
      castleData.row,
      castleData.column + castleData.columnAdjustment
    );
    kingPiece.performCastle = null;
  }
}
