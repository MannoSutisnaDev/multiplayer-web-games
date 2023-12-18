import prisma from "@/server/db";
import BaseGameRepository from "@/server/games/base/BaseGameRepository";
import ChessGame from "@/server/games/chess/ChessGame";
import { PlayerData } from "@/server/games/types";
import { GameTypes } from "@/shared/types/socket-communication/general";

export default class ChessRepository extends BaseGameRepository<ChessGame> {}

export const repository = new ChessRepository();

export const createGame = (id: string, players: PlayerData[]): ChessGame => {
  if (repository.findOne(id)) {
    throw new Error("Game with lobby ID already exists.");
  }
  const game = new ChessGame(id, players);
  repository.save(game);
  return game;
};

export const rebuildGames = async () => {
  const lobbies = await prisma.lobby.findMany({
    where: {
      gameStarted: true,
      GameType: {
        name: GameTypes.Chess,
      },
    },
  });
  for (const lobby of lobbies) {
    const game = createGame(lobby.id, []);
    try {
      game.rebuild();
    } catch (e) {
      repository.delete(game);
    }
    repository.save(game);
  }
};
