import BasePlayerModel from "@/server/games/base/BasePlayerModel";
import { ChessPlayerInterface } from "@/server/games/types";
import { PlayerState } from "@/shared/types/socket-communication/games/chess";
import { PiecesDirection } from "@/shared/types/socket-communication/games/game-types";

export default class ChessPlayer
  extends BasePlayerModel<ChessPlayerInterface>
  implements ChessPlayerInterface
{
  direction: PiecesDirection | null;
  state: PlayerState;
  constructor(id: string = "", name: string = "") {
    super(id, name);
    this.direction = null;
    this.state = PlayerState.Regular;
  }

  setDirection(direction: PiecesDirection | null) {
    this.direction = direction;
  }

  setState(state: PlayerState) {
    this.state = state;
  }

  rebuildImplementation(data: ChessPlayerInterface) {
    this.direction = data.direction;
    this.state = data.state;
  }
}
