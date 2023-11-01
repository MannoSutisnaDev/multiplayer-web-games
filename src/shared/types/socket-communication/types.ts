import { Prisma } from "@prisma/client";

import {
  PhaseEnterUsernameTypes,
  PhaseIdEnterUsername,
} from "@/shared/types/socket-communication/lobby/enter-username";
import { GeneralSocketFunctions } from "@/shared/types/socket-communication/lobby/general";
import { PhaseIdLobbies } from "@/shared/types/socket-communication/lobby/lobbies";
import { PhaseLobbiesTypes } from "@/shared/types/socket-communication/lobby/lobbies";

export type ServerToClientEvents = GeneralSocketFunctions["ServerToClient"] &
  PhaseEnterUsernameTypes["ServerToClient"] &
  PhaseLobbiesTypes["ServerToClient"];
export type ClientToServerEvents = PhaseEnterUsernameTypes["ClientToServer"] &
  PhaseLobbiesTypes["ClientToServer"];

type PhaseIds = typeof PhaseIdEnterUsername | typeof PhaseIdLobbies;

export interface Phase {
  id: PhaseIds;
  functions: Record<string, (...args: any[]) => void>;
}

const lobbyWithGameTypeAndUsers = Prisma.validator<Prisma.LobbyDefaultArgs>()({
  include: { Users: true, GameType: true },
});

export type LobbyWithGameTypeAndUsers = Prisma.LobbyGetPayload<
  typeof lobbyWithGameTypeAndUsers
>;
