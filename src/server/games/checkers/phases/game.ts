import prisma from "@/server/db";
import { checkersRepository } from "@/server/games/checkers/CheckersRepository";
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
} from "@/shared/types/socket-communication/games/checkers/game";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";
import { Phase } from "@/shared/types/socket-communication/types";

const readyToPlay = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const user = await findUser(socket);
    if (!user || !user.joinedLobbyId) {
      socket.emit("GenericResponseError", { error: "Can't search for game." });
      return;
    }
    const game = checkersRepository.findOne(user.joinedLobbyId);
    if (!game) {
      socket.emit("GenericResponseError", { error: "Game not found." });
      return;
    }
    game.setPlayerReady(user.id);
  };
  asyncExecution();
};

const movePiece = (socket: SocketServerSide, payload: OriginTargetPayload) => {
  const asyncExecution = async () => {
    const user = await findUser(socket);
    if (!user || !user.joinedLobbyId) {
      socket.emit("GenericResponseError", { error: "Can't search for game." });
      return;
    }
    const game = checkersRepository.findOne(user.joinedLobbyId);
    if (!game) {
      socket.emit("GenericResponseError", { error: "Game not found." });
      return;
    }
    game.movePiece(payload);
  };
  asyncExecution();
};

const leaveGame = (socket: SocketServerSide) => {
  const asyncExecution = async () => {
    const user = await findUser(socket);
    if (!user || !user.joinedLobbyId) {
      socket.emit("GenericResponseError", { error: "Can't find user." });
      return;
    }
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

export const PhaseCheckers: Phase = {
  id: PhaseIdCheckers,
  functions: {
    [ReadyToPlay]: readyToPlay,
    [MovePiece]: movePiece,
    [LeaveGame]: leaveGame,
    [Disconnect]: disconnect,
  },
};
