import BasePlayerModel, {
  BasePlayerModelInterface,
} from "@/server/games/base/BasePlayerModel";
import {
  GamePosition,
  PiecesDirection,
} from "@/shared/types/socket-communication/games/game-types";

export interface CheckersPlayerInterface extends BasePlayerModelInterface {
  direction: PiecesDirection | null;
  pieceThatHasStrikedPosition: GamePosition | null;
}

export default class CheckersPlayer
  extends BasePlayerModel<CheckersPlayerInterface>
  implements CheckersPlayerInterface
{
  direction: PiecesDirection | null;
  pieceThatHasStrikedPosition: GamePosition | null;
  constructor(id: string = "", name: string = "") {
    super(id, name);
    this.direction = null;
    this.pieceThatHasStrikedPosition = null;
  }

  setDirection(direction: PiecesDirection | null) {
    this.direction = direction;
  }

  setPieceThatHasStrikedPosition(
    pieceThatHasStrikedPosition: GamePosition | null
  ) {
    this.pieceThatHasStrikedPosition = pieceThatHasStrikedPosition;
  }

  rebuildImplementation(data: CheckersPlayerInterface) {
    this.id = data.id;
    this.ready = data.ready;
    this.name = data.name;
    this.direction = data.direction;
    this.pieceThatHasStrikedPosition = data.pieceThatHasStrikedPosition;
  }
}
