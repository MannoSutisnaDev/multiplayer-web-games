import { GameToBeDeleted } from "@/server/games/base/BaseGameModel";
import {
  GenericErrorResponseFunction,
  GenericResponseError,
} from "@/shared/types/socket-communication/general";

export const MovePiece = "MovePiece";
export const ReadyToPlay = "ReadyToPlay";
export const LeaveGame = "LeaveGame";
export const Test = "Test";

export const RequestGameStateUpdate = "RequestGameStateUpdate";
export const CheckersGameStateUpdateResponse =
  "CheckersGameStateUpdateResponse";

export const PhaseIdCheckers = "checkers";

export interface OriginTargetPayload {
  origin: {
    row: number;
    column: number;
  };
  target: {
    row: number;
    column: number;
  };
}

export interface GameData {
  initialized: boolean;
  variable: string;
}

export interface PhaseCheckersTypes {
  ClientToServer: {
    [MovePiece]: (payload: OriginTargetPayload) => void;
    [ReadyToPlay]: () => void;
    [LeaveGame]: () => void;
    [RequestGameStateUpdate]: () => void;
    [Test]: (text: string) => void;
  };
  ServerToClient: {
    [CheckersGameStateUpdateResponse]: ({
      gameData,
      gameToBeDeleted,
    }: {
      gameData: GameData;
      gameToBeDeleted: GameToBeDeleted;
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
