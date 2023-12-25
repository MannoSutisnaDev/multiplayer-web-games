import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import {
  CheckersPiece,
  MoveMode,
} from "@/shared/types/socket-communication/games/game-types";

export default class Piece
  implements CheckersPiece, RebuildableModelInterface<CheckersPiece>
{
  index: number;
  playerIndex: number;
  moveMode: MoveMode;

  constructor(index: number = -1, playerIndex: number = -1) {
    this.index = index;
    this.playerIndex = playerIndex;
    this.moveMode = MoveMode.REGULAR;
  }

  rebuild(data: CheckersPiece) {
    this.playerIndex = data.playerIndex;
    this.moveMode = data.moveMode;
  }
}
