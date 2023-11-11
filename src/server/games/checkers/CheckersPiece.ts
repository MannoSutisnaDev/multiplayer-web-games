import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import {
  MoveMode,
  Piece as PieceInterface,
} from "@/shared/types/socket-communication/games/game-types";

export default class Piece
  implements PieceInterface, RebuildableModelInterface<PieceInterface>
{
  index: number;
  playerIndex: number;
  moveMode: MoveMode;

  constructor(index: number = -1, playerIndex: number = -1) {
    this.index = index;
    this.playerIndex = playerIndex;
    this.moveMode = MoveMode.REGULAR;
  }

  rebuild(data: PieceInterface) {
    this.index = data.index;
    this.playerIndex = data.playerIndex;
    this.moveMode = data.moveMode;
  }
}
