import prisma from "@/server/db";
import { SocketServerSide } from "@/server/types";
import { GameTypes } from "@/shared/types/socket-communication/general";
import {
  CreateLobby,
  JoinLobby,
  PhaseIdLobbies,
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
    lobby = await prisma.lobby.create({
      data: {
        name: lobbyName,
        gameTypeId: gameType,
      },
    });
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        joinedLobbyId: lobby.id,
        lobbyOwner: true,
      },
    });
    socket.emit("CreateLobbyResponseSuccess", { lobbyId: lobby.id });
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
      socket.emit("JoinLobbyResponseError", {
        error: "User does not exist.",
      });
      return;
    }
    const lobby = await prisma.lobby.findFirst({
      where: {
        id: lobbyId,
      },
      include: {
        GameType: {},
        Users: {},
      },
    });
    if (!lobby) {
      socket.emit("JoinLobbyResponseError", {
        error: "Lobby does not exist.",
      });
      return;
    }
    if (lobby.Users.length + 1 >= lobby.GameType.maxPlayers) {
      socket.emit("JoinLobbyResponseError", {
        error: "Lobby is full.",
      });
      return;
    }
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        joinedLobbyId: lobby.id,
      },
    });
    socket.emit("JoinLobbyResponseSuccess");
  };
  asyncExecution();
};

export const PhaseLobbies: Phase = {
  id: PhaseIdLobbies,
  functions: {
    [CreateLobby]: createLobby,
    [JoinLobby]: joinLobby,
  },
};
