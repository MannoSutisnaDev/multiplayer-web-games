import BaseGameModel, {
  BaseGameModelInterface,
} from "@/server/games/base/BaseGameModel";
import CheckersPlayer, {
  CheckersPlayerInterface,
} from "@/server/games/checkers/CheckersPlayer";
import { SocketServerSide } from "@/server/types";
import { OriginTargetPayload } from "@/shared/types/socket-communication/games/checkers";

export interface CheckersGameInterface
  extends BaseGameModelInterface<CheckersPlayerInterface> {
  gameData: {
    initialized: boolean;
    variable: string;
  } | null;
}

export default class CheckersGame extends BaseGameModel<
  CheckersGameInterface,
  CheckersPlayer
> {
  gameData: {
    initialized: boolean;
    variable: string;
  } | null = null;
  constructor(key: string, playerIds: string[]) {
    super(key, playerIds);
    this.initializeGame();
    this.saveState();
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
        ready: player.ready,
        extraData: player.extraData,
      };
      return playerData;
    });
    return {
      id: this.id,
      gameStarted: this.gameStarted,
      gameData: this.gameData,
      players,
    };
  }

  initializeGame() {
    this.gameData = { initialized: true, variable: "" };
  }

  initializePlayers(playerIds: string[]): void {
    const players: CheckersPlayer[] = [];
    for (const playerId of playerIds) {
      players.push(new CheckersPlayer(playerId, ""));
    }
    this.players = players;
  }

  initializeGameImplementation(): void {
    this.gameData = {
      initialized: true,
      variable: "",
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
