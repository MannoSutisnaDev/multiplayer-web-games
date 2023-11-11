import BasePlayerModel from "@/server/games/base/BasePlayerModel";
import { CheckersPlayerInterface } from "@/server/games/types";
import {
  GamePosition,
  PiecesDirection,
} from "@/shared/types/socket-communication/games/game-types";

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
    this.direction = data.direction;
    this.pieceThatHasStrikedPosition = data.pieceThatHasStrikedPosition;
  }
}
