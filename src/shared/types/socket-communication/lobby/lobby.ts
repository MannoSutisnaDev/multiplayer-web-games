import {
  GameTypes,
  GenericErrorResponseFunction,
  GenericResponseError,
} from "../general";

export const LeaveLobby = "LeaveLobby";
export const SetReady = "SetReady";
export const SetReadyResponseSuccess = "SetReadyResponseSuccess";
export const StartGame = "StartGame";
export const EditLobby = "EditLobby";
export const EditLobbyResponseSuccess = "EditLobbyResponseSuccess";
export const EditLobbyResponseError = "EditLobbyResponseError";
export const KickUser = "KickUser";
export const SetNewOwner = "SetNewOwner";

export const RequestUpdateLobby = "RequestUpdateLobby";
export const UpdateLobbyResponse = "UpdateLobbyResponse";

export const PhaseIdLobby = "lobby";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

export interface PhaseLobbyTypes {
  ClientToServer: {
    [LeaveLobby]: () => void;
    [SetReady]: ({ ready }: { ready: boolean }) => void;
    [StartGame]: () => void;
    [EditLobby]: ({
      lobbyName,
      gameType,
    }: {
      lobbyName: string;
      gameType: GameTypes;
    }) => void;
    [KickUser]: ({ userId }: { userId: string }) => void;
    [SetNewOwner]: ({ userId }: { userId: string }) => void;
    [RequestUpdateLobby]: () => void;
  };
  ServerToClient: {
    [GenericResponseError]: GenericErrorResponseFunction;
    [EditLobbyResponseError]: GenericErrorResponseFunction;
    [SetReadyResponseSuccess]: () => void;
    [EditLobbyResponseSuccess]: () => void;
    [UpdateLobbyResponse]: ({
      lobby,
    }: {
      lobby: LobbyWithGameTypeAndUsers;
    }) => void;
  };
}
