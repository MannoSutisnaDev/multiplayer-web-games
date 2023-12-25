import { Prisma } from "@prisma/client";

import {
  PhaseCheckersTypes,
  PhaseIdCheckers,
} from "@/shared/types/socket-communication/games/checkers";
import {
  PhaseChessTypes,
  PhaseIdChess,
} from "@/shared/types/socket-communication/games/chess";
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
  PhaseLobbyTypes["ServerToClient"] &
  PhaseCheckersTypes["ServerToClient"] &
  PhaseChessTypes["ServerToClient"];
export type ClientToServerEvents = PhaseEnterUsernameTypes["ClientToServer"] &
  PhaseLobbiesTypes["ClientToServer"] &
  PhaseLobbyTypes["ClientToServer"] &
  PhaseCheckersTypes["ClientToServer"] &
  PhaseChessTypes["ClientToServer"];

export type PhaseIds =
  | typeof PhaseIdEnterUsername
  | typeof PhaseIdLobbies
  | typeof PhaseIdLobby
  | typeof PhaseIdCheckers
  | typeof PhaseIdChess;

export interface Phase {
  id: PhaseIds;
  functions: Record<string, (...args: any[]) => void>;
}

const userWithGamePlayer = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { GamePlayer: true },
});

export type UserWithGamePlayer = Prisma.UserGetPayload<
  typeof userWithGamePlayer
>;

const userWithLobbyItOwns = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { GamePlayer: true, LobbyItOwns: true },
});

export type UserWithLobbyItOwns = Prisma.UserGetPayload<
  typeof userWithLobbyItOwns
>;

const lobbyWithGameType = Prisma.validator<Prisma.LobbyDefaultArgs>()({
  include: { GameType: true },
});

export type LobbyWithGameType = Prisma.LobbyGetPayload<
  typeof lobbyWithGameType
>;

const lobbyWithGameTypeAndUsers = Prisma.validator<Prisma.LobbyDefaultArgs>()({
  include: {
    Players: {
      include: {
        User: {
          include: {
            LobbyItOwns: true,
          },
        },
      },
    },
    GameType: true,
  },
});

export type LobbyWithGameTypeAndUsers = Prisma.LobbyGetPayload<
  typeof lobbyWithGameTypeAndUsers
>;

export enum TokenStorage {
  LocalStorage = "LocalStorage",
  SessionStorage = "SessionStorage",
  Cookie = "Cookie",
}
