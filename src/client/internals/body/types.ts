import { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";

import { QuadrilateralInterface } from "@/client/types";
import { CheckersGameDataInterface } from "@/server/games/types";

export interface BodyContextInterface {
  bodyClass: string;
  setBodyClass: Dispatch<SetStateAction<string>>;
  bodyRef: RefObject<HTMLBodyElement> | null;
}

export interface CheckersContextInterface {
  isDragging: boolean;
  setSelectedPiece: (selectedPiece: SelectedPieceData) => void;
  selectedPiece: SelectedPieceData | null;
  calculatingAreasRef: MutableRefObject<boolean> | null;
  gamePositionsRef: MutableRefObject<Map<string, HTMLElement>> | null;
  areasDataRef: MutableRefObject<Map<string, QuadrilateralInterface>> | null;
  calculateAreasData: () => void;
  selectedPieceRef: MutableRefObject<SelectedPieceData | null> | null;
  gameData: CheckersGameDataInterface | null;
  timestamp: number | null;
}

export interface SelectedPiece {
  row: number;
  column: number;
  playerIndex: number;
}

export interface SelectedPieceData {
  selectedPiece: SelectedPiece;
  dropped: boolean;
  element: HTMLDivElement;
}
