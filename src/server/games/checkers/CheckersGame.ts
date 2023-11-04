import BaseGameModel from "@/server/games/repository/BaseGameModel";
import BasePlayerModel from "@/server/games/repository/BasePlayerModel";
import { SocketServerSide } from "@/server/types";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/checkers/game";

export default class CheckersGame extends BaseGameModel<BasePlayerModel> {
  constructor(key: string, playerIds: string[]) {
    super(key, playerIds);
  }

  initializePlayers(playerIds: string[]): void {
    const players: BasePlayerModel[] = [];
    for (const playerId of playerIds) {
      players.push(new BasePlayerModel(playerId));
    }
    this.players = players;
  }

  initializeGameImplementation(): void {
    throw new Error("Method not implemented.");
  }
  sendGameStatePayload(socket: SocketServerSide): void {
    throw new Error("Method not implemented.");
  }
  startGame(): void {
    throw new Error("Method not implemented.");
  }

  movePiece(payload: OriginTargetPayload) {}
}
