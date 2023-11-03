import { User } from "@prisma/client";

import prisma from "@/server/db";
import { io } from "@/server/init";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { PhaseEnterUsername } from "@/server/lobby/phases/enter-username";
import { PhaseLobbies } from "@/server/lobby/phases/lobbies";
import { PhaseLobby } from "@/server/lobby/phases/lobby";
import { SocketServerSide } from "@/server/types";
import { GameTypes } from "@/shared/types/socket-communication/general";
import {
  LobbyWithGameType,
  UserWithLobbyItOwns,
} from "@/shared/types/socket-communication/types";

export const findUser = async (
  socket: SocketServerSide
): Promise<User | null> => {
  const sessionId = socket?.data?.sessionId;
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: sessionId },
    },
  });
  return user;
};

export const findUserWithLobbyItOwns = async (
  socket: SocketServerSide
): Promise<UserWithLobbyItOwns | null> => {
  const sessionId = socket?.data?.sessionId;
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: sessionId },
    },
    include: {
      LobbyItOwns: {},
    },
  });
  return user;
};

export const findLobby: (
  lobbyId: string
) => Promise<LobbyWithGameType | null> = async (lobbyId: string | null) => {
  if (!lobbyId) {
    return null;
  }
  const lobby: LobbyWithGameType | null = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      GameType: {},
    },
  });
  return lobby;
};

export const updateUserData = async (socket: SocketServerSide) => {
  const sessionId = socket?.data?.sessionId;
  const user = await findUser(socket);
  if (!sessionId || !user) {
    setPhase(socket, PhaseEnterUsername);
    socket.emit("UpdateUserData", {
      username: "",
      sessionId: "",
      lobbyId: "",
      gameType: null,
    });
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { connected: true },
  });
  let lobby: LobbyWithGameType | null = null;
  if (user.joinedLobbyId) {
    lobby = await findLobby(user.joinedLobbyId);
  }
  socket.data.sessionId = sessionId;
  if (!lobby) {
    setPhase(socket, PhaseLobbies);
  } else {
    setPhase(socket, PhaseLobby);
  }
  const gameType: GameTypes | null = (lobby?.GameType?.id as GameTypes) ?? null;
  socket.emit("UpdateUserData", {
    username: user.username,
    sessionId,
    lobbyId: lobby?.id,
    gameType: lobby?.gameStarted ? gameType : null,
  });
};

export const sendUpdatedLobbies = async () => {
  const lobbies = await prisma.lobby.findMany({
    include: {
      GameType: {},
      Users: {
        include: {
          LobbyItOwns: {},
        },
      },
    },
  });
  const sockets = io.of("/").sockets;
  sockets.forEach((socket) => {
    const typedSocket = socket as SocketServerSide;
    if (!typedSocket?.data?.sessionId) {
      return;
    }
    typedSocket.emit("UpdateLobbiesResponse", { lobbies });
  });
};

export const sendUpdatedLobbiesToPlayer = async (socket: SocketServerSide) => {
  const lobbies = await prisma.lobby.findMany({
    include: {
      GameType: {},
      Users: {
        include: {
          LobbyItOwns: {},
        },
      },
    },
  });
  socket.emit("UpdateLobbiesResponse", { lobbies });
};

const getSocketsIndexed = (): Record<string, SocketServerSide> => {
  const indexedSockets: Record<string, SocketServerSide> = {};
  const sockets = io.of("/").sockets;
  sockets.forEach((socket) => {
    const typedSocket = socket as SocketServerSide;
    const sessionId = typedSocket?.data?.sessionId;
    if (!sessionId) {
      return;
    }
    indexedSockets[sessionId] = typedSocket;
  });
  return indexedSockets;
};

export const getSocketByUserId = (userId: string): SocketServerSide | null => {
  const indexedSockets = getSocketsIndexed();
  return indexedSockets[userId] ?? null;
};

export const getSocketsByUserIds = (userIds: string[]): SocketServerSide[] => {
  const indexedSockets = getSocketsIndexed();
  const sockets: SocketServerSide[] = [];
  for (const userId of userIds) {
    const socket = indexedSockets[userId];
    if (!socket) {
      continue;
    }
    sockets.push(socket);
  }
  return sockets;
};

export const sendUpdateLobbyToPlayer = async (socket: SocketServerSide) => {
  const user = await findUser(socket);
  if (!user || !user.joinedLobbyId) {
    return;
  }
  const lobby = await prisma.lobby.findFirst({
    where: {
      id: user.joinedLobbyId,
    },
    include: {
      GameType: {},
      Users: {
        include: {
          LobbyItOwns: {},
        },
      },
    },
  });

  lobby?.Users?.sort?.((a, b) => {
    const aValue = a?.LobbyItOwns ? 1 : 0;
    const bValue = b?.LobbyItOwns ? 1 : 0;
    if (aValue > bValue) {
      return -1;
    } else if (aValue < bValue) {
      return 1;
    }
    return 0;
  });
  if (!lobby) {
    return;
  }
  socket.emit("UpdateLobbyResponse", { lobby });
};

export const sendUpdatedLobby = async (lobbyId: string | null) => {
  if (!lobbyId) {
    return;
  }
  const indexedSockets = getSocketsIndexed();
  const lobby = await prisma.lobby.findFirst({
    where: {
      id: lobbyId,
    },
    include: {
      GameType: {},
      Users: {
        include: {
          LobbyItOwns: {},
        },
      },
    },
  });
  lobby?.Users?.sort?.((a, b) => {
    const aValue = a?.LobbyItOwns ? 1 : 0;
    const bValue = b?.LobbyItOwns ? 1 : 0;
    if (aValue > bValue) {
      return -1;
    } else if (aValue < bValue) {
      return 1;
    }
    return 0;
  });
  if (!lobby) {
    return;
  }
  for (const user of lobby.Users) {
    const socket = indexedSockets[user.id];
    if (!socket) {
      continue;
    }
    socket.emit("UpdateLobbyResponse", { lobby });
  }
};

export const handleDisconnect = async (socket: SocketServerSide) => {
  const user = await findUser(socket);
  if (!user) {
    return;
  }
  prisma.user.update({
    where: { id: user.id },
    data: {
      connected: false,
    },
  });
};
