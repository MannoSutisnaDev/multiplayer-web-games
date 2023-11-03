import { GenericErrorResponseFunction, GenericResponseError } from "../general";

export const JoinLobby = "JoinLobby";
export const JoinLobbyResponseSuccess = "JoinLobbyResponseSuccess";

export const CreateLobby = "CreateLobby";
export const CreateLobbyResponseSuccess = "CreateLobbyResponseSuccess";
export const CreateLobbyResponseError = "CreateLobbyResponseError";

export const RequestUpdateLobbies = "RequestUpdateLobbies";
export const UpdateLobbiesResponse = "UpdateLobbiesResponse";

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
    [RequestUpdateLobbies]: () => void;
  };
  ServerToClient: {
    [JoinLobbyResponseSuccess]: ({ lobbyId }: { lobbyId: string }) => void;
    [CreateLobbyResponseSuccess]: ({ lobbyId }: { lobbyId: string }) => void;
    [UpdateLobbiesResponse]: ({
      lobbies,
    }: {
      lobbies: LobbyWithGameTypeAndUsers[];
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
    [CreateLobbyResponseError]: GenericErrorResponseFunction;
  };
}
