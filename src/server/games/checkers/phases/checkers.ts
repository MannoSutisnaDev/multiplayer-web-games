import { type User } from "@prisma/client";

import prisma from "@/server/db";
import CheckersGame from "@/server/games/checkers/CheckersGame";
import { repository } from "@/server/games/checkers/CheckersRepository";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { GeneralClientToServer } from "@/server/lobby/phases/general";
import { PhaseLobbies } from "@/server/lobby/phases/lobbies";
import {
  findUser,
  sendUpdatedLobbies,
  updateUserData,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import {
  LeaveGame,
  MovePiece,
  OriginTargetPayload,
  PhaseIdCheckers,
  ReadyToPlay,
  RequestGameStateUpdate,
  Test,
} from "@/shared/types/socket-communication/games/checkers";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";
import { Phase } from "@/shared/types/socket-communication/types";

const findUserAndGame = async (
  socket: SocketServerSide
): Promise<{
  game: CheckersGame;
  user: User;
} | null> => {
  const user = await findUser(socket);
  if (!user || !user.joinedLobbyId) {
    socket.emit("GenericResponseError", { error: "Can't find user." });
    return null;
  }
  const game = repository.findOne(user.joinedLobbyId);
  if (!game) {
    socket.emit("GenericResponseError", { error: "Game not found." });
    return null;
  }
  return {
    game,
    user,
  };
};

const readyToPlay = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const result = await findUserAndGame(socket);
    if (!result) {
      return;
    }
    const { user, game } = result;
    game.setPlayerReady(user.id);
  };
  asyncExecution();
};

const movePiece = (socket: SocketServerSide, payload: OriginTargetPayload) => {
  const asyncExecution = async () => {
    const result = await findUserAndGame(socket);
    if (!result) {
      return;
    }
    const { game } = result;
    game.movePiece(payload);
  };
  asyncExecution();
};

const leaveGame = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const result = await findUserAndGame(socket);
    if (!result) {
      return;
    }
    const { user } = result;
    await prisma.user.update({
      where: { id: user.id },
      data: { joinedLobbyId: null },
    });
    setPhase(socket, PhaseLobbies);
    updateUserData(socket);
    sendUpdatedLobbies();
  };
  asyncExecution();
};

const disconnect = (socket: SocketServerSide) => {
  GeneralClientToServer.disconnect(socket);
};

const requestGameStateUpdate = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const result = await findUserAndGame(socket);
    if (!result) {
      return;
    }
    const { game } = result;
    game.sendGameStateToPlayer(socket);
  };
  asyncExecution();
};

const test = (socket: SocketServerSide, text: string) => {
  const asyncExecution = async () => {
    const result = await findUserAndGame(socket);
    if (!result) {
      return;
    }
    const { game } = result;
    game.handleTest(text);
  };
  asyncExecution();
};

export const PhaseCheckers: Phase = {
  id: PhaseIdCheckers,
  functions: {
    [ReadyToPlay]: readyToPlay,
    [MovePiece]: movePiece,
    [LeaveGame]: leaveGame,
    [Disconnect]: disconnect,
    [RequestGameStateUpdate]: requestGameStateUpdate,
    [Test]: test,
  },
};
