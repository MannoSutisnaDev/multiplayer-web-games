"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GlobalContextInterface,
  SelectedPieceData,
} from "@/client/internals/global/types";
import { QuadrilateralInterface } from "@/client/types";
import {
  convertToGamePositionKey,
  generateQuadrilateral,
  getClientXAndY,
  quadrilateralOverlapPercentage,
} from "@/client/utils";
import {
  COLUMNS,
  ROWS,
} from "@/shared/types/socket-communication/games/game-types";
import { debounce } from "@/shared/utility";

export const GlobalContextWrapper = createContext<GlobalContextInterface>({
  isDragging: false,
  setIsDragging: () => {},
  isDraggingRef: null,
  calculatingAreasRef: null,
  gamePositionsRef: null,
  areasDataRef: null,
  calculateAreasData: () => {},
  selectedPieceRef: null,
});

export default function GlobalContext({ children }: PropsWithChildren) {
  const isDraggingRef = useRef(false);
  const calculatingAreasRef = useRef<boolean>(false);
  const gamePositionsRef = useRef<Map<string, HTMLElement>>(new Map());
  const areasDataRef = useRef<Map<string, QuadrilateralInterface>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const selectedPieceRef = useRef<SelectedPieceData | null>(null);

  const calculateAreasDataProto = useCallback(() => {
    const gamePositions = gamePositionsRef?.current;
    const areasData = areasDataRef?.current;
    if (
      !gamePositions ||
      gamePositions.size < ROWS * COLUMNS ||
      !areasData ||
      calculatingAreasRef.current
    ) {
      return;
    }
    calculatingAreasRef.current = true;
    for (const [key, value] of gamePositions.entries()) {
      const rect = value.getBoundingClientRect();
      areasData.set(
        key,
        generateQuadrilateral(rect.x, rect.y, rect.width, rect.height)
      );
    }
    calculatingAreasRef.current = false;
  }, []);

  const calculateAreasData = useCallback(debounce(calculateAreasDataProto), [
    calculateAreasDataProto,
  ]);

  useEffect(() => {
    const resizeListener = () => {
      calculateAreasData();
    };
    window.addEventListener("resize", resizeListener);
    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, [calculateAreasData]);

  return (
    <GlobalContextWrapper.Provider
      value={{
        isDragging,
        setIsDragging,
        isDraggingRef,
        calculatingAreasRef,
        gamePositionsRef,
        areasDataRef,
        calculateAreasData,
        selectedPieceRef,
      }}
    >
      <body
        className={`${isDragging ? "dragging" : ""}`}
        onMouseUp={(e) => {
          e.preventDefault();
          const piece = selectedPieceRef.current;
          if (!isDragging || !piece) {
            return;
          }
          const pieceElement = piece.element;
          const pieceRect = pieceElement.getBoundingClientRect();
          const pieceQuadrilateral = generateQuadrilateral(
            pieceRect.x,
            pieceRect.y,
            pieceRect.width,
            pieceRect.height
          );
          const highestPercentage: {
            key: string | null;
            percentage: number;
          } = {
            key: null,
            percentage: Number.MIN_VALUE,
          };
          for (const [
            key,
            cellQuadrilateral,
          ] of areasDataRef.current.entries()) {
            const overlapPercentage = quadrilateralOverlapPercentage(
              pieceQuadrilateral,
              cellQuadrilateral
            );
            if (
              overlapPercentage > 60 &&
              overlapPercentage > highestPercentage.percentage
            ) {
              highestPercentage.percentage = overlapPercentage;
              highestPercentage.key = key;
            }
          }

          if (!highestPercentage.key) {
            pieceElement.style.left = "initial";
            pieceElement.style.top = "initial";
          } else {
            const entry = areasDataRef.current.get(highestPercentage.key);
            const gamePosition = gamePositionsRef.current.get(
              highestPercentage.key
            );
            const currentArea = areasDataRef.current.get(
              convertToGamePositionKey({
                column: piece.selectedPiece.column,
                row: piece.selectedPiece.row,
              })
            );
            if (!entry || !gamePosition || !currentArea) {
              return;
            }
            const deltaX =
              entry.startX -
              currentArea.startX +
              entry.width / 2 -
              pieceRect.width / 2;
            const deltaY =
              entry.startY -
              currentArea.startY +
              entry.height / 2 -
              pieceRect.height / 2;
            pieceElement.style.left = `${deltaX}px`;
            pieceElement.style.top = `${deltaY}px`;
          }
          setIsDragging(false);
        }}
        onMouseMove={(e) => {
          e.preventDefault();
          const piece = selectedPieceRef.current?.element;
          if (!isDragging || !piece) {
            return;
          }
          const { clientX, clientY } = getClientXAndY(e);
          const rect = piece.getBoundingClientRect();
          const deltaX = piece.offsetLeft + (clientX - rect.x - rect.width / 2);
          const deltaY = piece.offsetTop + (clientY - rect.y - rect.height / 2);
          piece.style.left = deltaX + "px";
          piece.style.top = deltaY + "px";
        }}
      >
        {children}
      </body>
    </GlobalContextWrapper.Provider>
  );
}
