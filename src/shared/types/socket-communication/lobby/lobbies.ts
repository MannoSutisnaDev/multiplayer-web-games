import {
  GameTypes,
  GenericErrorResponseFunction,
  GenericResponseError,
} from "../general";

export const JoinLobby = "JoinLobby";
export const JoinLobbyResponseSuccess = "JoinLobbyResponseSuccess";

export const CreateLobby = "CreateLobby";
export const CreateLobbyResponseSuccess = "CreateLobbyResponseSuccess";
export const CreateLobbyResponseError = "CreateLobbyResponseError";

export const RequestUpdateLobbies = "RequestUpdateLobbies";
export const UpdateLobbiesResponse = "UpdateLobbiesResponse";

export const PhaseIdLobbies = "lobbies";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

export interface PhaseLobbiesTypes {
  ClientToServer: {
    [CreateLobby]: ({
      lobbyName,
      gameType,
    }: {
      lobbyName: string;
      gameType: GameTypes;
    }) => void;
    [JoinLobby]: ({
      lobbyId,
      spectator,
    }: {
      lobbyId: string;
      spectator: boolean;
    }) => void;
    [RequestUpdateLobbies]: () => void;
  };
  ServerToClient: {
    [JoinLobbyResponseSuccess]: ({
      lobbyId,
      gameType,
    }: {
      lobbyId: string;
      gameType: GameTypes | null;
    }) => void;
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
