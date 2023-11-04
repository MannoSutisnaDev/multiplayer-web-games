import BaseGameModel from "@/server/games/repository/BaseGameModel";
import BasePlayerModel from "@/server/games/repository/BasePlayerModel";
import { SocketServerSide } from "@/server/types";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/checkers/game";

export default class CheckersGame extends BaseGameModel<BasePlayerModel> {
  gameData: {
    initialized: boolean;
  } | null = null;
  constructor(key: string, playerIds: string[]) {
    super(key, playerIds);
    this.initializeGame();
  }

  initializeGame() {
    this.gameData = { initialized: true };
  }

  initializePlayers(playerIds: string[]): void {
    const players: BasePlayerModel[] = [];
    for (const playerId of playerIds) {
      players.push(new BasePlayerModel(playerId));
    }
    this.players = players;
  }

  initializeGameImplementation(): void {
    this.gameData = {
      initialized: true,
    };
  }
  sendGameStatePayload(socket: SocketServerSide): void {
    if (this.gameData === null) {
      return;
    }
    socket.emit("CheckersGameStateUpdateResponse", this.gameData);
  }

  startGame(): void {
    this.sendGameState();
  }

  movePiece(payload: OriginTargetPayload) {}
}
