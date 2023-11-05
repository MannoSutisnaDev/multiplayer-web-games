import BaseGameModel, {
  BaseGameModelInterface,
  PlayerData,
} from "@/server/games/base/BaseGameModel";
import CheckersPlayer, {
  CheckersPlayerInterface,
} from "@/server/games/checkers/CheckersPlayer";
import { repository } from "@/server/games/checkers/CheckersRepository";
import { SocketServerSide } from "@/server/types";
import {
  GameData,
  OriginTargetPayload,
} from "@/shared/types/socket-communication/games/checkers";

export interface CheckersGameInterface
  extends BaseGameModelInterface<CheckersPlayerInterface> {
  gameData: GameData | null;
}

export default class CheckersGame extends BaseGameModel<
  CheckersGameInterface,
  CheckersPlayer
> {
  gameData: GameData | null = null;
  constructor(key: string, players: PlayerData[]) {
    super(key, players);
    this.initializeGame();
  }

  destroyGame() {
    repository.delete(this);
  }

  rebuildImplementation(data: CheckersGameInterface): void {
    this.id = data.id;
    this.gameStarted = data.gameStarted;
    this.gameData = data.gameData;
    const players: CheckersPlayer[] = [];
    for (const player of data.players) {
      const checkersPlayer = new CheckersPlayer();
      checkersPlayer.rebuildImplementation(player);
      players.push(checkersPlayer);
    }
    this.players = players;
  }

  createState() {
    const players = this.players.map((player) => {
      const playerData: CheckersPlayerInterface = {
        id: player.id,
        name: player.name,
        ready: player.ready,
        connected: player.connected,
        extraData: player.extraData,
      };
      return playerData;
    });
    return {
      id: this.id,
      gameToBeDeleted: this.gameToBeDeleted,
      gameStarted: this.gameStarted,
      gameData: this.gameData,
      players,
      deleteTimeoutReference: null,
    };
  }

  initializeGame() {
    this.gameData = { initialized: true, variable: "" };
  }

  initializePlayers(players: PlayerData[]): void {
    const gamePlayers: CheckersPlayer[] = [];
    for (const player of players) {
      gamePlayers.push(new CheckersPlayer(player.id, player.name));
    }
    this.players = gamePlayers;
  }

  initializeGameImplementation(): void {
    this.gameData = { initialized: true, variable: "" };
  }

  sendGameStatePayload(socket: SocketServerSide): void {
    if (this.gameData === null) {
      return;
    }
    socket.emit("CheckersGameStateUpdateResponse", {
      gameData: this.gameData,
      gameToBeDeleted: this.gameToBeDeleted,
    });
  }

  startGame(): void {
    this.sendGameState();
  }

  handleTest(text: string) {
    if (!this.gameData) {
      return;
    }
    this.gameData.variable = text;
    this.saveState();
    this.sendGameState();
  }

  movePiece(payload: OriginTargetPayload) {}
}
