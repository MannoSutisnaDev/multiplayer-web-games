import { User } from "@prisma/client";

import prisma from "@/server/db";
import BaseGameModel from "@/server/games/base/BaseGameModel";
import { repository as checkersRepository } from "@/server/games/checkers/CheckersRepository";
import { PhaseCheckers } from "@/server/games/checkers/phases/checkers";
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
  let lobby: LobbyWithGameType | null = null;
  if (user.joinedLobbyId) {
    lobby = await findLobby(user.joinedLobbyId);
  }
  socket.data.sessionId = sessionId;
  if (!lobby) {
    setPhase(socket, PhaseLobbies);
  } else if (!lobby.gameStarted) {
    setPhase(socket, PhaseLobby);
  } else {
    switch (lobby.GameType.name as GameTypes) {
      case GameTypes.Checkers:
        setPhase(socket, PhaseCheckers);
        break;
    }
  }
  const gameType: GameTypes | null =
    (lobby?.GameType?.name as GameTypes) ?? null;
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
        where: { connected: true },
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

const createLobbyPayload = async (lobbyId: string) => {
  const lobby = await prisma.lobby.findFirst({
    where: {
      id: lobbyId,
    },
    include: {
      GameType: {},
      Users: {
        where: { connected: true },
        include: {
          LobbyItOwns: {},
        },
      },
    },
  });
  if (!lobby) {
    return null;
  }
  lobby.Users?.sort?.((a, b) => {
    const aValue = a?.LobbyItOwns ? 1 : 0;
    const bValue = b?.LobbyItOwns ? 1 : 0;
    if (aValue > bValue) {
      return -1;
    } else if (aValue < bValue) {
      return 1;
    }
    return 0;
  });
  return lobby;
};

export const sendUpdateLobbyToPlayer = async (socket: SocketServerSide) => {
  const user = await findUser(socket);
  if (!user || !user.joinedLobbyId) {
    return;
  }
  const lobbyPayload = await createLobbyPayload(user.joinedLobbyId);
  if (!lobbyPayload) {
    return;
  }
  socket.emit("UpdateLobbyResponse", { lobby: lobbyPayload });
};

export const sendUpdatedLobby = async (lobbyId: string | null) => {
  if (!lobbyId) {
    return;
  }
  const indexedSockets = getSocketsIndexed();
  const lobbyPayload = await createLobbyPayload(lobbyId);
  if (!lobbyPayload) {
    return;
  }
  for (const user of lobbyPayload.Users) {
    const socket = indexedSockets[user.id];
    if (!socket) {
      continue;
    }
    socket.emit("UpdateLobbyResponse", { lobby: lobbyPayload });
  }
};

const handleConnectionChange = async (
  socket: SocketServerSide,
  connected: boolean
) => {
  const sessionId = socket?.data?.sessionId;
  if (!sessionId) {
    return;
  }
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: sessionId },
    },
    include: {
      JoinedLobby: {
        include: {
          GameType: {},
        },
      },
    },
  });
  if (!user) {
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { connected },
  });
  const joinedLobby = user.JoinedLobby;
  if (!joinedLobby) {
    return;
  }
  if (joinedLobby.gameStarted) {
    const game = findGameBasedOnLobby(joinedLobby);
    if (game) {
      if (connected) {
        game.handleConnect(user.id);
      } else {
        game.handleDisconnect(user.id);
      }
    }
  }
  sendUpdatedLobby(joinedLobby.id);
  sendUpdatedLobbies();
};

export const handleConnect = async (socket: SocketServerSide) => {
  handleConnectionChange(socket, true);
};

export const handleDisconnect = async (socket: SocketServerSide) => {
  handleConnectionChange(socket, false);
};

export const deleteLobby = async (lobbyId: string) => {
  const lobby = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      Users: {},
    },
  });
  if (!lobby) {
    return;
  }
  const userIds = lobby.Users.map((user) => user.id);
  if (userIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { joinedLobbyId: null, ready: false },
    });
  }
  await prisma.gameState.delete({
    where: { lobbyId: lobby.id },
  });
  await prisma.lobby.delete({
    where: { id: lobby.id },
  });
  const sockets = getSocketsByUserIds(userIds);
  for (const socket of sockets) {
    setPhase(socket, PhaseLobbies);
    updateUserData(socket);
  }
  sendUpdatedLobbies();
};

export const leaveLobby = async (socket: SocketServerSide) => {
  const user = await findUser(socket);
  if (!user) {
    return;
  }
  const lobbyId = user.joinedLobbyId;
  if (!lobbyId) {
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { joinedLobbyId: null, ready: false },
  });
  const lobby = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      Users: {
        where: { connected: true },
      },
    },
  });
  if (!lobby) {
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { ready: false, joinedLobbyId: null },
  });
  setPhase(socket, PhaseLobbies);
  updateUserData(socket);
  sendUpdatedLobbies();
  const game = checkersRepository.findOne(lobby.id);
  if (game) {
    game.leaveGame(user.id);
  }
  if (lobby.Users.length === 0) {
    await deleteLobby(lobby.id);
    return;
  } else if (lobby?.lobbyOwnerId === user.id) {
    const player = lobby.Users[0];
    const ownerId = player ? player.id : null;
    await prisma.lobby.update({
      where: { id: lobbyId },
      data: { lobbyOwnerId: ownerId },
    });
    sendUpdatedLobbies();
    sendUpdatedLobby(lobbyId);
    updateUserData(socket);
  }
};

export const guardUserConnect = async (
  socket: SocketServerSide,
  sessionId: string
): Promise<boolean> => {
  if (!sessionId) {
    return true;
  }
  const sockets = getSocketsIndexed();
  if (sockets[sessionId]) {
    setPhase(socket, PhaseEnterUsername);
    socket.emit("UpdateUserData", {
      username: "",
      sessionId: "",
      lobbyId: "",
      gameType: null,
    });
    socket.emit("GenericResponseError", {
      error:
        "There is already a player connected that has the ID you're trying to connect with. You have to create a new user.",
    });
    sendUpdatedLobbies();
    return false;
  }
  const user = await prisma.user.findFirst({
    where: { id: sessionId },
  });
  if (!user || !user.joinedLobbyId) {
    return true;
  }
  const sendBackToLobbiesAndConnectUser = async (message: string) => {
    setPhase(socket, PhaseLobbies);
    await prisma.user.update({
      where: { id: user.id },
      data: { joinedLobbyId: null, ready: false, connected: true },
    });
    socket.data.sessionId = sessionId;
    socket.emit("UpdateUserData", {
      username: user.username,
      sessionId: sessionId,
      lobbyId: "",
      gameType: null,
    });
    socket.emit("GenericResponseError", { error: message });
    sendUpdatedLobbies();
  };
  const lobby = await prisma.lobby.findFirst({
    where: { id: user.joinedLobbyId },
    include: { GameType: {}, Users: {} },
  });
  if (!lobby) {
    return true;
  }
  const players = lobby.Users.filter(
    (player) => player.connected && player.id !== sessionId
  );
  if (players.length >= lobby.GameType.maxPlayers) {
    sendBackToLobbiesAndConnectUser(
      "The maximum amount of players are already in the lobby. You have been returned to the lobby overview."
    );
    return false;
  }
  if (!lobby.gameStarted) {
    return true;
  }
  const game = findGameBasedOnLobby(lobby);
  if (!game) {
    return true;
  }
  if (!game.getPlayer(sessionId)) {
    sendBackToLobbiesAndConnectUser(
      "The game has already started and your not part of it. You have been returned to the lobby overview."
    );
    return false;
  }
  return true;
};

export const findGameBasedOnLobby = (
  lobby: LobbyWithGameType
): BaseGameModel | undefined => {
  let game: BaseGameModel | undefined = undefined;
  const gameType = lobby.GameType.name as GameTypes;
  switch (gameType) {
    case GameTypes.Checkers:
      game = checkersRepository.findOne(lobby.id);
      break;
  }
  return game;
};

export const setAllUsersToDisconnected = async () => {
  await prisma.user.updateMany({
    data: { connected: false },
  });
};
