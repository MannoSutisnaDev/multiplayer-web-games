import { Dispatch, MutableRefObject, SetStateAction } from "react";

import { SelectedPieceData } from "@/client/internals/games/checkers/types";
import { TwoPlayerTurnBasedProps } from "@/client/internals/games/shared/two-player-turn-based/types";
import { QuadrilateralInterface } from "@/client/types";
import {
  Cell,
  CellCollection,
  OriginTargetPayload,
  Piece,
} from "@/shared/types/socket-communication/games/game-types";

export interface ChessBoardInterface {
  isDragging: boolean;
  setSelectedPiece: (
    selectedPiece: SelectedPieceData | null,
    drop: boolean
  ) => void;
  selectedPiece: SelectedPieceData | null;
  calculatingAreasRef: MutableRefObject<boolean> | null;
  gamePositionsRef: MutableRefObject<Map<string, HTMLElement>> | null;
  areasDataRef: MutableRefObject<Map<string, QuadrilateralInterface>> | null;
  selectedPieceRef: MutableRefObject<SelectedPieceData | null> | null;
  gameCells: CellCollection<Piece>;
  setGameCells: Dispatch<SetStateAction<CellCollection<Piece>>>;
}

export interface BoardProps<T extends Piece> extends TwoPlayerTurnBasedProps {
  renderPiece: (cell: Cell<T> | null) => React.ReactNode;
  movePiece: (payload: OriginTargetPayload) => void;
  board: React.ReactNode;
  boardClass?: string;
}

export type BoardPropsPreRender<T extends Piece> = Pick<
  BoardProps<T>,
  "renderPiece" | "leaveFunction" | "movePiece" | "boardClass" | "resetFunction"
>;
