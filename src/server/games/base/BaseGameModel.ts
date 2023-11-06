import { type GameState } from "@prisma/client";

import prisma from "@/server/db";
import BasePlayerModel, {
  BasePlayerModelInterface,
} from "@/server/games/base/BasePlayerModel";
import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import { deleteLobby, getSocketsByUserIds } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

export interface BaseGameModelInterface<
  PlayerInterface extends BasePlayerModelInterface = BasePlayerModelInterface,
> {
  id: string;
  players: PlayerInterface[];
  gameStarted: boolean;
  gameToBeDeleted: GameToBeDeleted;
  deleteTimeoutReference: DeleteTimeoutReference | null;
}

interface DeleteTimeoutReference {
  seconds: number;
  maxSeconds: number;
  reference: NodeJS.Timeout | null;
}

export interface PlayerData {
  id: string;
  name: string;
}

export type GameToBeDeleted = {
  title: string;
  message: string;
} | null;

export default abstract class BaseGameModel<
    GameInterface extends BaseGameModelInterface = BaseGameModelInterface,
    PlayerModel extends BasePlayerModel = BasePlayerModel,
  >
  implements BaseGameModelInterface, RebuildableModelInterface<GameInterface>
{
  id: string;
  players: PlayerModel[];
  gameStarted: boolean;
  gameToBeDeleted: {
    title: string;
    message: string;
  } | null;
  deleteTimeoutReference: DeleteTimeoutReference | null = null;

  constructor(key: string, playerIds: PlayerData[]) {
    this.gameToBeDeleted = null;
    this.id = key;
    this.gameStarted = false;
    this.players = [];
    this.initializePlayers(playerIds);
  }

  destroy() {
    this.destroyGame();
    deleteLobby(this.id);
  }

  abstract destroyGame(): void;

  abstract rebuildImplementation(data: GameInterface): void;

  abstract createState(): GameInterface;

  abstract initializePlayers(players: PlayerData[]): void;

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

  handleConnectionChange(
    playerId: string,
    connected: boolean
  ): { allConnected: boolean } {
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return {
        allConnected: false,
      };
    }
    player.connected = connected;
    const connectedPlayers = this.players.filter((player) => player.connected);
    const allConnected = connectedPlayers.length === this.players.length;
    return {
      allConnected,
    };
  }

  handleConnect(playerId: string): void {
    const { allConnected } = this.handleConnectionChange(playerId, true);
    if (!allConnected) {
      this.sendGameState();
      return;
    }
    const ref = this.deleteTimeoutReference;
    if (!ref) {
      return;
    }
    if (ref.reference) {
      clearInterval(ref.reference);
    }
    this.deleteTimeoutReference = null;
    this.gameToBeDeleted = null;
    this.sendGameState();
  }

  handleDisconnect(playerId: string): void {
    const { allConnected } = this.handleConnectionChange(playerId, false);
    if (allConnected) {
      this.sendGameState();
      return;
    }
    this.scheduleDelete(
      "Not all players are connected",
      (playersDisconnected: string[], secondsLeft) => {
        const playerNames = playersDisconnected.join(", ");
        const playersDisconnectedMessage =
          playersDisconnected.length > 1
            ? `The following players are disconnected: (${playerNames})`
            : `The following player is disconnected: (${playerNames})`;
        return `${playersDisconnectedMessage}
        
        This game will be deleted in ${secondsLeft}`;
      },
      60
    );
  }

  scheduleDelete(
    title: string,
    message: (playersDisconnected: string[], secondsLeft: number) => string,
    afterSeconds: number
  ) {
    if (this.deleteTimeoutReference) {
      return;
    }
    this.deleteTimeoutReference = {
      seconds: 0,
      maxSeconds: afterSeconds,
      reference: null,
    };

    const sendScheduledDeleteMessage = () => {
      const ref = this.deleteTimeoutReference;
      if (!ref) {
        return;
      }
      const secondsLeft = ref.maxSeconds - ref.seconds;
      this.gameToBeDeleted = {
        title,
        message: message(
          this.players
            .filter((player) => !player.connected)
            .map((player) => player.name),
          secondsLeft
        ),
      };
      this.sendGameState();
    };

    sendScheduledDeleteMessage();
    const interval = setInterval(() => {
      const ref = this.deleteTimeoutReference;
      if (!ref) {
        clearInterval(interval);
        return;
      }
      ref.seconds += 1;
      sendScheduledDeleteMessage();
      if (ref.seconds < ref.maxSeconds || !ref.reference) {
        return;
      }
      clearInterval(ref.reference);
      this.deleteTimeoutReference = null;
      this.destroy();
    }, 1000);
    this.deleteTimeoutReference.reference = interval;
  }

  leaveGame(playerId: string) {
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return;
    }
    player.connected = false;
    this.scheduleDelete(
      `Players have left the game`,
      (playersDisconnected: string[], secondsLeft: number) => {
        const playerNames = playersDisconnected.join(", ");
        const playersDisconnectedMessage =
          playersDisconnected.length > 1
            ? `The following players have left the game: (${playerNames})`
            : `The following player has left the game: (${playerNames})`;
        return `${playersDisconnectedMessage}
        
        This game will be deleted in ${secondsLeft}`;
      },
      10
    );
  }

  getPlayer(playerId: string): PlayerModel | undefined {
    return this.players.find((player) => player.id === playerId);
  }
}
