import prisma from "@/server/db";
import { createCheckersGame } from "@/server/games/checkers/CheckersRepository";
import { GeneralClientToServer } from "@/server/lobby/phases/general";
import {
  findUser,
  findUserWithLobbyItOwns,
  getSocketByUserId,
  getSocketsByUserIds,
  sendUpdatedLobbies,
  sendUpdatedLobby,
  sendUpdateLobbyToPlayer,
  updateUserData,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { GameTypes } from "@/shared/types/socket-communication/general";
import {
  EditLobby,
  KickUser,
  LeaveLobby,
  PhaseIdLobby,
  RequestUpdateLobby,
  SetNewOwner,
  SetReady,
  StartGame,
} from "@/shared/types/socket-communication/lobby/lobby";
import {
  LobbyWithGameTypeAndUsers,
  Phase,
  UserWithLobbyItOwns,
} from "@/shared/types/socket-communication/types";

const setReady = (socket: SocketServerSide, { ready }: { ready: boolean }) => {
  const asyncExecution = async () => {
    const user = await findUser(socket);
    if (!user) {
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { ready },
    });
    socket.emit("SetReadyResponseSuccess");
    sendUpdatedLobby(user.joinedLobbyId);
  };
  asyncExecution();
};

const verifyIfUserIsOwner = async (
  socket: SocketServerSide,
  emitType:
    | "GenericResponseError"
    | "EditLobbyResponseError" = "GenericResponseError"
): Promise<null | {
  user: UserWithLobbyItOwns;
  lobby: LobbyWithGameTypeAndUsers;
}> => {
  const user = await findUserWithLobbyItOwns(socket);
  if (!user) {
    socket.emit(emitType, { error: "User does not exist" });
    return null;
  }
  if (!user.joinedLobbyId) {
    socket.emit(emitType, { error: "User is not in a lobby" });
    return null;
  }
  const lobby = await prisma.lobby.findFirst({
    where: { id: user.joinedLobbyId },
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
    socket.emit(emitType, { error: "Lobby does not exist" });
    return null;
  }
  const inLobby = lobby.Users.findIndex(
    (lobbyUser) => lobbyUser.id === user.id
  );
  if (inLobby === -1) {
    socket.emit(emitType, {
      error: "You are not in the selected lobby",
    });
    return null;
  }
  if (user?.LobbyItOwns?.id !== user.joinedLobbyId) {
    socket.emit(emitType, {
      error: "You are not the owner of the lobby",
    });
    return null;
  }
  return {
    user,
    lobby,
  };
};

const startGame = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const isOwnerData = await verifyIfUserIsOwner(socket);
    if (!isOwnerData) {
      return;
    }
    const { lobby } = isOwnerData;
    let readyCount = 0;
    for (const user of lobby.Users) {
      if (user.ready) {
        readyCount += 1;
      }
    }
    if (lobby.Users.length < 2) {
      socket.emit("GenericResponseError", {
        error: "At least 2 players should be in the lobby",
      });
      return;
    }
    if (readyCount !== lobby.Users.length) {
      socket.emit("GenericResponseError", {
        error: "Not all players are ready",
      });
      return;
    }
    try {
      switch (lobby.GameType.name as GameTypes) {
        case GameTypes.Checkers:
          createCheckersGame(
            lobby.id,
            lobby.Users.map((user) => user.id)
          );
          break;
        default:
          break;
      }
    } catch (e: any) {
      socket.emit("GenericResponseError", e);
      return;
    }
    await prisma.lobby.update({
      where: { id: lobby.id },
      data: { gameStarted: true },
    });
    const playerIds = lobby.Users.map((user) => user.id);
    const sockets = getSocketsByUserIds(playerIds);
    for (const socket of sockets) {
      updateUserData(socket);
    }
    sendUpdatedLobbies();
  };
  asyncExecution();
};

const editLobby = (
  socket: SocketServerSide,
  {
    lobbyName,
    gameType,
  }: {
    lobbyName: string;
    gameType: GameTypes;
  }
) => {
  const asyncExecution = async () => {
    const isOwnerData = await verifyIfUserIsOwner(
      socket,
      "EditLobbyResponseError"
    );
    if (!isOwnerData) {
      return;
    }
    const { user, lobby } = isOwnerData;
    const gameTypeEntry = await prisma.gameType.findFirst({
      where: {
        name: gameType,
      },
    });
    if (!gameTypeEntry) {
      socket.emit("EditLobbyResponseError", {
        error: "Invalid game type selected.",
      });
      return;
    }
    await prisma.lobby.update({
      where: {
        id: lobby.id,
      },
      data: {
        name: lobbyName,
        gameTypeId: gameTypeEntry.id,
        gameStarted: false,
      },
    });
    sendUpdatedLobby(user.joinedLobbyId);
    socket.emit("EditLobbyResponseSuccess");
  };
  asyncExecution();
};

const kickUser = (socket: SocketServerSide, { userId }: { userId: string }) => {
  const asyncExecution = async () => {
    const isOwnerData = await verifyIfUserIsOwner(socket);
    if (!isOwnerData) {
      return;
    }
    const { user, lobby } = isOwnerData;
    const targetUserIndex = lobby.Users.findIndex(
      (lobbyUser) => lobbyUser.id === userId
    );
    if (targetUserIndex === -1) {
      socket.emit("GenericResponseError", {
        error: "User to kick does not in the lobby",
      });
      return;
    }
    if (user.id === userId) {
      socket.emit("GenericResponseError", {
        error: "You can't kick yourself",
      });
      return;
    }
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        joinedLobbyId: null,
        ready: false,
      },
    });
    sendUpdatedLobby(user.joinedLobbyId);
    sendUpdatedLobbies();
    const targetUserSocket = getSocketByUserId(userId);
    if (targetUserSocket) {
      updateUserData(targetUserSocket);
    }
  };
  asyncExecution();
};

const setNewOwner = (
  socket: SocketServerSide,
  { userId }: { userId: string }
) => {
  const asyncExecution = async () => {
    const isOwnerData = await verifyIfUserIsOwner(socket);
    if (!isOwnerData) {
      return;
    }
    const { user, lobby } = isOwnerData;
    if (user.id === userId) {
      socket.emit("GenericResponseError", {
        error: "You are already the owner of the lobby",
      });
      return;
    }
    const targetUserIndex = lobby.Users.findIndex(
      (lobbyUser) => lobbyUser.id === userId
    );
    if (targetUserIndex === -1) {
      socket.emit("GenericResponseError", {
        error: "User to make new owner is not in the lobby",
      });
      return;
    }
    const targetUserSocket = getSocketByUserId(userId);
    if (!targetUserSocket) {
      socket.emit("GenericResponseError", {
        error: "Could not update target user",
      });
      return;
    }
    await prisma.lobby.update({
      where: { id: lobby.id },
      data: { lobbyOwnerId: userId },
    });
    sendUpdatedLobby(user.joinedLobbyId);
  };
  asyncExecution();
};

const leaveLobby = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
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
    if ((lobby?.Users?.length ?? 0) === 0) {
      await prisma.lobby.delete({
        where: { id: lobbyId },
      });
    } else if (lobby?.lobbyOwnerId === user.id) {
      const player = lobby.Users[0];
      const ownerId = player ? player.id : null;
      await prisma.lobby.update({
        where: { id: lobbyId },
        data: { lobbyOwnerId: ownerId },
      });
    }
    sendUpdatedLobbies();
    sendUpdatedLobby(lobbyId);
    updateUserData(socket);
  };
  asyncExecution();
};

const requestUpdateLobby = (socket: SocketServerSide) => {
  sendUpdateLobbyToPlayer(socket);
};

export const PhaseLobby: Phase = {
  id: PhaseIdLobby,
  functions: {
    [SetReady]: setReady,
    [StartGame]: startGame,
    [EditLobby]: editLobby,
    [KickUser]: kickUser,
    [SetNewOwner]: setNewOwner,
    [LeaveLobby]: leaveLobby,
    [RequestUpdateLobby]: requestUpdateLobby,
    ...GeneralClientToServer,
  },
};
