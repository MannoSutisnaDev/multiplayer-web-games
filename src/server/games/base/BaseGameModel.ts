import { type GameState } from "@prisma/client";

import prisma from "@/server/db";
import BasePlayerModel, {
  BasePlayerModelInterface,
} from "@/server/games/base/BasePlayerModel";
import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import { getSocketsByUserIds } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

export interface BaseGameModelInterface<
  PlayerInterface extends BasePlayerModelInterface = BasePlayerModelInterface,
> {
  id: string;
  players: PlayerInterface[];
  gameStarted: boolean;
}

export default abstract class BaseGameModel<
    GameInterface extends BaseGameModelInterface = BaseGameModelInterface,
    PlayerModel extends BasePlayerModel = BasePlayerModel,
  >
  implements BaseGameModelInterface, RebuildableModelInterface<GameInterface>
{
  id: string;
  players: PlayerModel[];
  gameStarted: boolean;

  constructor(key: string, playerIds: string[]) {
    this.id = key;
    this.gameStarted = false;
    this.players = [];
    this.initializePlayers(playerIds);
  }

  abstract rebuildImplementation(data: GameInterface): void;

  abstract createState(): GameInterface;

  abstract initializePlayers(playerIds: string[]): void;

  abstract startGame(): void;

  abstract sendGameStatePayload(socket: SocketServerSide): void;

  async rebuild() {
    let gameState: GameState | null;
    try {
      gameState = await prisma.gameState.findFirst({
        where: { lobbyId: this.id },
      });
      if (!gameState) {
        return;
      }
    } catch (e) {
      console.error({
        message: `Could not fetch game state for lobby: ${this.id}`,
        error: e,
      });
      return;
    }
    let decodedState: GameInterface;
    try {
      decodedState = JSON.parse(gameState.state.toString("utf8"));
    } catch (e) {
      console.error({
        message: `Could not parse JSON string for lobby: ${gameState.lobbyId}`,
        error: e,
      });
      return;
    }
    this.rebuildImplementation(decodedState);
  }

  async saveState() {
    const state = Buffer.from(JSON.stringify(this.createState()), "utf8");
    try {
      await prisma.gameState.upsert({
        where: { lobbyId: this.id },
        create: {
          lobbyId: this.id,
          state,
        },
        update: {
          state,
        },
      });
    } catch (e) {
      console.error({
        message: `Could not save game state for lobby: ${this.id}`,
        error: e,
      });
    }
  }

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
    if (!this.gameStarted && readyPlayers.length === this.players.length) {
      this.gameStarted = true;
      this.startGame();
    }
    return true;
  }

  getGameStarted(): boolean {
    return this.gameStarted;
  }

  sendGameState() {
    this.saveState();
    const playerIds = this.players.map((player) => player.id);
    const sockets = getSocketsByUserIds(playerIds);
    for (const socket of sockets) {
      this.sendGameStatePayload(socket);
    }
  }

  sendGameStateToPlayer(socket: SocketServerSide) {
    this.saveState();
    this.sendGameStatePayload(socket);
  }

  handleConnect() {}

  handleDisconnect() {}

  leaveGame(playerId: string) {
    //TODO
  }
}
