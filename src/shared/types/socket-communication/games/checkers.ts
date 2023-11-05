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
      initialized,
    }: {
      initialized: boolean;
      variable: string;
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
