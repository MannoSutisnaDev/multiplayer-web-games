import prisma from "@/server/db";
import BaseGameRepository from "@/server/games/base/BaseGameRepository";
import CheckersGame from "@/server/games/checkers/CheckersGame";
import { PlayerData } from "@/server/games/types";
import { GameTypes } from "@/shared/types/socket-communication/general";

export default class CheckersRepository extends BaseGameRepository<CheckersGame> {}

export const repository = new CheckersRepository();

export const createGame = (id: string, players: PlayerData[]): CheckersGame => {
  if (repository.findOne(id)) {
    throw new Error("Game with lobby ID already exists.");
  }
  const game = new CheckersGame(id, players);
  repository.save(game);
  return game;
};

export const rebuildGames = async () => {
  const lobbies = await prisma.lobby.findMany({
    where: {
      gameStarted: true,
      GameType: {
        name: GameTypes.Checkers,
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
