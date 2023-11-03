import {
  GenericErrorResponseFunction,
  GenericResponseError,
} from "@/shared/types/socket-communication/general";

export const MovePiece = "MovePiece";
export const GameStateUpdateResponse = "GameStateUpdateResponse";

export const PhaseIdCheckers = "checkers";

interface OriginTargetPayload {
  origin: {
    row: number;
    column: number;
  };
  target: {
    row: number;
    column: number;
  };
}

export interface PhaseEnterUsernameTypes {
  ClientToServer: {
    [MovePiece]: ({ origin, target }: OriginTargetPayload) => void;
  };
  ServerToClient: {
    [GameStateUpdateResponse]: ({ data }: any) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
