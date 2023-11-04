import CheckersGame from "@/server/games/checkers/CheckersGame";
import BaseGameRepository from "@/server/games/repository/BaseGameRepository";
export default class CheckersRepository extends BaseGameRepository<CheckersGame> {}

const checkersRepository = new CheckersRepository();

const createCheckersGame = (id: string, playerIds: string[]) => {
  if (!!checkersRepository.findOne(id)) {
    throw new Error("Game with lobby ID already exists.");
  }
  checkersRepository.save(new CheckersGame(id, playerIds));
  const game = checkersRepository.findOne(id);
};

export { checkersRepository, createCheckersGame };
