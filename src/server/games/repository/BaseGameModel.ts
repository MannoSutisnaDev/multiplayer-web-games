import BasePlayerModel from "@/server/games/repository/BasePlayerModel";
import { getSocketsByUserIds } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { GameTypes } from "@/shared/types/socket-communication/general";

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

  abstract initializeGame(): void;

  abstract sendGameStatePayload(socket: SocketServerSide): void;

  getId(): string {
    return this.id;
  }

  setPlayerReady(playerId: string) {
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return;
    }
    player.ready = true;
    const readyPlayers = this.players.filter((player) => player.ready);
    if (readyPlayers.length < this.players.length) {
      return;
    }
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

  startGame() {
    this.initializeGame();
    this.gameStarted = true;
    this.sendGameState();
  }
}
