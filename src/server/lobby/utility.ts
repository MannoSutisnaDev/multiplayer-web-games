import { GameState, User } from "@prisma/client";

import prisma from "@/server/db";
import BaseGameModel from "@/server/games/base/BaseGameModel";
import { repository as checkersRepository } from "@/server/games/checkers/CheckersRepository";
import { PhaseCheckers } from "@/server/games/checkers/phases/checkers";
import { repository as chessRepository } from "@/server/games/chess/ChessRepository";
import { PhaseChess } from "@/server/games/chess/phases/chess";
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
import { MAX_SPECTATORS } from "@/shared/types/socket-communication/games/game-types";
import { GameTypes } from "@/shared/types/socket-communication/general";
import {
  LobbyWithGameType,
  UserWithGamePlayer,
  UserWithLobbyItOwns,
} from "@/shared/types/socket-communication/types";

export const DeleteAfterSeconds = 1200;

export const findUser = async (
  socket: SocketServerSide
): Promise<UserWithGamePlayer | null> => {
  const sessionId = socket?.data?.sessionId;
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: sessionId },
    },
    include: {
      GamePlayer: true,
    },
  });
  return user;
};

export const findUserById = async (
  userId: string
): Promise<UserWithGamePlayer | null> => {
  const user = await prisma.user.findFirst({
    where: {
      id: { equals: userId },
    },
    include: {
      GamePlayer: true,
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
      GamePlayer: {},
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
  if (user.GamePlayer) {
    lobby = await findLobby(user.GamePlayer.lobbyId);
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
      case GameTypes.Chess:
        setPhase(socket, PhaseChess);
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
      Players: {
        where: {
          User: {
            connected: true,
          },
        },
        include: {
          User: {
            include: {
              LobbyItOwns: true,
            },
          },
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
      Players: {
        include: {
          User: {
            include: {
              LobbyItOwns: true,
            },
          },
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
      Players: {
        where: {
          User: {
            connected: true,
          },
        },
        include: {
          User: {
            include: {
              LobbyItOwns: true,
            },
          },
        },
      },
    },
  });
  if (!lobby) {
    return null;
  }
  lobby.Players?.sort?.((a, b) => {
    const aLobbyOwner = a?.User.LobbyItOwns ? 1 : 0;
    const bLobbyOwner = b?.User.LobbyItOwns ? 1 : 0;
    const aSpectator = a.spectator ? 1 : 0;
    const bSpectator = b.spectator ? 1 : 0;

    if (aLobbyOwner > bLobbyOwner) {
      return -1;
    }
    if (aLobbyOwner < bLobbyOwner) {
      return 1;
    }

    if (aSpectator > bSpectator) {
      return 1;
    }
    if (aSpectator < bSpectator) {
      return -1;
    }

    return 0;
  });
  return lobby;
};

export const sendUpdateLobbyToPlayer = async (socket: SocketServerSide) => {
  const user = await findUser(socket);
  if (!user || !user.GamePlayer) {
    return;
  }
  const lobbyPayload = await createLobbyPayload(user.GamePlayer.lobbyId);
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
  for (const player of lobbyPayload.Players) {
    const socket = indexedSockets[player.userId];
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
      GamePlayer: {
        include: {
          Lobby: {
            include: {
              GameType: true,
            },
          },
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
  const joinedLobby = user.GamePlayer?.Lobby;
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
      Players: {
        include: {
          User: true,
        },
      },
      GameState: {},
      GameType: {},
    },
  });
  if (!lobby) {
    return;
  }
  const userIds = lobby.Players.map((player) => player.userId);
  if (userIds.length > 0) {
    await prisma.gamePlayer.deleteMany({
      where: { userId: { in: userIds }, lobbyId: lobby.id },
    });
  }
  try {
    const game = findGameBasedOnLobby(lobby);
    if (game) {
      game.destroy();
    }
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
  let user: UserWithGamePlayer | null;
  if (typeof data === "string") {
    user = await findUserById(data);
  } else {
    user = await findUser(data);
  }
  if (!user) {
    return;
  }
  const lobbyId = user.GamePlayer?.lobbyId;
  if (!lobbyId) {
    return;
  }
  await prisma.gamePlayer.delete({
    where: { userId: user.id, lobbyId },
  });
  let lobby = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      GameType: true,
      Players: {
        where: {
          User: {
            connected: true,
          },
        },
        include: {
          User: true,
        },
      },
    },
  });
  if (!lobby) {
    return;
  }
  const game = findGameBasedOnLobby(lobby);
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
      GameType: true,
      Players: {
        where: {
          User: {
            connected: true,
          },
        },
        include: {
          User: true,
        },
      },
    },
  });
  if (!lobby) {
    return;
  }
  const realPlayers = lobby.Players.filter((player) => !player.spectator);
  if (realPlayers.length === 0) {
    deleteLobby(lobby.id);
    return;
  } else if (lobby?.ownerId === user.id) {
    const player = realPlayers[0];
    const ownerId = player ? player.userId : null;
    if (!ownerId) {
      deleteLobby(lobby.id);
      return;
    }
    await prisma.lobby.update({
      where: { id: lobbyId },
      data: { ownerId },
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
    include: {
      GamePlayer: true,
    },
  });
  if (!user) {
    sendBackToEnterUsername();
    return false;
  }
  if (!user.GamePlayer?.lobbyId) {
    return true;
  }
  const sendBackToLobbiesAndConnectUser = async (message: string) => {
    setPhase(socket, PhaseLobbies);
    await prisma.gamePlayer.delete({
      where: { userId: user.id },
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
    where: { id: user.GamePlayer.lobbyId },
    include: { GameType: {}, Players: { include: { User: true } } },
  });
  if (!lobby) {
    return true;
  }
  const isSpectator = !!lobby.Players.filter(
    (player) => player.userId === sessionId && player.spectator
  )[0];
  const players = lobby.Players.filter(
    (player) =>
      player.User.connected &&
      player.User.id !== sessionId &&
      (isSpectator ? player.spectator : !player.spectator)
  );
  if (
    players.length >= (isSpectator ? lobby.GameType.maxPlayers : MAX_SPECTATORS)
  ) {
    sendBackToLobbiesAndConnectUser(
      `The maximum amount of ${
        !isSpectator ? "players" : "spectators"
      } are already in the lobby. You have been returned to the lobby overview.`
    );
    return false;
  }
  if (!lobby.gameStarted) {
    return true;
  }
  const game = findGameBasedOnLobby(lobby);
  if (!game) {
    sendBackToLobbiesAndConnectUser(
      "The game could not be found. You have been returned to the lobby overview."
    );
    return false;
  }
  if (!isSpectator && !game.getPlayer(sessionId)) {
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
    case GameTypes.Chess:
      game = chessRepository.findOne(lobby.id);
      break;
  }
  return game;
};

export const setAllUsersToDisconnected = async () => {
  await prisma.user.updateMany({
    data: { connected: false },
  });
};

export const deleteGameAndReturnToLobby = async (lobbyId: string) => {
  const lobby = await prisma.lobby.findFirst({
    where: { id: lobbyId },
    include: {
      Players: {},
      GameState: {},
      GameType: {},
    },
  });
  if (!lobby) {
    return;
  }
  const game = findGameBasedOnLobby(lobby);
  if (game) {
    game.destroy();
  }
  const playerIds = lobby.Players.map((player) => player.userId);
  if (playerIds.length > 0) {
    await prisma.gamePlayer.updateMany({
      where: { userId: { in: playerIds } },
      data: { ready: false },
    });
  }
  await prisma.lobby.update({
    where: { id: lobby.id },
    data: { gameStarted: false },
  });
  try {
    if (lobby.GameState) {
      await prisma.gameState.delete({
        where: { lobbyId: lobby.id },
      });
    }
  } catch (e) {}
  const sockets = getSocketsByUserIds(playerIds);
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
    where: {
      GamePlayer: {
        is: null,
      },
      connected: false,
    },
  });
  const usersToDelete = determineEntriesToDeleteWithNoActivity(users) as User[];
  const userIds = usersToDelete.map((user) => user.id);
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
    include: { Players: {} },
  });
  const lobbyIdsToDelete: string[] = [];
  for (const lobby of lobbies) {
    const correctOwner = lobby.Players.find(
      (player) => player.userId === lobby.ownerId
    );
    if (correctOwner) {
      continue;
    }
    lobbyIdsToDelete.push(lobby.id);
  }
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

export const cleanUp = async () => {
  await cleanUpLobbiesNoActivity();
  await cleanUpLobbiesIncorrectOwner();
  cleanUpUsersNoActivity();
};
