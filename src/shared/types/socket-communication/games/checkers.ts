import { GameToBeDeleted } from "@/server/games/base/BaseGameModel";
import { GameDataInterface } from "@/server/games/checkers/CheckersGame";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/game-types";
import {
  GenericErrorResponseFunction,
  GenericResponseError,
} from "@/shared/types/socket-communication/general";

export const MovePiece = "MovePiece";
export const ReadyToPlay = "ReadyToPlay";
export const LeaveGame = "LeaveGame";

export const RequestGameStateUpdate = "RequestGameStateUpdate";
export const CheckersGameStateUpdateResponse =
  "CheckersGameStateUpdateResponse";

export const PhaseIdCheckers = "checkers";

export interface PhaseCheckersTypes {
  ClientToServer: {
    [MovePiece]: (payload: OriginTargetPayload) => void;
    [ReadyToPlay]: () => void;
    [LeaveGame]: () => void;
    [RequestGameStateUpdate]: () => void;
  };
  ServerToClient: {
    [CheckersGameStateUpdateResponse]: ({
      gameToBeDeleted,
      gameData,
    }: {
      gameToBeDeleted: GameToBeDeleted;
      gameData: GameDataInterface;
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
