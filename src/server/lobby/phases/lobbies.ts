import prisma from "@/server/db";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { PhaseLobby } from "@/server/lobby/phases/lobby";
import {
  sendUpdatedLobbies,
  sendUpdatedLobbiesToPlayer,
  sendUpdatedLobby,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
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
  { lobbyId }: { lobbyId: string }
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
          include: {
            User: true,
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
    if (lobby.Players.length + 1 > lobby.GameType.maxPlayers) {
      socket.emit("GenericResponseError", {
        error: "Lobby is full.",
      });
      return;
    }
    await prisma.gamePlayer.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        lobbyId: lobby.id,
        ready: false,
        spectator: false,
      },
      update: {
        lobbyId: lobby.id,
        ready: false,
        spectator: false,
      },
    });
    setPhase(socket, PhaseLobby);
    socket.emit("JoinLobbyResponseSuccess", { lobbyId });
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
