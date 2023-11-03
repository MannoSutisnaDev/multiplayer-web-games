import { Prisma } from "@prisma/client";

import {
  PhaseEnterUsernameTypes,
  PhaseIdEnterUsername,
} from "@/shared/types/socket-communication/lobby/enter-username";
import { GeneralSocketFunctions } from "@/shared/types/socket-communication/lobby/general";
import {
  PhaseIdLobbies,
  PhaseLobbiesTypes,
} from "@/shared/types/socket-communication/lobby/lobbies";
import {
  PhaseIdLobby,
  PhaseLobbyTypes,
} from "@/shared/types/socket-communication/lobby/lobby";

export type ServerToClientEvents = GeneralSocketFunctions["ServerToClient"] &
  PhaseEnterUsernameTypes["ServerToClient"] &
  PhaseLobbiesTypes["ServerToClient"] &
  PhaseLobbyTypes["ServerToClient"];
export type ClientToServerEvents = PhaseEnterUsernameTypes["ClientToServer"] &
  PhaseLobbiesTypes["ClientToServer"] &
  PhaseLobbyTypes["ClientToServer"];

type PhaseIds =
  | typeof PhaseIdEnterUsername
  | typeof PhaseIdLobbies
  | typeof PhaseIdLobby;

export interface Phase {
  id: PhaseIds;
  functions: Record<string, (...args: any[]) => void>;
}

const lobbyWithGameType = Prisma.validator<Prisma.LobbyDefaultArgs>()({
  include: { GameType: true },
});

export type LobbyWithGameType = Prisma.LobbyGetPayload<
  typeof lobbyWithGameType
>;

const lobbyWithGameTypeAndUsers = Prisma.validator<Prisma.LobbyDefaultArgs>()({
  include: { Users: true, GameType: true },
});

export type LobbyWithGameTypeAndUsers = Prisma.LobbyGetPayload<
  typeof lobbyWithGameTypeAndUsers
>;
