import prisma from "@/server/db";
import BaseGameModel from "@/server/games/base/BaseGameModel";
import { createGame as createCheckersGame } from "@/server/games/checkers/CheckersRepository";
import { createGame as createChessGame } from "@/server/games/chess/ChessRepository";
import {
  findUser,
  findUserWithLobbyItOwns,
  getSocketByUserId,
  getSocketsByUserIds,
  leaveLobby as leaveLobbyFunction,
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
    if (!user || !user.GamePlayer) {
      return;
    }
    await prisma.gamePlayer.update({
      where: { userId: user.id, lobbyId: user.GamePlayer.lobbyId },
      data: { ready },
    });
    socket.emit("SetReadyResponseSuccess");
    sendUpdatedLobby(user.GamePlayer.lobbyId);
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
  if (!user.GamePlayer) {
    socket.emit(emitType, { error: "User is not in a lobby" });
    return null;
  }
  const lobby = await prisma.lobby.findFirst({
    where: { id: user.GamePlayer.lobbyId },
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
  if (!lobby) {
    socket.emit(emitType, { error: "Lobby does not exist" });
    return null;
  }
  const inLobby = lobby.Players.findIndex(
    (lobbyUser) => lobbyUser.userId === user.id
  );
  if (inLobby === -1) {
    socket.emit(emitType, {
      error: "You are not in the selected lobby",
    });
    return null;
  }
  if (user?.LobbyItOwns?.id !== user.GamePlayer.lobbyId) {
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
    const players = lobby.Players.filter((player) => !player.spectator);
    for (const player of players) {
      if (player.ready) {
        readyCount += 1;
      }
    }
    if (players.length < 2) {
      socket.emit("GenericResponseError", {
        error: "At least 2 players should be in the lobby",
      });
      return;
    }
    if (readyCount !== players.length) {
      socket.emit("GenericResponseError", {
        error: "Not all players are ready",
      });
      return;
    }
    try {
      await prisma.lobby.update({
        where: { id: lobby.id },
        data: { gameStarted: true },
      });
    } catch (e) {
      console.error(e);
      socket.emit("GenericResponseError", { error: "Could not start lobby." });
      return;
    }
    let game: BaseGameModel | null = null;
    try {
      const players = lobby.Players.filter((player) => !player.spectator).map(
        (player) => ({
          id: player.userId,
          name: player.User.username,
        })
      );
      const spectators = lobby.Players.filter((player) => player.spectator).map(
        (player) => ({
          id: player.userId,
          name: player.User.username,
        })
      );

      switch (lobby.GameType.name as GameTypes) {
        case GameTypes.Checkers:
          game = createCheckersGame(lobby.id, players, spectators);
          break;
        case GameTypes.Chess:
          game = createChessGame(lobby.id, players, spectators);
          break;
      }
    } catch (e: any) {
      if (e instanceof Error) {
        socket.emit("GenericResponseError", { error: e.message });
      }
      await prisma.lobby.update({
        where: { id: lobby.id },
        data: { gameStarted: false },
      });
      return;
    }
    await game?.saveState();
    const playerIds = lobby.Players.map((player) => player.userId);
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
    if (!user.GamePlayer) {
      return;
    }
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
    sendUpdatedLobby(user.GamePlayer.lobbyId);
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
    const targetUserIndex = lobby.Players.findIndex(
      (player) => player.userId === userId
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
    await prisma.gamePlayer.delete({
      where: {
        userId,
        lobbyId: lobby.id,
      },
    });
    const targetUserSocket = getSocketByUserId(userId);
    if (targetUserSocket) {
      await updateUserData(targetUserSocket);
    }
    sendUpdatedLobby(lobby.id);
    sendUpdatedLobbies();
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
    const targetUserIndex = lobby.Players.findIndex(
      (player) => player.userId === userId
    );
    if (targetUserIndex === -1) {
      socket.emit("GenericResponseError", {
        error: "User to make new owner is not in the lobby",
      });
      return;
    }
    const gamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        userId,
        lobbyId: lobby.id,
        spectator: false,
      },
    });
    const targetUserSocket = getSocketByUserId(userId);
    if (!gamePlayer || !targetUserSocket) {
      socket.emit("GenericResponseError", {
        error: "Could not find the target user",
      });
      return;
    }
    await prisma.lobby.update({
      where: { id: lobby.id },
      data: { ownerId: userId },
    });
    sendUpdatedLobby(lobby.id);
  };
  asyncExecution();
};

const leaveLobby = (socket: SocketServerSide) => {
  leaveLobbyFunction(socket);
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
  },
};
