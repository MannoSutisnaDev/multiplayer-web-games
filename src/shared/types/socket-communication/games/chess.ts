import { ChessGameDataInterface } from "@/server/games/types";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/game-types";
import {
  GenericErrorResponseFunction,
  GenericResponseError,
} from "@/shared/types/socket-communication/general";

export const MovePiece = "MovePiece";
export const ReadyToPlay = "ReadyToPlay";
export const LeaveGame = "LeaveGame";
export const ResetGame = "ResetGame";

export const RequestGameStateUpdate = "RequestGameStateUpdate";
export const ChessGameStateUpdateResponse = "ChessGameStateUpdateResponse";

export const PhaseIdChess = "chess";

export interface PhaseChessTypes {
  ClientToServer: {
    [MovePiece]: (payload: OriginTargetPayload) => void;
    [ReadyToPlay]: () => void;
    [LeaveGame]: () => void;
    [RequestGameStateUpdate]: () => void;
    [ResetGame]: () => void;
  };
  ServerToClient: {
    [ChessGameStateUpdateResponse]: ({
      gameData,
    }: {
      gameData: ChessGameDataInterface;
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}

export enum PIECE_TYPES {
  KING = "king",
  QUEEN = "queen",
  ROOK = "rook",
  BISHOP = "bishop",
  KNIGHT = "knight",
  PAWN = "pawn",
}

export const COLUMNS = 8;
export const ROWS = 8;
export const PLAYER_PIECES = 12;

export enum PlayerState {
  Regular = "regular",
  Check = "check",
  CheckMate = "checkMate",
}
