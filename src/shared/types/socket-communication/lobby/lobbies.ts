import { GenericErrorResponseFunction } from "../general";

export const JoinLobby = "JoinLobby";
export const JoinLobbyResponseSuccess = "JoinLobbyResponseSuccess";
export const JoinLobbyResponseError = "JoinLobbyResponseError";

export const CreateLobby = "CreateLobby";
export const CreateLobbyResponseSuccess = "CreateLobbyResponseSuccess";
export const CreateLobbyResponseError = "CreateLobbyResponseError";

export const UpdateLobbiesListResponse = "UpdateLobbiesListResponse";

export const PhaseIdLobbies = "lobbies";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

import { GameTypes } from "../general";

export interface PhaseLobbiesTypes {
  ClientToServer: {
    [CreateLobby]: ({
      lobbyName,
      gameType,
    }: {
      lobbyName: string;
      gameType: GameTypes;
    }) => void;
    [JoinLobby]: ({ lobbyId }: { lobbyId: string }) => void;
  };
  ServerToClient: {
    [JoinLobbyResponseSuccess]: () => void;
    [JoinLobbyResponseError]: GenericErrorResponseFunction;
    [CreateLobbyResponseSuccess]: ({ lobbyId }: { lobbyId: string }) => void;
    [CreateLobbyResponseError]: GenericErrorResponseFunction;
    [UpdateLobbiesListResponse]: ({
      lobbies,
    }: {
      lobbies: LobbyWithGameTypeAndUsers[];
    }) => void;
  };
}
