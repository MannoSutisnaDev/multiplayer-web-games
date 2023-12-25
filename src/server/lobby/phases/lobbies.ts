import prisma from "@/server/db";
import BaseGameModel from "@/server/games/base/BaseGameModel";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { PhaseLobby } from "@/server/lobby/phases/lobby";
import {
  findGameBasedOnLobby,
  sendUpdatedLobbies,
  sendUpdatedLobbiesToPlayer,
  sendUpdatedLobby,
  updateUserData,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { MAX_SPECTATORS } from "@/shared/types/socket-communication/games/game-types";
import { GameTypes } from "@/shared/types/socket-communication/general";
import {
  CreateLobby,
  JoinLobby,
  PhaseIdLobbies,
  RequestUpdateLobbies,
} from "@/shared/types/socket-communication/lobby/lobbies";
import { Phase } from "@/shared/types/socket-communication/types";

const createLobby = (
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
    const user = await prisma.user.findFirst({
      where: {
        id: socket.data.sessionId,
      },
    });
    if (!user) {
      socket.emit("CreateLobbyResponseError", {
        error: "User does not exist.",
      });
      return;
    }
    let lobby = await prisma.lobby.findFirst({
      where: {
        name: { equals: lobbyName },
      },
    });
    if (lobby) {
      socket.emit("CreateLobbyResponseError", {
        error: "A lobby with the chosen name does already exist.",
      });
      return;
    }
    const gameTypeEntry = await prisma.gameType.findFirst({
      where: {
        name: gameType,
      },
    });
    if (!gameTypeEntry) {
      socket.emit("CreateLobbyResponseError", {
        error: "Invalid game type selected.",
      });
      return;
    }
    lobby = await prisma.lobby.create({
      data: {
        name: lobbyName,
        gameTypeId: gameTypeEntry.id,
        gameStarted: false,
        ownerId: user.id,
      },
    });
    await prisma.gamePlayer.create({
      data: {
        lobbyId: lobby.id,
        userId: user.id,
      },
    });
    setPhase(socket, PhaseLobby);
    socket.emit("CreateLobbyResponseSuccess", { lobbyId: lobby.id });
    sendUpdatedLobbies();
  };
  asyncExecution();
};

const joinLobby = (
  socket: SocketServerSide,
  { lobbyId, spectator }: { lobbyId: string; spectator: boolean }
) => {
  const asyncExecution = async () => {
    const user = await prisma.user.findFirst({
      where: {
        id: socket.data.sessionId,
      },
    });
    if (!user) {
      socket.emit("GenericResponseError", {
        error: "User does not exist.",
      });
      return;
    }

    const lobby = await prisma.lobby.findFirst({
      where: {
        id: lobbyId,
      },
      include: {
        GameType: true,
        Players: {
          where: {
            User: {
              connected: true,
            },
          },
        },
      },
    });
    if (!lobby) {
      socket.emit("GenericResponseError", {
        error: "Lobby does not exist.",
      });
      return;
    }
    if (lobby.Players.find((player) => player.userId === user.id)) {
      socket.emit("GenericResponseError", {
        error: "You're already in this lobby.",
      });
      return;
    }
    const fullLobby = !spectator
      ? lobby.Players.filter((player) => !player.spectator).length >
        lobby.GameType.maxPlayers
      : lobby.Players.filter((player) => player.spectator).length >
        MAX_SPECTATORS;
    if (fullLobby) {
      socket.emit("GenericResponseError", {
        error: "Lobby is full.",
      });
      return;
    }

    let gameLobby: BaseGameModel | undefined = undefined;
    if (lobby.gameStarted) {
      gameLobby = findGameBasedOnLobby(lobby);
      if (!gameLobby) {
        socket.emit("GenericResponseError", {
          error: "Could not join game as spectator.",
        });
        return;
      }
      gameLobby.spectatorJoin({
        id: user.id,
        name: user.username,
      });
    }

    await prisma.gamePlayer.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        lobbyId: lobby.id,
        ready: false,
        spectator,
      },
      update: {
        lobbyId: lobby.id,
        ready: false,
        spectator,
      },
    });

    setPhase(socket, PhaseLobby);
    if (spectator && gameLobby) {
      await updateUserData(socket);
    }
    const gameType: GameTypes | null =
      (lobby?.GameType?.name as GameTypes) ?? null;
    socket.emit("JoinLobbyResponseSuccess", {
      lobbyId,
      gameType: gameLobby ? gameType : null,
    });
    sendUpdatedLobbies();
    sendUpdatedLobby(lobby.id);
  };
  asyncExecution();
};

const requestUpdateLobbies = (socket: SocketServerSide) => {
  sendUpdatedLobbiesToPlayer(socket);
};

export const PhaseLobbies: Phase = {
  id: PhaseIdLobbies,
  functions: {
    [CreateLobby]: createLobby,
    [JoinLobby]: joinLobby,
    [RequestUpdateLobbies]: requestUpdateLobbies,
  },
};
