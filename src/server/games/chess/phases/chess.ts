import { User } from "@prisma/client";

import ChessGame from "@/server/games/chess/ChessGame";
import { repository } from "@/server/games/chess/ChessRepository";
import { findUser, leaveLobby } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import {
  LeaveGame,
  MovePiece,
  PhaseIdChess,
  ReadyToPlay,
  RequestGameStateUpdate,
} from "@/shared/types/socket-communication/games/chess";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/game-types";
import { Phase } from "@/shared/types/socket-communication/types";

const findUserAndGame = async (
  socket: SocketServerSide
): Promise<{
  game: ChessGame;
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
    game.movePiece(socket, payload);
  };
  asyncExecution();
};

const leaveGame = (socket: SocketServerSide) => {
  console.log("leave lobby");
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

export const PhaseChess: Phase = {
  id: PhaseIdChess,
  functions: {
    [ReadyToPlay]: readyToPlay,
    [MovePiece]: movePiece,
    [LeaveGame]: leaveGame,
    [RequestGameStateUpdate]: requestGameStateUpdate,
  },
};
