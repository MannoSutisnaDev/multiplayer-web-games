import { SocketServerSide } from "@/server/types";
import {
  CellCollection,
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

export interface CheckersPlayerInterface extends BasePlayerModelInterface {
  direction: PiecesDirection | null;
  pieceThatHasStrikedPosition: GamePosition | null;
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
}

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

export interface InterruptingMessage {
  title: string;
  message: string;
}

export interface BaseGameDataInterface {
  interruptingMessage: InterruptingMessage | null;
}

export interface CheckersGameDataInterface extends BaseGameDataInterface {
  players: CheckersPlayerInterface[];
  cells: CellCollection;
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
