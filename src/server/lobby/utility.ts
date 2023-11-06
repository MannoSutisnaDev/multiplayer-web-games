import { GameState, User } from "@prisma/client";

import prisma from "@/server/db";
import BaseGameModel from "@/server/games/base/BaseGameModel";
import { repository as checkersRepository } from "@/server/games/checkers/CheckersRepository";
import { PhaseCheckers } from "@/server/games/checkers/phases/checkers";
import { io } from "@/server/init";
import {
  removeScheduledDelete,
  scheduleDelete,
} from "@/server/lobby/delete-user";
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

// export const DeleteAfterSeconds = 1000 * 300;

export const DeleteAfterSeconds = 60 * 10;

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

export const findUserById = async (userId: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: userId },
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
    const gameType = lobby.GameType?.name;
    switch (gameType) {
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
  const sessionId = socket.handshake.auth?.sessionId;
  removeScheduledDelete(sessionId);
  if (!(await guardUserConnect(socket, sessionId))) {
    return;
  }
  socket.data.sessionId = sessionId;
  await updateUserData(socket);
  handleConnectionChange(socket, true);
};

export const handleDisconnect = async (socket: SocketServerSide) => {
  await handleConnectionChange(socket, false);
  const sessionId = socket?.data?.sessionId;
  if (!sessionId) {
    return;
  }
  scheduleDelete(sessionId);
};

export const deleteLobby = async (lobbyId: string) => {
  const lobby = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      Users: {},
      GameState: {},
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
  await prisma.lobby.update({
    where: { id: lobby.id },
    data: { lobbyOwnerId: null },
  });
  try {
    if (lobby.GameState) {
      await prisma.gameState.delete({
        where: { lobbyId: lobby.id },
      });
    }
  } catch (e) {}
  await prisma.lobby.delete({
    where: { id: lobby.id },
  });
  const sockets = getSocketsByUserIds(userIds);
  await Promise.all(
    sockets.map(
      (socket) =>
        new Promise<void>(async (resolve) => {
          await updateUserData(socket);
          resolve();
        })
    )
  );
  sendUpdatedLobbies();
};

export const leaveLobby = async (data: SocketServerSide | string) => {
  let user: User | null;
  if (typeof data === "string") {
    user = await findUserById(data);
  } else {
    user = await findUser(data);
  }
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
  let lobby = await prisma.lobby.findFirst({
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
  const game = checkersRepository.findOne(lobby.id);
  if (game) {
    game.leaveGame(user.id);
  }
  if (typeof data !== "string") {
    await updateUserData(data);
  }
  // Fetch lobbies again to determine the updated connected players count
  lobby = await prisma.lobby.findFirst({
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
  if (lobby.Users.length === 0) {
    deleteLobby(lobby.id);
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
    return;
  }
  sendUpdatedLobbies();
  sendUpdatedLobby(lobbyId);
};

export const guardUserConnect = async (
  socket: SocketServerSide,
  sessionId: string
): Promise<boolean> => {
  if (!sessionId) {
    return true;
  }
  const sendBackToEnterUsername = (error: string | null = null) => {
    setPhase(socket, PhaseEnterUsername);
    socket.emit("DeleteSessionId");
    if (error) {
      socket.emit("GenericResponseError", {
        error,
      });
    }
  };
  const sockets = getSocketsIndexed();
  if (sockets[sessionId]) {
    sendBackToEnterUsername(
      "There is already a player connected that has the ID you're trying to connect with. You have to create a new user."
    );
    return false;
  }
  const user = await prisma.user.findFirst({
    where: { id: sessionId },
  });
  if (!user) {
    sendBackToEnterUsername();
    return false;
  }
  if (!user.joinedLobbyId) {
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
  switch (lobby.GameType.name as GameTypes) {
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

type UpdatedAt = {
  updatedAt: Date;
} | null;

const determineEntriesToDeleteWithNoActivity = (
  entries: UpdatedAt[],
  deleteAfterSeconds: number = DeleteAfterSeconds
) => {
  const entriesToDelete: UpdatedAt[] = [];
  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    const now = new Date();
    const timeDiffSeconds = (now.getTime() - entry.updatedAt.getTime()) / 1000;
    if (timeDiffSeconds >= deleteAfterSeconds) {
      entriesToDelete.push(entry);
    }
  }
  return entriesToDelete;
};

const cleanUpUsersNoActivity = async () => {
  const users = await prisma.user.findMany({
    where: { joinedLobbyId: null, connected: false },
  });
  const usersToDelete = determineEntriesToDeleteWithNoActivity(users) as User[];
  const userIds = usersToDelete.map((user) => user.id);
  console.log({ deleteUsersNoActivity: userIds });
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
};

const cleanUpLobbiesNoActivity = async () => {
  const lobbies = await prisma.lobby.findMany({
    where: { gameStarted: true },
    include: { GameState: {} },
  });
  const gameStates = lobbies
    .map((lobby) => lobby.GameState)
    .filter((gameState) => gameState);
  const gameStatesToDelete = determineEntriesToDeleteWithNoActivity(
    gameStates
  ) as GameState[];
  const lobbyIds = gameStatesToDelete.map((gameState) => gameState.lobbyId);
  console.log({ deleteLobbiesNoActivity: lobbyIds });
  await Promise.all(
    lobbyIds.map(
      (lobbyId) =>
        new Promise<void>(async (resolve) => {
          await deleteLobby(lobbyId);
          resolve();
        })
    )
  );
};

const cleanUpLobbiesIncorrectOwner = async () => {
  const lobbies = await prisma.lobby.findMany({
    include: { Users: {} },
  });
  const lobbyIdsToDelete: string[] = [];
  for (const lobby of lobbies) {
    const correctOwner = lobby.Users.find(
      (user) => user.id === lobby.lobbyOwnerId
    );
    if (correctOwner) {
      continue;
    }
    lobbyIdsToDelete.push(lobby.id);
  }
  console.log({ deleteLobbiesIncorrectOwner: lobbyIdsToDelete });
  await Promise.all(
    lobbyIdsToDelete.map(
      (lobbyId) =>
        new Promise<void>(async (resolve) => {
          await deleteLobby(lobbyId);
          resolve();
        })
    )
  );
};

export const periodicCleanUpFunction = async () => {
  await cleanUpLobbiesNoActivity();
  await cleanUpLobbiesIncorrectOwner();
  cleanUpUsersNoActivity();
};
