import { type User } from "@prisma/client";

import CheckersGame from "@/server/games/checkers/CheckersGame";
import { repository } from "@/server/games/checkers/CheckersRepository";
import { findUser, leaveLobby } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import {
  LeaveGame,
  MovePiece,
  PhaseIdCheckers,
  ReadyToPlay,
  RequestGameStateUpdate,
} from "@/shared/types/socket-communication/games/checkers";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/game-types";
import { Phase } from "@/shared/types/socket-communication/types";

const findUserAndGame = async (
  socket: SocketServerSide
): Promise<{
  game: CheckersGame;
  user: User;
} | null> => {
  const user = await findUser(socket);
  if (!user || !user.GamePlayer) {
    socket.emit("GenericResponseError", { error: "Can't find user." });
    return null;
  }
  const game = repository.findOne(user.GamePlayer.lobbyId);
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
    game.movePiece(socket, payload);
  };
  asyncExecution();
};

const leaveGame = (socket: SocketServerSide) => {
  leaveLobby(socket);
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

export const PhaseCheckers: Phase = {
  id: PhaseIdCheckers,
  functions: {
    [ReadyToPlay]: readyToPlay,
    [MovePiece]: movePiece,
    [LeaveGame]: leaveGame,
    [RequestGameStateUpdate]: requestGameStateUpdate,
  },
};
