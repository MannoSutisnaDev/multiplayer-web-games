"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { BodyContextWrapper } from "@/client/internals/body/BodyContext";
import { SelectedPieceData } from "@/client/internals/games/checkers/types";
import Cell from "@/client/internals/games/shared/chess-board/Cell";
import {
  BoardProps,
  BoardPropsPreRender,
  ChessBoardInterface,
} from "@/client/internals/games/shared/chess-board/types";
import { QuadrilateralInterface } from "@/client/types";
import {
  convertToGamePosition,
  convertToGamePositionKey,
  generateQuadrilateral,
  getClientXAndY,
  quadrilateralOverlapPercentage,
} from "@/client/utils";
import {
  CellCollection,
  COLUMNS,
  Piece,
  ROWS,
} from "@/shared/types/socket-communication/games/game-types";
import { debounce } from "@/shared/utility";

export const ChessBoardContext = createContext<ChessBoardInterface>({
  isDragging: false,
  setSelectedPiece: () => null,
  selectedPiece: null,
  selectedPieceRef: null,
  calculatingAreasRef: null,
  gamePositionsRef: null,
  areasDataRef: null,
  timestamp: null,
  setTimestamp: () => null,
  gameCells: [],
  setGameCells: () => {},
});

export default function ChessBoardWrapper<
  P extends BoardPropsPreRender<T>,
  T extends Piece,
>(WrappedComponent: React.ComponentType<BoardProps<T>>) {
  const ChessBoard = (props: P) => {
    const { setBodyClass, bodyRef } = useContext(BodyContextWrapper);

    const calculatingAreasRef = useRef<boolean>(false);
    const gamePositionsRef = useRef<Map<string, HTMLElement>>(new Map());
    const areasDataRef = useRef<Map<string, QuadrilateralInterface>>(new Map());
    const selectedPieceRef = useRef<SelectedPieceData | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPiece, setSelectedPiece] =
      useState<SelectedPieceData | null>(null);
    const [timestamp, setTimestamp] = useState<number>(new Date().getTime());
    const [gameCells, setGameCells] = useState<
      CellCollection<Pick<T, "playerIndex">>
    >([]);

    const setSelectedPieceFull = useCallback(
      (selectedPiece: SelectedPieceData | null, drop: boolean = false) => {
        if (selectedPiece) {
          if (drop) {
            selectedPiece.dropped = true;
            setBodyClass("");
            setIsDragging(false);
          } else {
            selectedPiece.dropped = false;
            setBodyClass("dragging");
            setIsDragging(true);
          }
          selectedPieceRef.current = selectedPiece;
          setSelectedPiece(selectedPiece);
        } else {
          setBodyClass("");
          setIsDragging(false);
          selectedPieceRef.current = null;
          setSelectedPiece(null);
        }
      },
      [setBodyClass]
    );

    const calculateAreasData = useCallback(() => {
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

    useEffect(() => {
      const body = bodyRef?.current;
      if (!body) {
        return;
      }
      const mouseMove = (e: Event) => {
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
      };
      const mouseUp = (e: Event) => {
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
        calculateAreasData();
        const highestPercentage: {
          key: string | null;
          percentage: number;
        } = {
          key: null,
          percentage: Number.MIN_VALUE,
        };
        for (const [key, cellQuadrilateral] of areasDataRef.current.entries()) {
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
        if (
          !highestPercentage.key ||
          convertToGamePositionKey({
            row: piece.selectedPiece.row,
            column: piece.selectedPiece.column,
          }) === highestPercentage.key
        ) {
          pieceElement.style.left = "initial";
          pieceElement.style.top = "initial";
          setSelectedPieceFull(null);
          return;
        }
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
        if (!selectedPieceRef.current) {
          return;
        }
        const { row: targetRow, column: targetColumn } = convertToGamePosition(
          highestPercentage.key
        );
        if (selectedPiece) {
          const newSelectedPiece = {
            ...selectedPiece,
          };
          setSelectedPieceFull(newSelectedPiece, true);
        }
        props.movePiece({
          origin: {
            row: selectedPieceRef.current.selectedPiece.row,
            column: selectedPieceRef.current.selectedPiece.column,
          },
          target: {
            row: parseInt(targetRow),
            column: parseInt(targetColumn),
          },
        });
      };
      body.addEventListener("mousemove", mouseMove);
      body.addEventListener("mouseup", mouseUp);
      return () => {
        if (!body) {
          return;
        }
        body.removeEventListener("mousemove", mouseMove);
        body.removeEventListener("mouseup", mouseUp);
      };
    }, [bodyRef, isDragging, props, selectedPiece, setSelectedPieceFull]);

    const rowCollection: Array<Array<JSX.Element>> = [];
    for (const cells of gameCells) {
      const columnCollection: Array<JSX.Element> = [];
      for (const cell of cells) {
        columnCollection.push(
          <Cell
            key={`cell-${convertToGamePositionKey({
              column: cell.column,
              row: cell.row,
            })}`}
            index={cell.index}
            row={cell.row}
            column={cell.column}
            playerPiece={cell.playerPiece as T}
            renderPiece={props.renderPiece}
          />
        );
      }
      rowCollection.push(columnCollection);
    }
    const board = (
      <div className={`board ${props.boardClass ?? ""}`}>
        {rowCollection.map((columnCollection, rowIndex) => {
          return (
            <div key={`row-${rowIndex}`} className="row">
              {columnCollection.map((column) => {
                return column;
              })}
            </div>
          );
        })}
      </div>
    );

    return (
      <ChessBoardContext.Provider
        value={{
          isDragging,
          setSelectedPiece: setSelectedPieceFull,
          calculatingAreasRef,
          gamePositionsRef,
          areasDataRef,
          selectedPiece,
          selectedPieceRef,
          gameCells,
          setGameCells,
          timestamp,
          setTimestamp,
        }}
      >
        <WrappedComponent {...props} board={board} />
      </ChessBoardContext.Provider>
    );
  };
  return ChessBoard;
}
