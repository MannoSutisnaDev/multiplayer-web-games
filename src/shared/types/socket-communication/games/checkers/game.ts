import {
  GenericErrorResponseFunction,
  GenericResponseError,
} from "@/shared/types/socket-communication/general";

export const MovePiece = "MovePiece";
export const ReadyToPlay = "ReadyToPlay";
export const LeaveGame = "LeaveGame";

export const GameStateUpdateResponse = "GameStateUpdateResponse";

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

export interface PhaseCheckersTypes {
  ClientToServer: {
    [MovePiece]: (payload: OriginTargetPayload) => void;
    [ReadyToPlay]: () => void;
    [LeaveGame]: () => void;
  };
  ServerToClient: {
    [GameStateUpdateResponse]: ({ data }: any) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
