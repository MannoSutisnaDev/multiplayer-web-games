import { Dispatch, MutableRefObject, SetStateAction } from "react";

import { QuadrilateralInterface } from "@/client/types";

export interface GlobalContextInterface {
  isDragging: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  isDraggingRef: MutableRefObject<boolean> | null;
  calculatingAreasRef: MutableRefObject<boolean> | null;
  gamePositionsRef: MutableRefObject<Map<string, HTMLElement>> | null;
  areasDataRef: MutableRefObject<Map<string, QuadrilateralInterface>> | null;
  calculateAreasData: () => void;
  selectedPieceRef: MutableRefObject<SelectedPieceData | null> | null;
}

export interface SelectedPiece {
  row: number;
  column: number;
  playerIndex: number;
}

export interface SelectedPieceData {
  selectedPiece: SelectedPiece;
  element: HTMLDivElement;
}
