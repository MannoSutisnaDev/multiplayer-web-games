import BasePlayerModel from "@/server/games/repository/BasePlayerModel";
import { getSocketsByUserIds } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

export default abstract class BaseGameModel<
  T extends BasePlayerModel = BasePlayerModel,
> {
  id: string;
  players: T[];
  gameStarted: boolean;
  constructor(key: string, playerIds: string[]) {
    this.id = key;
    this.gameStarted = false;
    this.players = [];
    this.initializePlayers(playerIds);
  }

  abstract initializePlayers(playerIds: string[]): void;

  abstract initializeGameImplementation(): void;

  abstract startGame(): void;

  abstract sendGameStatePayload(socket: SocketServerSide): void;

  getId(): string {
    return this.id;
  }

  setPlayerReady(playerId: string): boolean {
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return false;
    }
    player.ready = true;
    const readyPlayers = this.players.filter((player) => player.ready);
    if (readyPlayers.length === this.players.length) {
      this.startGame();
    }
    return true;
  }

  getGameStarted(): boolean {
    return this.gameStarted;
  }

  sendGameState() {
    const userIds = this.players.map((player) => player.id);
    const sockets = getSocketsByUserIds(userIds);
    for (const socket of sockets) {
      this.sendGameStatePayload(socket);
    }
  }

  leaveGame(playerId: string) {
    //TODO
  }

  intializeGame() {
    this.initializeGameImplementation();
    this.gameStarted = true;
    this.sendGameState();
  }
}
