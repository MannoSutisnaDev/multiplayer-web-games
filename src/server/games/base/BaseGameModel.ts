import { type GameState } from "@prisma/client";

import prisma from "@/server/db";
import BasePlayerModel from "@/server/games/base/BasePlayerModel";
import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import {
  BaseGameDataInterface,
  BaseGameModelInterface,
  DeleteGameTypes,
  DeleteTimeoutReference,
  GameStateModifier,
  InterruptingMessage,
  PlayerData,
} from "@/server/games/types";
import { deleteLobby, getSocketsByUserIds } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

export default abstract class BaseGameModel<
    GameInterface extends BaseGameModelInterface = BaseGameModelInterface,
    PlayerModel extends BasePlayerModel = BasePlayerModel,
    GameDataInterface extends BaseGameDataInterface = BaseGameDataInterface,
  >
  implements BaseGameModelInterface, RebuildableModelInterface<GameInterface>
{
  id: string;
  players: PlayerModel[];
  gameStarted: boolean;
  deleteTimeoutReference: DeleteTimeoutReference | null = null;
  gameStateModifiers: Record<string, GameStateModifier>;

  constructor(key: string, playerIds: PlayerData[]) {
    this.id = key;
    this.gameStarted = false;
    this.players = [];
    this.gameStateModifiers = {};
    this.initializePlayers(playerIds);
  }

  destroy(hardDelete: boolean = false) {
    this.destroyGame();
    if (!hardDelete) {
      return;
    }
    deleteLobby(this.id);
  }

  abstract destroyGame(): void;

  abstract rebuildImplementation(data: GameInterface): void;

  abstract createState(): GameInterface;

  abstract initializePlayers(players: PlayerData[]): void;

  abstract startGame(): void;

  abstract createGameStateImplementation(
    socket: SocketServerSide
  ): GameDataInterface;

  removeGameStateModifier(key: string) {
    delete this.gameStateModifiers[key];
  }

  addGameStateModifier(key: string, modifier: GameStateModifier) {
    this.gameStateModifiers[key] = modifier;
  }

  createGameState(socket: SocketServerSide): GameDataInterface {
    const gameState = this.createGameStateImplementation(socket);
    for (const modifier of Object.values(this.gameStateModifiers)) {
      modifier(socket, gameState);
    }
    return gameState;
  }

  abstract sendGameStatePayload(
    socket: SocketServerSide,
    data: GameDataInterface
  ): void;

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
    const deleteTimeoutReference = decodedState.deleteTimeoutReference;
    if (deleteTimeoutReference) {
      deleteTimeoutReference.reference = null;
    }
    this.deleteTimeoutReference = deleteTimeoutReference;
    this.rebuildImplementation(decodedState);
    this.initializeDeleteGameTimeout();
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

  initializeDeleteGameTimeout(): boolean {
    const deleteRef = this.deleteTimeoutReference;
    if (!deleteRef) {
      return false;
    }
    const secondsLeft = this.getSecondsLeftDeleteTimeoutReference();
    switch (deleteRef.deleteGameType) {
      case DeleteGameTypes.Disconnected:
        this.scheduleDeleteDisconnected(secondsLeft);
        break;
      case DeleteGameTypes.PlayersLeft:
        this.scheduleDeletePlayersLeft(secondsLeft);
        break;
      default:
        return false;
    }
    return true;
  }

  getId(): string {
    return this.id;
  }

  allPlayersReady(): boolean {
    const readyPlayers = this.players.filter((player) => player.ready);
    return readyPlayers.length === this.players.length;
  }

  setPlayerReady(playerId: string): boolean {
    if (this.allPlayersReady()) {
      return true;
    }
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return false;
    }
    player.ready = true;
    if (!this.gameStarted && this.allPlayersReady()) {
      this.gameStarted = true;
      this.startGame();
      this.sendGameState();
    }
    return true;
  }

  getGameStarted(): boolean {
    return this.gameStarted;
  }

  sendGameState() {
    if (!this.gameStarted) {
      return;
    }
    this.saveState();
    const playerIds = this.players.map((player) => player.id);
    const sockets = getSocketsByUserIds(playerIds);
    for (const socket of sockets) {
      this.sendGameStatePayload(socket, this.createGameState(socket));
    }
  }

  sendGameStateToPlayer(socket: SocketServerSide) {
    this.saveState();
    this.sendGameStatePayload(socket, this.createGameState(socket));
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
    if (!ref || ref.deleteGameType !== DeleteGameTypes.Disconnected) {
      return;
    }
    if (ref.reference) {
      clearInterval(ref.reference);
      this.removeGameStateModifier(ref.deleteGameType);
    }
    this.deleteTimeoutReference = null;
    this.sendGameState();
  }

  handleDisconnect(playerId: string): void {
    const { allConnected } = this.handleConnectionChange(playerId, false);
    if (allConnected) {
      this.sendGameState();
      return;
    }
    this.scheduleDeleteDisconnected();
  }

  creatDisconnectedInterruptingMessage(): InterruptingMessage {
    const secondsLeft = this.getSecondsLeftDeleteTimeoutReference();
    const playerNames = this.players
      .filter((player) => !player.connected)
      .map((player) => player.name)
      .join(", ");
    const disconnectedMessage =
      playerNames.length > 1
        ? `The following players are disconnected: (${playerNames})`
        : `The following player is disconnected: (${playerNames})`;
    const message = `${disconnectedMessage}

      This game will be deleted in ${secondsLeft}`;
    return {
      title: "Not all players are connected",
      message,
    };
  }

  scheduleDeleteDisconnected(deleteAfterSeconds: number = 60) {
    const func: GameStateModifier = (socket, gameData) => {
      gameData.interruptingMessage =
        this.creatDisconnectedInterruptingMessage();
    };
    this.scheduleDelete(DeleteGameTypes.Disconnected, func, deleteAfterSeconds);
  }

  getSecondsLeftDeleteTimeoutReference(): number {
    const ref = this.deleteTimeoutReference;
    if (!ref) {
      return 0;
    }
    return ref.maxSeconds - ref.seconds;
  }

  creatPlayersLeftInterruptingMessage(): InterruptingMessage {
    const secondsLeft = this.getSecondsLeftDeleteTimeoutReference();
    const playerNames = this.players
      .filter((player) => !player.connected)
      .map((player) => player.name)
      .join(", ");
    const playerLabel = playerNames.length > 1 ? "Players have" : "Player has";
    const leftPlayersMessage =
      playerNames.length > 1
        ? `The following players have left the game: (${playerNames})`
        : `The following player has left the game: (${playerNames})`;
    const message = `${leftPlayersMessage}
    
    This game will be deleted in ${secondsLeft}`;
    return {
      title: `${playerLabel} left the game`,
      message,
    };
  }

  scheduleDeletePlayersLeft(deleteAfterSeconds: number = 10) {
    const func: GameStateModifier = (socket, gameData) => {
      gameData.interruptingMessage = this.creatPlayersLeftInterruptingMessage();
    };
    this.scheduleDelete(DeleteGameTypes.PlayersLeft, func, deleteAfterSeconds);
  }

  scheduleDelete(
    type: DeleteGameTypes,
    gameStateModifier: GameStateModifier,
    deleteAfterSeconds: number
  ) {
    if (this.deleteTimeoutReference?.reference) {
      return;
    }
    if (!this.deleteTimeoutReference) {
      this.deleteTimeoutReference = {
        deleteGameType: type,
        seconds: 0,
        maxSeconds: deleteAfterSeconds,
        reference: null,
      };
    }

    this.addGameStateModifier(type, gameStateModifier);
    this.sendGameState();
    const interval = setInterval(() => {
      const ref = this.deleteTimeoutReference;
      if (!ref) {
        clearInterval(interval);
        return;
      }
      ref.seconds += 1;
      this.sendGameState();
      if (ref.seconds < ref.maxSeconds || !ref.reference) {
        return;
      }
      clearInterval(ref.reference);
      this.deleteTimeoutReference = null;
      this.destroy(true);
      this.removeGameStateModifier(type);
    }, 1000);
    this.deleteTimeoutReference.reference = interval;
  }

  leaveGame(playerId: string) {
    const player = this.players.find((player) => player.id === playerId);
    if (!player) {
      return;
    }
    player.connected = false;
    this.scheduleDeletePlayersLeft();
  }

  getPlayer(playerId: string): PlayerModel | undefined {
    return this.players.find((player) => player.id === playerId);
  }
}
