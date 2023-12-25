import { SocketServerSide } from "@/server/types";
import { PlayerState } from "@/shared/types/socket-communication/games/chess";
import {
  CellCollection,
  CheckersPiece,
  ChessPiece,
  GamePosition,
  PiecesDirection,
  PlayableCells,
} from "@/shared/types/socket-communication/games/game-types";

export interface BasePlayerModelInterface {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
}

export interface ChessBoardPlayerInterface extends BasePlayerModelInterface {
  direction: PiecesDirection | null;
}

export interface CheckersPlayerInterface extends ChessBoardPlayerInterface {
  pieceThatHasStrikedPosition: GamePosition | null;
}

export interface ChessPlayerInterface extends ChessBoardPlayerInterface {
  state: PlayerState;
}

export interface DeleteTimeoutReference {
  seconds: number;
  maxSeconds: number;
  deleteGameType: DeleteGameTypes;
  reference: NodeJS.Timeout | null;
}

export interface PlayerData {
  id: string;
  name: string;
}

export enum DeleteGameTypes {
  Disconnected = "Disconnected",
  PlayersLeft = "PlayersLeft",
  GameOver = "GameOver",
}

export interface BaseGameModelInterface<
  PlayerInterface extends BasePlayerModelInterface = BasePlayerModelInterface,
> {
  id: string;
  players: PlayerInterface[];
  gameStarted: boolean;
  gameStateModifiers: Record<string, GameStateModifier>;
  deleteTimeoutReference: DeleteTimeoutReference | null;
  spectators: PlayerData[];
}

export interface CheckersGameInterface
  extends BaseGameModelInterface<CheckersPlayerInterface> {
  cells: CellCollection<CheckersPiece>;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;
  playableCells: PlayableCells;
}

export interface ChessGameInterface
  extends BaseGameModelInterface<ChessPlayerInterface> {
  cells: CellCollection<ChessPiece>;
  currentPlayerIndex: number;
  gameOver: {
    playerThatWonIndex: number;
    returnToLobbyTime: number;
  } | null;
}

export interface InterruptingMessage {
  title: string;
  message: string;
}

export interface BaseGameDataInterface {
  interruptingMessage: InterruptingMessage | null;
  spectators: PlayerData[];
}

export interface CheckersGameDataInterface extends BaseGameDataInterface {
  players: CheckersPlayerInterface[];
  cells: CellCollection<CheckersPiece>;
  currentPlayerIndex: number;
  selfPlayerIndex: number;
  interruptingMessage: {
    title: string;
    message: string;
  } | null;
}

export interface ChessGameDataInterface extends BaseGameDataInterface {
  players: ChessPlayerInterface[];
  cells: CellCollection<ChessPiece>;
  currentPlayerIndex: number;
  selfPlayerIndex: number;
  interruptingMessage: {
    title: string;
    message: string;
  } | null;
}

export type GameStateModifier = <
  GameDataInterface extends BaseGameDataInterface,
>(
  socket: SocketServerSide,
  data: GameDataInterface
) => void;
